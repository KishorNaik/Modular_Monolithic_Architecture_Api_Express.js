import { StatusCodes } from "http-status-codes";
import { Get, HttpCode, JsonController, OnUndefined, Param, Res } from "routing-controllers";
import { OpenAPI } from "routing-controllers-openapi";
import { Response } from 'express';
import {
	DataResponse as ApiDataResponse,
	DataResponse,
	DataResponseFactory,
} from '@/shared/models/response/data.Response';
import { VerifyUserRequestDto, VerifyUserResponseDto } from "../contracts";
import { RequestData, RequestHandler, requestHandler } from "mediatr-ts";
import medaitR from "@/shared/medaitR";
import { sealed } from "@/shared/utils/decorators/sealed";
import { AesResponseDto } from "@/shared/models/response/aes.ResponseDto";
import { getQueryRunner, UserSettingsEntity } from "@kishornaik/mma_db";
import { VerifyUserValidationRequestService } from "./services/validations";
import Container from "typedi";
import { MapVerifyUserRequestDtoToEntityService } from "./services/mapEntity";
import { GetEmailVerificationTokenServiceResult, IsEmailTokenValidService } from "./services/db";
import { IfTokenValidService } from "./services/IfTokenValid";
import { IfTokenIsNotValidService, IIfTokenIsNotValidServiceResult } from "./services/IfTokenNotValid";
import { IUsers } from "@/modules/users/shared/types";
import { UserVerificationTokenEmailIntegrationEventRequestDto, UserVerificationTokenEmailIntegrationEventService } from "@/modules/notiifcations/apps/features/v1/userVerificationTokenEmail";
import { VerifyUserEncryptResponseService } from "./services/encryptResponse";
import { ENCRYPTION_KEY } from "@/config";


// @region Controller
@JsonController('/api/v1/users')
@OpenAPI({ tags: ['users'] })
export class VerifyUserController{

  @Get('/verify/:token')
	@OpenAPI({ summary: 'Verify user by email verification token', tags: ['users'] })
	@HttpCode(StatusCodes.OK)
	@OnUndefined(StatusCodes.BAD_REQUEST)
  public async verifyAsync(@Param("token") token: string, @Res() res:Response) {
    const verifyUserRequestDto:VerifyUserRequestDto=new VerifyUserRequestDto();
    verifyUserRequestDto.emailToken=token;

    const response=await medaitR.send<ApiDataResponse<AesResponseDto>>(new VerifyUserQuery(verifyUserRequestDto));
    return res.status(response.StatusCode).json(response);
  }
}

// @endregion

// @region Query
export class VerifyUserQuery extends RequestData<ApiDataResponse<AesResponseDto>>{

  private readonly _request:VerifyUserRequestDto;

  public constructor(request:VerifyUserRequestDto){
    super();
    this._request=request;
  }

  public get request(): VerifyUserRequestDto {
    return this._request;
  }

}

// @endregion

// @region Query Handler
@sealed
@requestHandler(VerifyUserQuery)
export class VerifyUserQueryHandler implements RequestHandler<VerifyUserQuery,ApiDataResponse<AesResponseDto>> {

  private readonly _verifyUserValidationRequestService:VerifyUserValidationRequestService;
  private readonly _mapVerifyUserRequestDtoToEntityService:MapVerifyUserRequestDtoToEntityService;
  private readonly _isEmailTokenValidService:IsEmailTokenValidService;
  private readonly _ifTokenValidService:IfTokenValidService;
  private readonly _ifTokenIsNotValidService:IfTokenIsNotValidService;
  private readonly _verifyUserEncryptResponseService:VerifyUserEncryptResponseService;

  public constructor(){
    this._verifyUserValidationRequestService=Container.get(VerifyUserValidationRequestService);
    this._mapVerifyUserRequestDtoToEntityService=Container.get(MapVerifyUserRequestDtoToEntityService);
    this._isEmailTokenValidService=Container.get(IsEmailTokenValidService);
    this._ifTokenValidService=Container.get(IfTokenValidService);
    this._ifTokenIsNotValidService=Container.get(IfTokenIsNotValidService);
    this._verifyUserEncryptResponseService=Container.get(VerifyUserEncryptResponseService);
  }


  public async handle(value: VerifyUserQuery): Promise<ApiDataResponse<AesResponseDto>> {
    const queryRunner = getQueryRunner();
		await queryRunner.connect();
    let message:string;
    try
    {
      // @Gaurd
      if(!value)
        return DataResponseFactory.error(StatusCodes.BAD_REQUEST,"Invalid Query");

      if(!value.request)
        return DataResponseFactory.error(StatusCodes.BAD_REQUEST,"Invalid request");

      const request:VerifyUserRequestDto = await value.request;

      // Validation Service
      const verifyUserRequestValidationServiceResult=await this._verifyUserValidationRequestService.handleAsync({
        dto:request,
        dtoClass:VerifyUserRequestDto
      });
      if(verifyUserRequestValidationServiceResult.isErr())
        return DataResponseFactory.error(verifyUserRequestValidationServiceResult.error.status,verifyUserRequestValidationServiceResult.error.message);

      // Map Entity Service
      const mapVerifyUserRequestDtoToEntityServiceResult=await this._mapVerifyUserRequestDtoToEntityService.handleAsync(request);
      if(mapVerifyUserRequestDtoToEntityServiceResult.isErr())
        return DataResponseFactory.error(mapVerifyUserRequestDtoToEntityServiceResult.error.status,mapVerifyUserRequestDtoToEntityServiceResult.error.message);

      const userSettingsEntity:UserSettingsEntity=mapVerifyUserRequestDtoToEntityServiceResult.value;

      // Check if Token is expired or not
      const isValidTokenServiceResult=await this._isEmailTokenValidService.handleAsync(userSettingsEntity);
      if(isValidTokenServiceResult.isErr())
        return DataResponseFactory.error(isValidTokenServiceResult.error.status,isValidTokenServiceResult.error.message);

      const isValidTokenResult:GetEmailVerificationTokenServiceResult=isValidTokenServiceResult.value;

      await queryRunner.startTransaction();

      if(isValidTokenResult.isValidToken){
        // If Token not Expired and it's valid then update user status to active (In all User Tables) & Remove the email token and expiration data as Null
        const ifTokenValidServiceResult=await this._ifTokenValidService.handleAsync({
          userId:isValidTokenResult.userId,
          queryRunner:queryRunner
        });
        if(ifTokenValidServiceResult.isErr())
          return DataResponseFactory.error(ifTokenValidServiceResult.error.status,ifTokenValidServiceResult.error.message);

          message=ifTokenValidServiceResult.value.message;

          await queryRunner.commitTransaction();
      }
      else
      {
        // If token is expired then generate new Token (Db Service)
        const ifTokenIsNotValidServiceResult=await this._ifTokenIsNotValidService.handleAsync({
          userId:isValidTokenResult.userId,
          queryRunner:queryRunner
        });
        if(ifTokenIsNotValidServiceResult.isErr())
          return DataResponseFactory.error(ifTokenIsNotValidServiceResult.error.status,ifTokenIsNotValidServiceResult.error.message);

        const result:IIfTokenIsNotValidServiceResult=ifTokenIsNotValidServiceResult.value;
        const users:IUsers=result.users;

        await queryRunner.commitTransaction();

        // Send Email to User Notification
        // User Verification Token Email Send Integration Event
        const userVerificationTokenEmailIntegrationEventRequestDto: UserVerificationTokenEmailIntegrationEventRequestDto =
          new UserVerificationTokenEmailIntegrationEventRequestDto();
        userVerificationTokenEmailIntegrationEventRequestDto.email = users.communication.email;
        userVerificationTokenEmailIntegrationEventRequestDto.fullName = `${users.firstName} ${users.lastName}`;
        userVerificationTokenEmailIntegrationEventRequestDto.userId = users.identifier;
        userVerificationTokenEmailIntegrationEventRequestDto.emailVerificationToken =
          users.settings.emailVerificationToken;
        const userVerificationTokenEmailIntegrationEventService: UserVerificationTokenEmailIntegrationEventService =
          new UserVerificationTokenEmailIntegrationEventService(
            userVerificationTokenEmailIntegrationEventRequestDto
          );
        await medaitR.publish(userVerificationTokenEmailIntegrationEventService);

        message=result.message;
      }

      // Map Response
      const verifyUserResponseDto:VerifyUserResponseDto=new VerifyUserResponseDto();
      verifyUserResponseDto.message=message;

      // Encryption Response
      const verifyUserEncryptResponseServiceResult=await this._verifyUserEncryptResponseService.handleAsync({
        data: verifyUserResponseDto,
        key:ENCRYPTION_KEY
      });
      if(verifyUserEncryptResponseServiceResult.isErr())
        return DataResponseFactory.error(verifyUserEncryptResponseServiceResult.error.status,verifyUserEncryptResponseServiceResult.error.message);

      return DataResponseFactory.Response(true,StatusCodes.OK,verifyUserEncryptResponseServiceResult.value.aesResponseDto);
    }
    catch(ex){
      const error = ex as Error;
			if (queryRunner.isTransactionActive) {
				await queryRunner.rollbackTransaction();
			}
			return DataResponseFactory.error(StatusCodes.INTERNAL_SERVER_ERROR, error.message);
		} finally {
			await queryRunner.release();
		}
  }

}

// @endregion
