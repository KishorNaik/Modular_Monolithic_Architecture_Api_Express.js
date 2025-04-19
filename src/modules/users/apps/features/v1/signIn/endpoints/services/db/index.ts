import { UpdateRowVersionService } from "@/modules/users/shared/services/updateRowVersion";
import { sealed } from "@/shared/utils/decorators/sealed";
import { ResultError, ResultExceptionFactory } from "@/shared/utils/exceptions/results";
import { IServiceHandlerVoidAsync } from "@/shared/utils/helpers/services";
import { QueryRunner, UpdateUserKeysService, UserEntity, UserKeysEntity } from "@kishornaik/mma_db";
import { StatusCodes } from "http-status-codes";
import { Ok, Result } from "neverthrow";
import Container, { Service } from "typedi";

export interface IUserSignInUpdateServiceParameters{
  entity:{
    userEntity:UserEntity;
    userKeys:UserKeysEntity;
  }
  queryRunner?:QueryRunner;
}

export interface IUserSignInUpdateService extends IServiceHandlerVoidAsync<IUserSignInUpdateServiceParameters>{}

@sealed
@Service()
export class UserSignInUpdateDbService implements IUserSignInUpdateService {

  private readonly _updateUserKeysService:UpdateUserKeysService;
  private readonly _updateRowVersionService:UpdateRowVersionService;

  public constructor(){
    this._updateUserKeysService = Container.get(UpdateUserKeysService);
    this._updateRowVersionService=Container.get(UpdateRowVersionService);
  }

  public async handleAsync(params: IUserSignInUpdateServiceParameters): Promise<Result<undefined, ResultError>> {
    try
    {
      //@Guard
      if(!params)
        return ResultExceptionFactory.error(StatusCodes.BAD_REQUEST,"Invalid params");

      if(!params.entity)
        return ResultExceptionFactory.error(StatusCodes.BAD_REQUEST,"Invalid entity");

      if(!params.queryRunner)
        return ResultExceptionFactory.error(StatusCodes.BAD_REQUEST,"Invalid queryRunner");

      const {userEntity,userKeys}=params.entity;
      const queryRunner=params.queryRunner;

      //Update User Key Entity
      const updateUserKeysResult=await this._updateUserKeysService.handleAsync(
        userKeys,
        queryRunner
      );
      if(updateUserKeysResult.isErr())
        return ResultExceptionFactory.error(updateUserKeysResult.error.statusCode,updateUserKeysResult.error.message);

      // Update Row Version
      const updateRowVersionResult=await this._updateRowVersionService.handleAsync({
        userId:userEntity.identifier,
        status:userEntity.status,
        queryRunner:queryRunner
      });
      if(updateRowVersionResult.isErr())
        return ResultExceptionFactory.error(updateRowVersionResult.error.status,updateRowVersionResult.error.message);

      return new Ok(undefined);
    }
    catch(ex){
      const error=ex as Error;
      return ResultExceptionFactory.error(StatusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
  }

}
