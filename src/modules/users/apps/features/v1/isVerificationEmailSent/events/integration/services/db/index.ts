import { sealed } from "@/shared/utils/decorators/sealed";
import Container, { Service } from "typedi";
import { IsVerificationEmailSendIntegrationEventRequestDto } from "../../../../contracts";
import { QueryRunner, StatusEnum, UpdateUserSettingsService, UserSettingsEntity } from "@kishornaik/mma_db";
import { IServiceHandlerAsync, IServiceHandlerVoidAsync } from "@/shared/utils/helpers/services";
import { ResultError, ResultExceptionFactory } from "@/shared/utils/exceptions/results";
import { Ok, Result } from "neverthrow";
import { StatusCodes } from "http-status-codes";
import { UserSharedCacheService } from "@/modules/users/shared/cache";
import { IUsers } from "@/modules/users/shared/types";
import { IsVerificationEmailSendIntegrationEventMapEntityService } from "../mapEntity";

export interface IIIsVerificationEmailSendUpdateDbServiceParameters {
  request:IsVerificationEmailSendIntegrationEventRequestDto;
  queryRunner?: QueryRunner;
}

export interface IIIsVerificationEmailSendUpdateDbService extends IServiceHandlerVoidAsync<IIIsVerificationEmailSendUpdateDbServiceParameters> {}

@sealed
@Service()
export class IsVerificationEmailSendUpdateDbService implements IIIsVerificationEmailSendUpdateDbService {

  private readonly _updateUserSettingsService:UpdateUserSettingsService;
  private readonly _userSharedCacheService:UserSharedCacheService;
  private readonly _isVerificationEmailSendIntegrationEventMapEntityService:IsVerificationEmailSendIntegrationEventMapEntityService;

  public constructor(){
    this._updateUserSettingsService = Container.get(UpdateUserSettingsService);
    this._userSharedCacheService = Container.get(UserSharedCacheService);
    this._isVerificationEmailSendIntegrationEventMapEntityService = Container.get(IsVerificationEmailSendIntegrationEventMapEntityService);
  }

  public async handleAsync(params: IIIsVerificationEmailSendUpdateDbServiceParameters): Promise<Result<undefined, ResultError>> {
    try
    {
      //@guard
      if(!params)
        return ResultExceptionFactory.error(StatusCodes.BAD_REQUEST,'Invalid params');

      if(!params.request)
        return ResultExceptionFactory.error(StatusCodes.BAD_REQUEST,'Invalid request');

      const {request, queryRunner} = params;

      // Get User Shared Cache
      const getUserSharedCacheServiceResult=await this._userSharedCacheService.handleAsync({
        identifier: request.identifier,
        status:StatusEnum.INACTIVE,
        queryRunner:queryRunner,
      });
      if(getUserSharedCacheServiceResult.isErr())
        return ResultExceptionFactory.error(getUserSharedCacheServiceResult.error.status,getUserSharedCacheServiceResult.error.message);

      const users:IUsers=getUserSharedCacheServiceResult.value.users;

      // Map Entity
      const isVerificationEmailSendIntegrationEventMapEntityServiceResult=await this._isVerificationEmailSendIntegrationEventMapEntityService.handleAsync(users);
      if(isVerificationEmailSendIntegrationEventMapEntityServiceResult.isErr())
        return ResultExceptionFactory.error(isVerificationEmailSendIntegrationEventMapEntityServiceResult.error.status,isVerificationEmailSendIntegrationEventMapEntityServiceResult.error.message);

      const userSettingsEntity:UserSettingsEntity=isVerificationEmailSendIntegrationEventMapEntityServiceResult.value;

      // Db Service
      const updateUserSettingsServiceResult=await this._updateUserSettingsService.handleAsync(userSettingsEntity,queryRunner);
      if(updateUserSettingsServiceResult.isErr())
        return ResultExceptionFactory.error(updateUserSettingsServiceResult.error.statusCode,updateUserSettingsServiceResult.error.message);

      return new Ok(undefined);
    }
    catch(ex){
      const error=ex as Error;
      return ResultExceptionFactory.error(StatusCodes.INTERNAL_SERVER_ERROR,error.message);
    }
  }

}
