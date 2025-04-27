import { UpdateUserDbService } from "@/modules/users/apps/features/v1/updateUsers/endpoints/services/db";
import { sealed } from "@/shared/utils/decorators/sealed";
import { ResultError, ResultExceptionFactory } from "@/shared/utils/exceptions/results";
import { IServiceHandlerVoidAsync } from "@/shared/utils/helpers/services";
import { QueryRunner, StatusEnum, UpdateUserService, UserEntity } from "@kishornaik/mma_db";
import { StatusCodes } from "http-status-codes";
import { Ok, Result } from "neverthrow";
import Container, { Service } from "typedi";

export interface IActiveDeactivateUsersDbServiceParameters{
  userId:string;
  status:StatusEnum;
  queryRunner?:QueryRunner;
}

export interface IActiveDeactivateUsersDbService extends IServiceHandlerVoidAsync<IActiveDeactivateUsersDbServiceParameters>{}

@sealed
@Service()
export class ActiveDeactivateUsersDbService implements IActiveDeactivateUsersDbService {

  private readonly _updateUserService: UpdateUserService;

  public constructor(){
    this._updateUserService = Container.get(UpdateUserService);
  }

  public async handleAsync(params: IActiveDeactivateUsersDbServiceParameters): Promise<Result<undefined, ResultError>> {
    try
    {
      //@Guard
      if(!params)
        return ResultExceptionFactory.error(StatusCodes.BAD_REQUEST, 'Invalid params');

      if(!params.userId)
        return ResultExceptionFactory.error(StatusCodes.BAD_REQUEST, 'Invalid userId');

      if(params.status===null)
        return ResultExceptionFactory.error(StatusCodes.BAD_REQUEST, 'Invalid status');

      if(!params.queryRunner)
        return ResultExceptionFactory.error(StatusCodes.BAD_REQUEST,"Invalid queryRunner");

      const {status,userId,queryRunner}=params;

      // Map Entity
      const userEntity:UserEntity=new UserEntity();
      userEntity.identifier=userId;
      userEntity.status=status;
      userEntity.modified_date=new Date();

      // Update User
			const updateUserServiceResult = await this._updateUserService.handleAsync(
				userEntity,
				queryRunner
			);
			if (updateUserServiceResult.isErr())
				return ResultExceptionFactory.error(
					updateUserServiceResult.error.statusCode,
					updateUserServiceResult.error.message
				);

      return new Ok(undefined);
    }
    catch(ex){
      const error = ex as Error;
      return ResultExceptionFactory.error(StatusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
  }

}
