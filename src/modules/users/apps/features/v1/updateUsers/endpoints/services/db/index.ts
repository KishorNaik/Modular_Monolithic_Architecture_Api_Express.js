import { sealed } from "@/shared/utils/decorators/sealed";
import { ResultError, ResultExceptionFactory } from "@/shared/utils/exceptions/results";
import { IServiceHandlerVoidAsync } from "@/shared/utils/helpers/services";
import { QueryRunner, UpdateUserCommunicationService, UpdateUserCredentialsService, UpdateUserService, UserCommunicationEntity, UserCredentialsEntity, UserEntity } from "@kishornaik/mma_db";
import { StatusCodes } from "http-status-codes";
import { Ok, Result } from "neverthrow";
import Container, { Service } from "typedi";

export interface IUpdateUsersDbServiceParameters{
  entity:{
      users:UserEntity;
      communication:UserCommunicationEntity;
      credentials:UserCredentialsEntity;
    },
  queryRunner:QueryRunner
}

export interface IUpdateUsersDbService extends IServiceHandlerVoidAsync<IUpdateUsersDbServiceParameters>{}

@sealed
@Service()
export class UpdateUserDbService implements IUpdateUsersDbService{

  private readonly _updateUserService:UpdateUserService;
  private readonly _updateUserCommunicationService:UpdateUserCommunicationService;
  private readonly _updateUserCredentialsService:UpdateUserCredentialsService;

  public constructor(){
    this._updateUserService=Container.get(UpdateUserService);
    this._updateUserCommunicationService=Container.get(UpdateUserCommunicationService);
    this._updateUserCredentialsService=Container.get(UpdateUserCredentialsService);
  }

  public async handleAsync(params: IUpdateUsersDbServiceParameters): Promise<Result<undefined, ResultError>> {
    try
    {
      //@Guard
      if(!params)
        return ResultExceptionFactory.error(StatusCodes.BAD_REQUEST,"Invalid params");

      if(!params.entity)
        return ResultExceptionFactory.error(StatusCodes.BAD_REQUEST,"Invalid entity");

      if(!params.queryRunner)
        return ResultExceptionFactory.error(StatusCodes.BAD_REQUEST,"Invalid queryRunner");

      const {entity,queryRunner}=params;
      const {users,communication,credentials}=entity;

      // Update User
      const updateUserServiceResult=await this._updateUserService.handleAsync(users,queryRunner);
      if(updateUserServiceResult.isErr())
        return ResultExceptionFactory.error(updateUserServiceResult.error.statusCode,updateUserServiceResult.error.message);

      // Update User Communication
      const updateUserCommunicationServiceResult=await this._updateUserCommunicationService.handleAsync(communication,queryRunner);
      if(updateUserCommunicationServiceResult.isErr())
        return ResultExceptionFactory.error(updateUserCommunicationServiceResult.error.statusCode,updateUserCommunicationServiceResult.error.message);

      // Update User Credentials
      const updateUserCredentialsServiceResult=await this._updateUserCredentialsService.handleAsync(credentials,queryRunner);
      if(updateUserCredentialsServiceResult.isErr())
        return ResultExceptionFactory.error(updateUserCredentialsServiceResult.error.statusCode,updateUserCredentialsServiceResult.error.message);

      return new Ok(undefined);
    }
    catch(ex){
      const error=ex as Error;

    }
  }

}
