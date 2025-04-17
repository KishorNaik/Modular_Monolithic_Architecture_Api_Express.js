import { UserSharedCacheService } from "@/modules/users/shared/cache";
import { IUsers } from "@/modules/users/shared/types";
import { sealed } from "@/shared/utils/decorators/sealed";
import { ResultError, ResultExceptionFactory } from "@/shared/utils/exceptions/results";
import { IServiceHandlerAsync } from "@/shared/utils/helpers/services";
import { QueryRunner, StatusEnum, UpdateUserCommunicationService, UpdateUserCredentialsService, UpdateUserKeysService, UpdateUserService, UpdateUserSettingsService, UserCommunicationEntity, UserCredentialsEntity, UserEntity, UserKeysEntity, UserSettingsEntity } from "@kishornaik/mma_db";
import { BoolEnum } from "@kishornaik/mma_db/dist/core/shared/models/enums/bool.enum";
import { StatusCodes } from "http-status-codes";
import { Ok, Result } from "neverthrow";
import Container, { Service } from "typedi";

export interface IIfTokenValidServiceParameters{
  userId:string;
  queryRunner:QueryRunner;
}

export interface IIfTokenValidServiceResult{
  message:string;
}

export interface IIfTokenValidService extends IServiceHandlerAsync<IIfTokenValidServiceParameters,IIfTokenValidServiceResult>{}

@sealed
@Service()
export class IfTokenValidService implements IIfTokenValidService{

  private readonly _userSharedCacheService:UserSharedCacheService;
  private readonly _mapIUsersToEntityService:MapIUsersToEntityService;
  private readonly _updateUsersDbService:UpdateUserService;
  private readonly _updateUserCommunicationDbService:UpdateUserCommunicationService;
  private readonly _updateUserCredentialsDbService:UpdateUserCredentialsService;
  private readonly _updateUserKeyDbService: UpdateUserKeysService;
  private readonly _updateUserSettingsDbService:UpdateUserSettingsService;

  public constructor(){
    this._userSharedCacheService = Container.get(UserSharedCacheService);
    this._mapIUsersToEntityService=Container.get(MapIUsersToEntityService);
    this._updateUsersDbService=Container.get(UpdateUserService);
    this._updateUserCommunicationDbService=Container.get(UpdateUserCommunicationService);
    this._updateUserCredentialsDbService=Container.get(UpdateUserCredentialsService);
    this._updateUserKeyDbService=Container.get(UpdateUserKeysService);
    this._updateUserSettingsDbService=Container.get(UpdateUserSettingsService);
  }

  public async handleAsync(params: IIfTokenValidServiceParameters): Promise<Result<IIfTokenValidServiceResult, ResultError>> {
    try
    {
      // @Gaurd
      if(!params)
        return ResultExceptionFactory.error(StatusCodes.BAD_REQUEST,"Invalid params");

      if(!params.userId)
        return ResultExceptionFactory.error(StatusCodes.BAD_REQUEST,"Invalid user Id");

      if(!params.queryRunner)
        return ResultExceptionFactory.error(StatusCodes.BAD_REQUEST,"Invalid queryRunner");

      const {userId,queryRunner}=params;

      // Get User Data from cache by user Id
      const userSharedCacheServiceResult=await this._userSharedCacheService.handleAsync({
        identifier:userId,
        status:StatusEnum.INACTIVE,
        queryRunner:queryRunner
      });
      if(userSharedCacheServiceResult.isErr())
        return ResultExceptionFactory.error(userSharedCacheServiceResult.error.status,userSharedCacheServiceResult.error.message);

      const users:IUsers=userSharedCacheServiceResult.value.users;
      if(!users)
        return ResultExceptionFactory.error(StatusCodes.NOT_FOUND,`user not found`);

      // Map Entity
      const mapIUsersToEntityServiceResult=await this._mapIUsersToEntityService.handleAsync(users);
      if(mapIUsersToEntityServiceResult.isErr())
        return ResultExceptionFactory.error(mapIUsersToEntityServiceResult.error.status,mapIUsersToEntityServiceResult.error.message);

      const entity:IMapIUsersToEntityServiceResult=mapIUsersToEntityServiceResult.value;

      // Update Status
      const updateUserDbServiceResult=await this._updateUsersDbService.handleAsync(entity.entity.user,queryRunner);
      if(updateUserDbServiceResult.isErr())
        return ResultExceptionFactory.error(updateUserDbServiceResult.error.statusCode,updateUserDbServiceResult.error.message);

      const updateUserCommunicationDbServiceResult=await this._updateUserCommunicationDbService.handleAsync(entity.entity.communication,queryRunner);
      if(updateUserCommunicationDbServiceResult.isErr())
        return ResultExceptionFactory.error(updateUserCommunicationDbServiceResult.error.statusCode,updateUserCommunicationDbServiceResult.error.message);

      const updateUserCredentialsDbServiceResult=await this._updateUserCredentialsDbService.handleAsync(entity.entity.credentials,queryRunner);
      if(updateUserCredentialsDbServiceResult.isErr())
        return ResultExceptionFactory.error(updateUserCredentialsDbServiceResult.error.statusCode,updateUserCredentialsDbServiceResult.error.message);

      const updateUserSettingsDbServiceResult=await this._updateUserSettingsDbService.handleAsync(entity.entity.settings,queryRunner);
      if(updateUserSettingsDbServiceResult.isErr())
        return ResultExceptionFactory.error(updateUserSettingsDbServiceResult.error.statusCode,updateUserSettingsDbServiceResult.error.message);

      const updateUserKeysDbServiceResult=await this._updateUserKeyDbService.handleAsync(entity.entity.keys,queryRunner);
      if(updateUserKeysDbServiceResult.isErr())
        return ResultExceptionFactory.error(updateUserKeysDbServiceResult.error.statusCode,updateUserKeysDbServiceResult.error.message);

      // Cache Update
      const userSharedCacheUpdateServiceResult=await this._userSharedCacheService.handleAsync({
        identifier:entity.entity.user.identifier,
        status:StatusEnum.ACTIVE,
        queryRunner:queryRunner,
      });
      if(userSharedCacheUpdateServiceResult.isErr())
        return ResultExceptionFactory.error(userSharedCacheUpdateServiceResult.error.status,userSharedCacheUpdateServiceResult.error.message);

      // Result
      const result:IIfTokenValidServiceResult={
        message:`User ${entity.entity.user.identifier} verified successfully`
      }

      return new Ok(result);
    }
    catch(ex){
      const error=ex as Error;
      return ResultExceptionFactory.error(StatusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
  }

}

interface IMapIUsersToEntityServiceResult{
  entity:{
    user:UserEntity;
    communication:UserCommunicationEntity;
    credentials:UserCredentialsEntity;
    settings:UserSettingsEntity;
    keys:UserKeysEntity
  }
}

interface IMapIUsersToEntityService extends IServiceHandlerAsync<IUsers, IMapIUsersToEntityServiceResult> {}

@sealed
@Service()
class MapIUsersToEntityService implements IMapIUsersToEntityService {
  public async handleAsync(params: IUsers): Promise<Result<IMapIUsersToEntityServiceResult, ResultError>> {
    try
    {
      // @guard
      if(!params)
        return ResultExceptionFactory.error(StatusCodes.BAD_REQUEST,"Invalid params");

      // Map Entities
      const userEntity:UserEntity=new UserEntity();
      userEntity.identifier=params.identifier;
      userEntity.status=StatusEnum.ACTIVE;
      userEntity.modified_date=new Date();

      const userCommunicationEntityEntity:UserCommunicationEntity=new UserCommunicationEntity();
      userCommunicationEntityEntity.identifier=params.communication.identifier;
      userCommunicationEntityEntity.status=StatusEnum.ACTIVE;

      const userCredentialsEntity:UserCredentialsEntity=new UserCredentialsEntity();
      userCredentialsEntity.identifier=params.credentials.identifier;
      userCredentialsEntity.status=StatusEnum.ACTIVE;

      const userSettingsEntity:UserSettingsEntity=new UserSettingsEntity();
      userSettingsEntity.identifier=params.settings.identifier;
      userSettingsEntity.emailVerificationToken=null;
      userSettingsEntity.isEmailVerified=BoolEnum.YES;
      userSettingsEntity.email_Verification_Token_expires_at=null;
      userSettingsEntity.status=StatusEnum.ACTIVE;

      const keysEntity:UserKeysEntity=new UserKeysEntity();
      keysEntity.identifier=params.keys.identifier;
      keysEntity.status=StatusEnum.ACTIVE;

      const result:IMapIUsersToEntityServiceResult={
        entity:{
          user:userEntity,
          communication:userCommunicationEntityEntity,
          credentials:userCredentialsEntity,
          settings:userSettingsEntity,
          keys:keysEntity
        }
      }

      return new Ok(result);
    }
    catch(ex){
      const error=ex as Error;
      return ResultExceptionFactory.error(StatusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
  }

}
