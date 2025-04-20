import { StatusCodes } from 'http-status-codes';
import { Get, HttpCode, JsonController, OnUndefined, Param, Req, Res, UseBefore } from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';
import { Response,Request } from 'express';
import {
	DataResponse as ApiDataResponse,
	DataResponse,
	DataResponseFactory,
} from '@/shared/models/response/data.Response';
import { RequestData, RequestHandler, requestHandler } from 'mediatr-ts';
import medaitR from '@/shared/medaitR';
import { sealed } from '@/shared/utils/decorators/sealed';
import { AesResponseDto } from '@/shared/models/response/aes.ResponseDto';
import Container from 'typedi';
import { logConstruct, logger } from '@/shared/utils/helpers/loggers';
import { GetUserByIdentifierRequestDto, GetUserByIdentifierResponseDto } from '../contracts/Index';
import { UserTokenProviderService } from '@/shared/services/users/userTokenProvider.service';
import { authenticateJwt } from '@/middlewares/auth.middleware';
import { GetUserByIdentifierService } from './services/getUsersByIdentifier';
import { StatusEnum } from '@kishornaik/mma_db';
import { IUsers } from '@/modules/users/shared/types';
import { GetUserByIdentifierValidationRequestService } from './services/validations';
import { GetUsersByIdentifierResponseMapperService } from './services/mapResponse';
import { GetUsersByIdentifierResponseEncryptService } from './services/encryptResponse';

// @region Controller
@JsonController('/api/v1/users')
@OpenAPI({ tags: ['users'] })
export class GetUsersByIdentifierController {
  @Get('/:identifier')
  @OpenAPI({ summary: `get user by identifier`, tags: ['users'] })
  @HttpCode(StatusCodes.OK)
  @OnUndefined(StatusCodes.NOT_FOUND)
  @OnUndefined(StatusCodes.BAD_REQUEST)
  @UseBefore(authenticateJwt)
  public async get(@Param('identifier') identifier: string,@Req() req:Request, @Res() res: Response,){

  }
}
// @endregion

// @region Query
class GetUserByIdentifierQuery extends RequestData<ApiDataResponse<AesResponseDto>> {
  private readonly _request: GetUserByIdentifierRequestDto;
  private readonly _expressRequest:Request;

  public constructor(request:GetUserByIdentifierRequestDto, expressRequest:Request){
    super();
    this._request=request;
  }

  public get request(): GetUserByIdentifierRequestDto {
    return this._request;
  }

  public get expressRequest(): Request {
    return this._expressRequest;
  }
}
// @endregion

// @region Query Handler
@sealed
@requestHandler(GetUserByIdentifierQuery)
class GetUserByIdentifierQueryHandler implements RequestHandler<GetUserByIdentifierQuery,ApiDataResponse<AesResponseDto>> {

  private readonly _userTokenProviderService:UserTokenProviderService;
  private readonly _getUserByIdentifierService:GetUserByIdentifierService;
  private readonly _getUserByIdentifierValidationRequestService:GetUserByIdentifierValidationRequestService;
  private readonly _getUsersByIdentifierResponseMapper:GetUsersByIdentifierResponseMapperService;
  private readonly _getUsersByIdentifierResponseEncryptService:GetUsersByIdentifierResponseEncryptService;

  public constructor(){
    this._userTokenProviderService = Container.get(UserTokenProviderService);
    this._getUserByIdentifierService=Container.get(GetUserByIdentifierService);
    this._getUserByIdentifierValidationRequestService=Container.get(GetUserByIdentifierValidationRequestService);
    this._getUsersByIdentifierResponseMapper=Container.get(GetUsersByIdentifierResponseMapperService);
    this._getUsersByIdentifierResponseEncryptService=Container.get(GetUsersByIdentifierResponseEncryptService);
  }

  public async handle(value: GetUserByIdentifierQuery): Promise<ApiDataResponse<AesResponseDto>> {
    try
    {
      // @Gaurd
      if(!value)
        return DataResponseFactory.error(StatusCodes.BAD_REQUEST, 'Invalid Query');

      if(!value.request)
        return DataResponseFactory.error(StatusCodes.BAD_REQUEST, 'Invalid request');

      const {request, expressRequest} = value;

      // Is User Id Valid
      const userId=await this._userTokenProviderService.getUserId(expressRequest);
      if(!userId)
      {
        logger.error(
					logConstruct(
						`GetUserByIdentifierQueryHandler`,
						`handle`,
						`Unauthorized`
					)
				);
        return DataResponseFactory.error(StatusCodes.UNAUTHORIZED, `Unauthorized`);
      }
      if(request.identifier!==userId)
      {
        logger.error(
					logConstruct(
						`GetUserByIdentifierQueryHandler`,
						`handle`,
						`Unauthorized`
					)
				);
        return DataResponseFactory.error(StatusCodes.UNAUTHORIZED, `Unauthorized`);
      }

      logger.info(
				logConstruct(
					`GetUserByIdentifierQueryHandler`,
					`handle`,
					`Authorized`
				)
			);

      // Validation Service
      const getUserByIdentifierValidationRequestServiceResult=await this._getUserByIdentifierValidationRequestService.handleAsync({
        dto: request,
        dtoClass: GetUserByIdentifierRequestDto,
      });
      if(getUserByIdentifierValidationRequestServiceResult.isErr()){
        logger.error(
					logConstruct(
						`GetUserByIdentifierQueryHandler`,
						`GetUserByIdentifierValidationRequestService`,
            getUserByIdentifierValidationRequestServiceResult.error.message
					)
				);
        return DataResponseFactory.error(getUserByIdentifierValidationRequestServiceResult.error.status,getUserByIdentifierValidationRequestServiceResult.error.message);
      }

      logger.info(
				logConstruct(
					`GetUserByIdentifierQueryHandler`,
					`GetUserByIdentifierValidationRequestService`,
					`Validation Success`
				)
			);

      // Get User Data from cache by user Id
      const getUserByIdentifierServiceResult=await this._getUserByIdentifierService.handleAsync({
        userId:request.identifier,
        status:StatusEnum.ACTIVE
      });

      if(getUserByIdentifierServiceResult.isErr()){
        logger.error(
					logConstruct(
						`GetUserByIdentifierQueryHandler`,
						`GetUserByIdentifierService`,
            getUserByIdentifierServiceResult.error.message
					)
				);
        return DataResponseFactory.error(getUserByIdentifierServiceResult.error.status,getUserByIdentifierServiceResult.error.message);
      }

      const users:IUsers=getUserByIdentifierServiceResult.value;

      logger.info(
				logConstruct(
					`GetUserByIdentifierQueryHandler`,
					`GetUserByIdentifierService`,
					`get user by id success`
				)
			);

      // Map Response
      const getUsersByIdentifierResponseMapperServiceResult=await this._getUsersByIdentifierResponseMapper.handleAsync(users);
      if(getUsersByIdentifierResponseMapperServiceResult.isErr()){
        logger.error(
					logConstruct(
						`GetUserByIdentifierQueryHandler`,
						`getUsersByIdentifierResponseMapper`,
            getUsersByIdentifierResponseMapperServiceResult.error.message
					)
				);
        return DataResponseFactory.error(getUsersByIdentifierResponseMapperServiceResult.error.status, getUsersByIdentifierResponseMapperServiceResult.error.message);
      }
      const responseDto:GetUserByIdentifierResponseDto=getUsersByIdentifierResponseMapperServiceResult.value;
      logger.info(
				logConstruct(
					`GetUserByIdentifierQueryHandler`,
					`getUsersByIdentifierResponseMapper`,
					`Mapping Success`
				)
			);

      // Encrypt Response
      const getUsersByIdentifierResponseEncryptServiceResult=await this._getUsersByIdentifierResponseEncryptService.handleAsync({
        data:responseDto,
        key:users.keys.aesSecretKey
      });
      if(getUsersByIdentifierResponseEncryptServiceResult.isErr()){
        logger.error(
					logConstruct(
						`GetUserByIdentifierQueryHandler`,
						`GetUsersByIdentifierResponseEncryptService`,
            getUsersByIdentifierResponseEncryptServiceResult.error.message
					)
				);
        return DataResponseFactory.error(getUsersByIdentifierResponseEncryptServiceResult.error.status,getUsersByIdentifierResponseEncryptServiceResult.error.message);
      }
      logger.info(
				logConstruct(
					`GetUserByIdentifierQueryHandler`,
					`GetUsersByIdentifierResponseEncryptService`,
					`Encryption Success`
				)
			);

      const response:AesResponseDto=getUsersByIdentifierResponseEncryptServiceResult.value.aesResponseDto;
      // Return Response
      return DataResponseFactory.success(StatusCodes.OK, response);
    }
    catch(ex){
      const error = ex as Error;
			logger.error(logConstruct(`GetUserByIdentifierQueryHandler`, `handle`, error.message, ex));
      return DataResponseFactory.error(StatusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
  }

}

// @endregion
