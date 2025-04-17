import { sealed } from "@/shared/utils/decorators/sealed";
import { ResultError, ResultExceptionFactory } from "@/shared/utils/exceptions/results";
import { IServiceHandlerVoid, IServiceHandlerVoidAsync } from "@/shared/utils/helpers/services";
import { QueryRunner, StatusEnum, UpdateUserVersionService, UserEntity } from "@kishornaik/mma_db";
import { StatusCodes } from "http-status-codes";
import { Ok, Result } from "neverthrow";
import Container, { Service } from "typedi";

export interface IUpdateRowVersionServiceParameters{
  userId:string;
  status:StatusEnum;
  queryRunner:QueryRunner;
}

export interface IUpdateRowVersionService extends IServiceHandlerVoidAsync<IUpdateRowVersionServiceParameters>{}

@sealed
@Service()
export class UpdateRowVersionService implements IUpdateRowVersionService {

  private readonly _updateUserRowVersionService: UpdateUserVersionService;

  public constructor(){
    this._updateUserRowVersionService=Container.get(UpdateUserVersionService)
  }
  public async handleAsync(params: IUpdateRowVersionServiceParameters): Promise<Result<undefined, ResultError>> {
    try
    {
      // @guard
      if(!params)
        return ResultExceptionFactory.error(StatusCodes.BAD_REQUEST,"Invalid params");

      if(!params.queryRunner)
        return ResultExceptionFactory.error(StatusCodes.BAD_REQUEST,"Invalid queryRunner");

      const userEntity: UserEntity = new UserEntity();
            userEntity.identifier = params.userId;
            userEntity.status = params.status;
            userEntity.modified_date = new Date();

      const updateRowVersionServiceResult =
        await this._updateUserRowVersionService.handleAsync(userEntity, params.queryRunner);

      if (updateRowVersionServiceResult.isErr())
        return ResultExceptionFactory.error(
          updateRowVersionServiceResult.error.statusCode,
          updateRowVersionServiceResult.error.message
        );

      return new Ok(undefined);
    }
    catch(ex){
      const error=ex as Error;
      return ResultExceptionFactory.error(StatusCodes.INTERNAL_SERVER_ERROR,error.message);
    }
  }
}
