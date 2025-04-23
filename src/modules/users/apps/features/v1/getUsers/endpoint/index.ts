import { StatusCodes } from 'http-status-codes';
import {
	Get,
	HttpCode,
	JsonController,
	OnUndefined,
	Param,
	QueryParams,
	Req,
	Res,
	UseBefore,
} from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';
import { Response, Request } from 'express';
import {
	DataResponse as ApiDataResponse,
	DataResponse,
	DataResponseFactory,
  PaginationDataResponseModel,
} from '@/shared/models/response/data.Response';
import { RequestData, RequestHandler, requestHandler } from 'mediatr-ts';
import medaitR from '@/shared/medaitR';
import { sealed } from '@/shared/utils/decorators/sealed';
import { AesResponseDto } from '@/shared/models/response/aes.ResponseDto';
import Container from 'typedi';
import { logConstruct, logger } from '@/shared/utils/helpers/loggers';
import { authenticateHmac } from '@/middlewares/hmac.middlware';
import { RoleEnum } from '@/shared/models/enums/role.enum';
import { IPageListResult, Order, StatusEnum, UserEntity } from '@kishornaik/mma_db';
import { GetUsersRequestDto, GetUsersResponseDto, IUsersForAdmin } from '../contracts';
import { authenticateJwt, authorizeRole } from '@/middlewares/auth.middleware';
import { ValidationMiddleware } from '@/middlewares/validation.middleware';
import { GetUsersByClientIdService } from '@/modules/users/shared/services/getUserByClientId';
import { IUsers } from '@/modules/users/shared/types';
import { GetUsersDbService } from '../shared/services/getUsersDb';
import { getPropertyNameByType } from '@/shared/utils/miscellaneous/getPropertyName';
import { GetUsersDecryptResponseService } from './services/decryptResponse';

//@region Controller
@JsonController('/api/v1/users')
@OpenAPI({ tags: ['users'] })
export class GetUsersController{
  @Get()
  @OpenAPI({ summary: `get users list (Admin only)`, tags: ['users'] })
	@HttpCode(StatusCodes.OK)
	@OnUndefined(StatusCodes.NOT_FOUND)
	@OnUndefined(StatusCodes.BAD_REQUEST)
  @UseBefore(authenticateHmac,authenticateJwt, authorizeRole(RoleEnum.ADMIN),ValidationMiddleware(GetUsersRequestDto))
  public async get(@QueryParams() request: GetUsersRequestDto,@Req() req: Request,@Res() res: Response){
    const response=await medaitR.send(new GetUsersQuery(request,req));
    return res.status(response.StatusCode).json(response);
  }
}
//@endregion

//@region Query
class GetUsersQuery extends RequestData<ApiDataResponse<AesResponseDto>>{
  private readonly _request: GetUsersRequestDto;
  private readonly _expressRequest: Request;

  public constructor(request: GetUsersRequestDto, expressRequest: Request) {
    super();
    this._request = request;
    this._expressRequest = expressRequest;
  }

  public get request(): GetUsersRequestDto {
    return this._request;
  }

  public get expressRequest(): Request {
    return this._expressRequest;
  }
}

//@endregion

//@region Query Handler
@sealed
@requestHandler(GetUsersQuery)
export class GetUserQueryHandler implements RequestHandler<GetUsersQuery,ApiDataResponse<AesResponseDto>>{

  private readonly _getUsersByClientIdService: GetUsersByClientIdService;
  private readonly _getUsersDbService:GetUsersDbService;
  private readonly _getUsersDecryptResponseService:GetUsersDecryptResponseService;

  public constructor(){
    this._getUsersByClientIdService = Container.get(GetUsersByClientIdService);
    this._getUsersDbService=Container.get(GetUsersDbService);
    this._getUsersDecryptResponseService=Container.get(GetUsersDecryptResponseService)
  }

  public async handle(value: GetUsersQuery): Promise<ApiDataResponse<AesResponseDto>> {
    try
    {
      //@Guard
      if(!value)
        return DataResponseFactory.error(StatusCodes.BAD_REQUEST,'Invalid Query');

      if(!value.request)
        return DataResponseFactory.error(StatusCodes.BAD_REQUEST,'Invalid request');

      if(value.expressRequest)
        return DataResponseFactory.error(StatusCodes.BAD_REQUEST,'Invalid express request');

      const {request,expressRequest}=value;

      // Get Client Id from header
      const clientId = expressRequest.headers['x-client-id'] as string;
      if (!clientId)
        return DataResponseFactory.error(StatusCodes.UNAUTHORIZED, `Client Id is required`);

      // Get Users
      const getUserDbServiceResult=await this._getUsersDbService.handleAsync({
        pagination:{
          pageNumber:request.pageNumber,
          pageSize:request.pageSize,
        },
        status:StatusEnum.ACTIVE,
        filterBy:{
          text:request.filter
        },
        sortBy:{
          by:[
            getPropertyNameByType<UserEntity>('created_date'),
            getPropertyNameByType<UserEntity>('modified_date'),
          ],
          direction:Order.DESC
        }
      });

      if(getUserDbServiceResult.isErr()){
        logger.error(
          logConstruct(
            `GetUserQueryHandler`,
            `GetUsersDbService`,
            getUserDbServiceResult.error.message
          )
        );
        return DataResponseFactory.error(
          getUserDbServiceResult.error.status,
          getUserDbServiceResult.error.message
        );
      }

      const itemPagesResult:IPageListResult<IUsersForAdmin>=getUserDbServiceResult.value;
      const items:Array<IUsersForAdmin>=itemPagesResult.items;
      const page:PaginationDataResponseModel= itemPagesResult.page as PaginationDataResponseModel;

      const getUsersResponseDto:Array<GetUsersResponseDto>=items;

      logger.info(
        logConstruct(
          `GetUserQueryHandler`,
          `GetUsersDbService`,
          `Get Users Success`
        )
      );

      // Get Aes Token Data by Client Id
      const getUsersByClientIdServiceResult =
        await this._getUsersByClientIdService.handleAsync({
          clientId: clientId,
        });
      if (getUsersByClientIdServiceResult.isErr()) {
        logger.error(
          logConstruct(
            `GetUserQueryHandler`,
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
      logger.info(
        logConstruct(
          `GetUserQueryHandler`,
          `GetUsersByClientIdService`,
          `Get User By Client Id Success`
        )
      );

      // Get Aes Token
      const aesToken: string = users.keys.aesSecretKey;

      // Encrypt
      const getUsersDecryptResponseServiceResult=await this._getUsersDecryptResponseService.handleAsync({
        data:getUsersResponseDto,
        key:aesToken,
      });
      if (getUsersDecryptResponseServiceResult.isErr()) {
        logger.error(
          logConstruct(
            `GetUserQueryHandler`,
            `GetUsersDecryptResponseService`,
            getUsersDecryptResponseServiceResult.error.message
          )
        );
        return DataResponseFactory.error(
          getUsersDecryptResponseServiceResult.error.status,
          getUsersDecryptResponseServiceResult.error.message
        );
      }

      const aesResponseDto:AesResponseDto=getUsersDecryptResponseServiceResult.value.aesResponseDto;
      logger.info(
        logConstruct(
          `GetUserQueryHandler`,
          `GetUsersDecryptResponseService`,
          `Get Users Decrypt Response Success`
        )
      );

      return DataResponseFactory.success(StatusCodes.OK, aesResponseDto,"Success",page);

    }
    catch(ex){
      const error = ex as Error;
      return DataResponseFactory.error(StatusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
  }

}

//@endregion
