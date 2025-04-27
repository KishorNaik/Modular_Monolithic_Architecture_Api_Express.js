import { StatusCodes } from 'http-status-codes';
import {
  Body,
  Delete,
  Get,
  HttpCode,
  JsonController,
  OnUndefined,
  Param,
  Post,
  Put,
  Req,
  Res,
  UseBefore,
} from 'routing-controllers';
import { Response, Request } from 'express';
import { OpenAPI } from 'routing-controllers-openapi';
import { AesRequestDto } from '@/shared/models/request/aes.RequestDto';
import { RequestData, RequestHandler, requestHandler } from 'mediatr-ts';
import {
  DataResponse as ApiDataResponse,
  DataResponse,
  DataResponseFactory,
} from '@/shared/models/response/data.Response';
import { AesResponseDto } from '@/shared/models/response/aes.ResponseDto';
import { sealed } from '@/shared/utils/decorators/sealed';
import { ENCRYPTION_KEY } from '@/config';
import Container from 'typedi';
import mediatR from '@/shared/medaitR/index';
import { getQueryRunner, StatusEnum } from '@kishornaik/mma_db';
import { UserSharedCacheService } from '@/modules/users/shared/cache';
import { ValidationMiddleware } from '@/middlewares/validation.middleware';
import { logConstruct, logger } from '@/shared/utils/helpers/loggers';
import { authenticateHmac } from '@/middlewares/hmac.middlware';
import { authenticateJwt, authorizeRole } from '@/middlewares/auth.middleware';
import { RoleEnum } from '@/shared/models/enums/role.enum';
import { DeactivateUserRequestDto, DeactivateUserResponseDto } from '../contracts';
import { UserTokenProviderService } from '@/shared/services/users/userTokenProvider.service';
import { GetUserByIdentifierService } from '../../getUsersByIdentifier/endpoint/services/getUsersByIdentifier';
import { DeactivateUserRequestValidationService } from './services/validations';
import { IUsers } from '@/modules/users/shared/types';
import { ActiveDeactivateUsersDbService } from '@/modules/users/shared/services/active_deactiveUsers';
import { DeactivatedUserEncryptResponseService } from './services/encryptResponse';

//@region Controller
@JsonController('/api/v1/users')
@OpenAPI({ tags: ['users'] })
export class DeactivateUserController {
  @Delete("/:identifier")
  @OpenAPI({ summary: 'deactivate User', tags: ['users'] })
	@HttpCode(StatusCodes.OK)
	@OnUndefined(StatusCodes.BAD_REQUEST)
	@UseBefore(
		authenticateHmac,
		authenticateJwt,
		authorizeRole(RoleEnum.USER)
	)
  public async deactivateAsync(
      @Param('identifier') identifier: string,
      @Req() req: Request,
      @Res() res: Response
    ) {
      const requestDto: DeactivateUserRequestDto = new DeactivateUserRequestDto();
      requestDto.identifier = identifier;
      const response = await mediatR.send(new DeactivateUserCommand(requestDto, req));
      return res.status(response.StatusCode).json(response);
    }
}
//@endregion

//@region Command
class DeactivateUserCommand extends RequestData<ApiDataResponse<AesResponseDto>>{
  private readonly _request: DeactivateUserRequestDto;
  private readonly _expressRequest: Request;
  public constructor(request: DeactivateUserRequestDto, expressRequest: Request) {
    super();
    this._request = request;
    this._expressRequest = expressRequest;
  }

  public get request(): DeactivateUserRequestDto {
    return this._request;
  }

  public get expressRequest(): Request {
    return this._expressRequest;
  }
}
//@endregion

//@region Command Handler
@sealed
@requestHandler(DeactivateUserCommand)
class DeactivateUserCommandHandler implements RequestHandler<DeactivateUserCommand,ApiDataResponse<AesResponseDto>> {

  private readonly _userTokenProviderService: UserTokenProviderService;
  private readonly _getUserByIdentifierService: GetUserByIdentifierService;
  private readonly _deactivateUserRequestValidationService:DeactivateUserRequestValidationService;
  private readonly _activeDeactivateUsersDbService:ActiveDeactivateUsersDbService;
  private readonly _deactivatedUserEncryptResponseService:DeactivatedUserEncryptResponseService;
  private readonly _userSharedCacheService: UserSharedCacheService;

  public constructor(){
    this._userTokenProviderService = Container.get(UserTokenProviderService);
    this._getUserByIdentifierService = Container.get(GetUserByIdentifierService);
    this._deactivateUserRequestValidationService= Container.get(DeactivateUserRequestValidationService);
    this._activeDeactivateUsersDbService=Container.get(ActiveDeactivateUsersDbService);
    this._deactivatedUserEncryptResponseService=Container.get(DeactivatedUserEncryptResponseService);
    this._userSharedCacheService = Container.get(UserSharedCacheService);
  }

  public async handle(value: DeactivateUserCommand): Promise<ApiDataResponse<AesResponseDto>> {
    const queryRunner = getQueryRunner();
		await queryRunner.connect();
    try
    {
      // @Gaurd
			if (!value) return DataResponseFactory.error(StatusCodes.BAD_REQUEST, 'Invalid Query');

			if (!value.request)
				return DataResponseFactory.error(StatusCodes.BAD_REQUEST, 'Invalid request');

			if (!value.expressRequest)
				return DataResponseFactory.error(
					StatusCodes.BAD_REQUEST,
					'Invalid express request'
				);

			const { request, expressRequest } = value;

      // Is User Id Valid
			const userId = await this._userTokenProviderService.getUserId(expressRequest);
			if (!userId) {
				logger.error(
					logConstruct(`DeactivateUserCommandHandler`, `handle`, `Unauthorized`)
				);
				return DataResponseFactory.error(StatusCodes.UNAUTHORIZED, `Unauthorized`);
			}
			if (request.identifier !== userId) {
				logger.error(
					logConstruct(`DeactivateUserCommandHandler`, `handle`, `Unauthorized`)
				);
				return DataResponseFactory.error(StatusCodes.UNAUTHORIZED, `Unauthorized`);
			}

			logger.info(logConstruct(`DeactivateUserCommandHandler`, `handle`, `Authorized`));

      // Validation Service
      const deactivateValidationServiceResult=await this._deactivateUserRequestValidationService.handleAsync({
        dto:request,
        dtoClass:DeactivateUserRequestDto
      })
      if(deactivateValidationServiceResult.isErr()){
        logger.error(
					logConstruct(`DeactivateUserCommandHandler`, `DeactivateUserRequestValidationService`,deactivateValidationServiceResult.error.message)
				);
				return DataResponseFactory.error(deactivateValidationServiceResult.error.status, deactivateValidationServiceResult.error.message);
      }

      logger.info(logConstruct(`DeactivateUserCommandHandler`, `DeactivateUserRequestValidationService`, `Validation Success`));

      // Get User data from Cache by User Id
      const getUserByIdentifierServiceResult =
        await this._getUserByIdentifierService.handleAsync({
          status:StatusEnum.ACTIVE,
          userId:userId,
        });
      if (getUserByIdentifierServiceResult.isErr()) {
        logger.error(
          logConstruct(
            `DeactivateUserCommandHandler`,
            `GetUserByIdentifierService`,
            getUserByIdentifierServiceResult.error.message
          )
        );
        return DataResponseFactory.error(
          getUserByIdentifierServiceResult.error.status,
          getUserByIdentifierServiceResult.error.message
        );
      }
      const users: IUsers = getUserByIdentifierServiceResult.value;
      logger.info(logConstruct(`DeactivateUserCommandHandler`, `GetUserByIdentifierService`, `Success`));

      // Check User Id with Cache User Id
      if(users.identifier!==userId)
      {
        logger.error(
					logConstruct(`DeactivateUserCommandHandler`, `handle`, `Unauthorized`)
				);
				return DataResponseFactory.error(StatusCodes.UNAUTHORIZED, `Unauthorized`);
      }

      // Check User Status
      if(users.status===StatusEnum.INACTIVE)
      {
        logger.error(
					logConstruct(`DeactivateUserCommandHandler`, `handle`, `Unauthorized`)
				);
				return DataResponseFactory.error(StatusCodes.NOT_ACCEPTABLE, `User Already Deactivated`);
      }

      // Update Users
      await queryRunner.startTransaction('SERIALIZABLE');
      const activeDeactivateUsersDbServiceResult=await this._activeDeactivateUsersDbService.handleAsync({
        status:StatusEnum.INACTIVE,
        userId:userId,
        queryRunner:queryRunner
      })
      if (activeDeactivateUsersDbServiceResult.isErr()) {
        logger.error(
          logConstruct(
            `DeactivateUserCommandHandler`,
            `ActiveDeactivateUsersDbService`,
            activeDeactivateUsersDbServiceResult.error.message
          )
        );
        return DataResponseFactory.error(
          activeDeactivateUsersDbServiceResult.error.status,
          activeDeactivateUsersDbServiceResult.error.message
        );
      }
      logger.info(logConstruct(`DeactivateUserCommandHandler`, `ActiveDeactivateUsersDbService`, `Success`));

      // Map Response
      const deactivateUserResponseDto:DeactivateUserResponseDto=new DeactivateUserResponseDto();
      deactivateUserResponseDto.message=`User Deactivated Successfully`;

      // Encrypt Response
      const encryptResponseServiceResult=await this._deactivatedUserEncryptResponseService.handleAsync({
        data:deactivateUserResponseDto,
        key:users.keys.aesSecretKey
      });
      if(encryptResponseServiceResult.isErr()){
        logger.error(
          logConstruct(
            `DeactivateUserCommandHandler`,
            `DeactivatedUserEncryptResponseService`,
            encryptResponseServiceResult.error.message
          )
        );
        return DataResponseFactory.error(
          encryptResponseServiceResult.error.status,
          encryptResponseServiceResult.error.message
        );
      }
      const aesResponseDto:AesResponseDto=encryptResponseServiceResult.value.aesResponseDto;
      logger.info(logConstruct(`DeactivateUserCommandHandler`, `DeactivatedUserEncryptResponseService`, `Encrypt Response Success`));

      // Update Cache
      const userSharedCacheServiceResult = await this._userSharedCacheService.handleAsync({
				queryRunner: queryRunner,
				identifier: userId,
				status: StatusEnum.INACTIVE,
			});
			if (userSharedCacheServiceResult.isErr()) {
				logger.error(
					logConstruct(
						`DeactivateUserCommandHandler`,
						`UserSharedCacheService`,
						userSharedCacheServiceResult.error.message
					)
				);
				await queryRunner.rollbackTransaction();
				logger.error(
					logConstruct(
						`DeactivateUserCommandHandler`,
						`UserSharedCacheService`,
						`Rollback Transaction`
					)
				);
				return DataResponseFactory.error(
					userSharedCacheServiceResult.error.status,
					userSharedCacheServiceResult.error.message
				);
			}
			logger.info(
				logConstruct(
					`DeactivateUserCommandHandler`,
					`UserSharedCacheService`,
					`Update Cache Success`
				)
			);
      await queryRunner.commitTransaction();

      // return
      return DataResponseFactory.success(StatusCodes.OK, aesResponseDto);
    }
    catch(ex){
      const error = ex as Error;
			logger.error(logConstruct(`DeactivateUserCommandHandler`, `handle`, error.message, ex));
			if (queryRunner.isTransactionActive) {
				await queryRunner.rollbackTransaction();
				logger.warn(
					logConstruct(`DeactivateUserCommandHandler`, `handle`, `Rollback Transaction`)
				);
			}
			return DataResponseFactory.error(StatusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
    finally{
      await queryRunner.release();
			logger.info(logConstruct(`DeactivateUserCommandHandler`, `handle`, `Release Transaction`));
    }
  }

}

//@endregion
