import { sealed } from "@/shared/utils/decorators/sealed";
import { ResultError, ResultExceptionFactory } from "@/shared/utils/exceptions/results";
import { IServiceHandlerAsync } from "@/shared/utils/helpers/services";
import { Ok, Result } from "neverthrow";
import Container, { Service } from "typedi";
import { UserSharedCacheService } from "../../cache";
import { StatusCodes } from "http-status-codes";
import { QueryRunner, StatusEnum } from "@kishornaik/mma_db";
import { IUsers } from "../../types";

export interface IGetAesTokenServiceParameters {
  userId:string;
  status:StatusEnum;
  queryRunner?:QueryRunner;
}

export interface IGetAesTokenServiceResult {
  aesToken:String;
}

export interface IGetAesTokenService extends IServiceHandlerAsync<IGetAesTokenServiceParameters,IGetAesTokenServiceResult> {

}

@sealed
@Service()
export class GetAesTokenService implements IGetAesTokenService {

  private readonly _userSharedCacheService:UserSharedCacheService;

  public constructor() {
    this._userSharedCacheService = Container.get(UserSharedCacheService);
  }

  public async handleAsync(params: IGetAesTokenServiceParameters): Promise<Result<IGetAesTokenServiceResult, ResultError>> {
    try
    {
      // @Guard
      if(!params)
        return ResultExceptionFactory.error(StatusCodes.BAD_REQUEST,'Invalid params');

      if(!params.userId)
        return ResultExceptionFactory.error(StatusCodes.BAD_REQUEST,"Invalid userId");

      const {userId,status,queryRunner}=params;

      const userSharedCacheServiceResult = await this._userSharedCacheService.handleAsync({
        identifier:userId,
        status:status,
        queryRunner:queryRunner
      });
      if(userSharedCacheServiceResult.isErr())
        return ResultExceptionFactory.error(userSharedCacheServiceResult.error.status,userSharedCacheServiceResult.error.message);

      const users:IUsers=userSharedCacheServiceResult.value.users;
      const aesToken:string=users.keys.aesSecretKey;

      const result:IGetAesTokenServiceResult={
        aesToken:aesToken,
      }

      return new Ok(result);
    }
    catch(ex){
      const error = ex as Error;
      return ResultExceptionFactory.error(StatusCodes.INTERNAL_SERVER_ERROR,error.message);
    }
  }

}
