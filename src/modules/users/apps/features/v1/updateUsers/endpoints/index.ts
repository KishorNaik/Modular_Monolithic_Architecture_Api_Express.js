import { StatusCodes } from 'http-status-codes';
import {
	Body,
	Get,
	HttpCode,
	JsonController,
	OnUndefined,
	Post,
	Put,
	Req,
	Res,
	UseBefore,
} from 'routing-controllers';
import { Response,Request } from 'express';
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
import { GetUsersByClientIdService } from '@/modules/users/shared/services/getUserByClientId';
import { IUsers } from '@/modules/users/shared/types';
import { UserTokenProviderService } from '@/shared/services/users/userTokenProvider.service';
import { UpdateUserDecryptRequestService } from './services/decryptRequest';
import { UpdateUserValidationRequestService } from './services/validations';
import { UpdateUserRequestDto, UpdateUserResponseDto } from '../contracts';
import { IMapUpdateUserRequestToEntityResults, MapUpdateUserRequestToEntityService } from './services/entityMap';
import { UpdateUserDbService } from './services/db';
import { UpdateUserEncryptResponseService } from './services/encryptResponse';

// @region Controller
@JsonController('/api/v1/users')
@OpenAPI({ tags: ['users'] })
export class UpdateUserController {
  @Put()
  @OpenAPI({ summary: 'Update User', tags: ['users'] })
  @HttpCode(StatusCodes.OK)
  @OnUndefined(StatusCodes.BAD_REQUEST)
  @UseBefore(authenticateHmac,authenticateJwt,authorizeRole(RoleEnum.USER), ValidationMiddleware(AesRequestDto))
  public async updateAsync(@Body() request: AesRequestDto, @Req() req: Request, @Res() res: Response) {
    const response=await mediatR.send(new UpdateUserCommand(request,req));
    return res.status(response.StatusCode).json(response);
  }
}
// @endregion

// @region Command
class UpdateUserCommand extends RequestData<ApiDataResponse<AesResponseDto>>{
  private readonly _request: AesRequestDto;
  private readonly _expressRequest:Request;

  public constructor(request: AesRequestDto, expressRequest:Request) {
    super();
    this._request=request;
    this._expressRequest=expressRequest;
  }

  public get request(): AesRequestDto {
    return this._request;
  }

  public get expressRequest(): Request {
    return this._expressRequest;
  }
}

// @endregion

// @region Command Handler
@sealed
@requestHandler(UpdateUserCommand)
class UpdateUserCommandHandler implements RequestHandler<UpdateUserCommand,ApiDataResponse<AesResponseDto>> {

  private readonly _getUsersByClientIdService: GetUsersByClientIdService;
  private readonly _userTokenProviderService: UserTokenProviderService;
  private readonly _updateUserDecryptRequestService:UpdateUserDecryptRequestService;
  private readonly _updateUserValidationRequestService:UpdateUserValidationRequestService;
  private readonly _mapUpdateUserRequestToEntityService:MapUpdateUserRequestToEntityService;
  private readonly _updateUserDbService:UpdateUserDbService;
  private readonly _updateUserEncryptResponseService:UpdateUserEncryptResponseService;
  private readonly _userSharedCacheService:UserSharedCacheService;

  public constructor(){
    this._getUsersByClientIdService=Container.get(GetUsersByClientIdService);
    this._userTokenProviderService = Container.get(UserTokenProviderService);
    this._updateUserDecryptRequestService=Container.get(UpdateUserDecryptRequestService);
    this._updateUserValidationRequestService=Container.get(UpdateUserValidationRequestService);
    this._mapUpdateUserRequestToEntityService=Container.get(MapUpdateUserRequestToEntityService);
    this._updateUserDbService=Container.get(UpdateUserDbService);
    this._updateUserEncryptResponseService=Container.get(UpdateUserEncryptResponseService);
    this._userSharedCacheService=Container.get(UserSharedCacheService);
  }

  public async handle(value: UpdateUserCommand): Promise<ApiDataResponse<AesResponseDto>> {
    const queryRunner = getQueryRunner();
		await queryRunner.connect();

    try
    {
      // @guard
      if (!value)
        return DataResponseFactory.error(StatusCodes.BAD_REQUEST,"Invalid command");

      if(!value.request)
        return DataResponseFactory.error(StatusCodes.BAD_REQUEST,"Invalid request");

      if(!value.expressRequest)
        return DataResponseFactory.error(StatusCodes.BAD_REQUEST,"Invalid express request");

      const {request,expressRequest}=value;

      // Get ClientId from Header
      const clientId = expressRequest.headers['x-client-id'] as string;
			if (!clientId)
				return DataResponseFactory.error(StatusCodes.UNAUTHORIZED, `Client Id is required`);

      // Get User data from Cache by Client Id
      const getUsersByClientIdServiceResult =
              await this._getUsersByClientIdService.handleAsync({
                clientId: clientId,
              });
      if (getUsersByClientIdServiceResult.isErr()) {
        logger.error(
          logConstruct(
            `UpdateUserCommandHandler`,
            `GetUsersByClientIdService`,
            getUsersByClientIdServiceResult.error.message
          )
        );
        return DataResponseFactory.error(
          getUsersByClientIdServiceResult.error.status,
          getUsersByClientIdServiceResult.error.message
        );
      }

      let users: IUsers = getUsersByClientIdServiceResult.value;
      // Get Aes Token
      const aesToken: string = users.keys.aesSecretKey;
      logger.info(
        logConstruct(
          `UpdateUserCommandHandler`,
          `GetUsersByClientIdService`,
          `Get User By Client Id Success`
        )
      );

      // Decrypt Service
      const updateUserDecryptRequestServiceResult = await this._updateUserDecryptRequestService.handleAsync({
        data:request.body,
        key:aesToken
      });
      if(updateUserDecryptRequestServiceResult.isErr()){
        logger.error(
					logConstruct(`UpdateUserCommandHandler`, `UpdateUserDecryptRequestService`, updateUserDecryptRequestServiceResult.error.message)
				);
        return DataResponseFactory.error(updateUserDecryptRequestServiceResult.error.status,updateUserDecryptRequestServiceResult.error.message);
      }

      const updateUserRequestDto:UpdateUserRequestDto=updateUserDecryptRequestServiceResult.value;
      logger.info(logConstruct(`UpdateUserCommandHandler`, `UpdateUserDecryptRequestService`, `Decrypt Success`));

       // Check User Valid
      const userId = await this._userTokenProviderService.getUserId(expressRequest);
			if (!userId) {
				logger.error(
					logConstruct(`UpdateUserCommandHandler`, `handle`, `Unauthorized`)
				);
				return DataResponseFactory.error(StatusCodes.UNAUTHORIZED, `Unauthorized`);
			}
			if (users.identifier !== userId) {
				logger.error(
					logConstruct(`UpdateUserCommandHandler`, `handle`, `Unauthorized`)
				);
				return DataResponseFactory.error(StatusCodes.UNAUTHORIZED, `Unauthorized`);
			}
      if(updateUserRequestDto.identifier !== userId) {
        logger.error(
					logConstruct(`UpdateUserCommandHandler`, `handle`, `Unauthorized`)
				);
				return DataResponseFactory.error(StatusCodes.UNAUTHORIZED, `Unauthorized`);
      }
      if(users.status===StatusEnum.INACTIVE)
      {
        logger.error(
					logConstruct(`UpdateUserCommandHandler`, `handle`, `Forbidden`)
				);
				return DataResponseFactory.error(StatusCodes.FORBIDDEN, `Forbidden`);
      }

			logger.info(logConstruct(`UpdateUserCommandHandler`, `handle`, `Authorized`));

      // Validation Service
      const updateUserValidationRequestServiceResult = await this._updateUserValidationRequestService.handleAsync({
        dto:updateUserRequestDto,
        dtoClass:UpdateUserRequestDto
      });
      if(updateUserValidationRequestServiceResult.isErr()){
        logger.error(
					logConstruct(`UpdateUserCommandHandler`, `UpdateUserValidationRequestService`, updateUserValidationRequestServiceResult.error.message)
				);
        return DataResponseFactory.error(updateUserValidationRequestServiceResult.error.status,updateUserValidationRequestServiceResult.error.message);
      }
      logger.info(logConstruct(`UpdateUserCommandHandler`, `UpdateUserValidationRequestService`, `Validation Success`));

      // Entity Map Service
      const mapUpdateUserRequestToEntityServiceResult = await this._mapUpdateUserRequestToEntityService.handleAsync({
        request: updateUserRequestDto,
        users:users
      });
      if(mapUpdateUserRequestToEntityServiceResult.isErr()){
        logger.error(
					logConstruct(`UpdateUserCommandHandler`, `MapUpdateUserRequestToEntityService`, mapUpdateUserRequestToEntityServiceResult.error.message)
				);
        return DataResponseFactory.error(mapUpdateUserRequestToEntityServiceResult.error.status,mapUpdateUserRequestToEntityServiceResult.error.message);
      }

      const entity:IMapUpdateUserRequestToEntityResults=mapUpdateUserRequestToEntityServiceResult.value;
      logger.info(logConstruct(`UpdateUserCommandHandler`, `MapUpdateUserRequestToEntityService`, `Map Success`));

      // Update User Db Service
      await queryRunner.startTransaction('SERIALIZABLE');

      const updateUserDbServiceResult = await this._updateUserDbService.handleAsync({
        entity:{
          users:entity.entity.users,
          communication:entity.entity.communication,
          credentials:entity.entity.credentials
        },
        queryRunner:queryRunner,
      })
      if(updateUserDbServiceResult.isErr()){
        logger.error(
					logConstruct(`UpdateUserCommandHandler`, `UpdateUserDbService`, updateUserDbServiceResult.error.message)
				);
        await queryRunner.rollbackTransaction();
        logger.error(
					logConstruct(`UpdateUserCommandHandler`, `UpdateUserDbService`, `Rollback Transaction`)
				);
        return DataResponseFactory.error(updateUserDbServiceResult.error.status,updateUserDbServiceResult.error.message);
      }
      logger.info(logConstruct(`UpdateUserCommandHandler`, `MapUpdateUserRequestToEntityService`, `Update Success`));

      // Map Response
      const updateUserResponseDto:UpdateUserResponseDto=new UpdateUserResponseDto();
      updateUserResponseDto.message=`Update User Success`;

      // Encrypt Response
      const updateUserEncryptResponseServiceResult=await this._updateUserEncryptResponseService.handleAsync({
        data:updateUserResponseDto,
        key:aesToken
      });
      if(updateUserEncryptResponseServiceResult.isErr()){
        logger.error(
					logConstruct(`UpdateUserCommandHandler`, `UpdateUserEncryptResponseService`, updateUserEncryptResponseServiceResult.error.message)
				);
        await queryRunner.rollbackTransaction();
        logger.error(
					logConstruct(`UpdateUserCommandHandler`, `UpdateUserEncryptResponseService`, `Rollback Transaction`)
				);
        return DataResponseFactory.error(updateUserEncryptResponseServiceResult.error.status,updateUserEncryptResponseServiceResult.error.message);
      }
      const aesResponseDto:AesResponseDto=updateUserEncryptResponseServiceResult.value.aesResponseDto;
      logger.info(logConstruct(`UpdateUserCommandHandler`, `UpdateUserEncryptResponseService`, `Encrypt Success`));

      // Update Cache
      const userSharedCacheServiceResult=await this._userSharedCacheService.handleAsync({
        queryRunner:queryRunner,
        identifier:entity.entity.users.identifier,
        status:entity.entity.users.status
      });
      if(userSharedCacheServiceResult.isErr()){
        logger.error(
					logConstruct(`UpdateUserCommandHandler`, `UserSharedCacheService`, userSharedCacheServiceResult.error.message)
				);
        await queryRunner.rollbackTransaction();
        logger.error(
					logConstruct(`UpdateUserCommandHandler`, `UserSharedCacheService`, `Rollback Transaction`)
				);
        return DataResponseFactory.error(userSharedCacheServiceResult.error.status,userSharedCacheServiceResult.error.message);
      }
      logger.info(logConstruct(`UpdateUserCommandHandler`, `UserSharedCacheService`, `Update Cache Success`));
      await queryRunner.commitTransaction();

      // return
      return DataResponseFactory.success(StatusCodes.OK, aesResponseDto);
    }
    catch(ex){
      const error = ex as Error;
			logger.error(logConstruct(`UpdateUserCommandHandler`, `handle`, error.message, ex));
			if (queryRunner.isTransactionActive) {
				await queryRunner.rollbackTransaction();
				logger.warn(
					logConstruct(`UpdateUserCommandHandler`, `handle`, `Rollback Transaction`)
				);
			}
			return DataResponseFactory.error(StatusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
    finally
    {
      await queryRunner.release();
			logger.info(logConstruct(`UpdateUserCommandHandler`, `handle`, `Release Transaction`));
    }

  }

}
// @endregion

