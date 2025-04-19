import { IUsers } from "@/modules/users/shared/types";
import { StatusEnum } from "@/shared/models/enums/status.enum";
import { HashPasswordService } from "@/shared/services/users/user.HashPassword.Service";
import { sealed } from "@/shared/utils/decorators/sealed";
import { ResultError, ResultExceptionFactory } from "@/shared/utils/exceptions/results";
import { IServiceHandlerAsync, IServiceHandlerVoidAsync } from "@/shared/utils/helpers/services";
import { StatusCodes } from "http-status-codes";
import { Ok, Result } from "neverthrow";
import Container, { Service } from "typedi";

export interface IUserSignInValidateCredentialsServiceParameters {
  users:IUsers;
  rawPassword:string
}

export interface IUserSignInValidateCredentialsService extends IServiceHandlerVoidAsync<IUserSignInValidateCredentialsServiceParameters>{}

@sealed
@Service()
export class UserSignInValidateCredentialsService implements IUserSignInValidateCredentialsService {

  private readonly _hashPasswordService:HashPasswordService;

  public constructor(){
    this._hashPasswordService =Container.get(HashPasswordService);
  }

  public async handleAsync(params: IUserSignInValidateCredentialsServiceParameters): Promise<Result<undefined, ResultError>> {
    try
    {
      // @Guard
      if(!params)
        return ResultExceptionFactory.error(StatusCodes.BAD_REQUEST,"Invalid params");

      // @Guard
      if(!params.users)
        return ResultExceptionFactory.error(StatusCodes.BAD_REQUEST,"Invalid users");

      // @Guard
      if(!params.rawPassword)
        return ResultExceptionFactory.error(StatusCodes.BAD_REQUEST,"Invalid rawPassword");

      const {users, rawPassword} = params;

      // Check user Status
      const isUserValid:boolean=users.status==StatusEnum.ACTIVE
      if(!isUserValid)
        return ResultExceptionFactory.error(StatusCodes.FORBIDDEN,`User with emailId ${users.credentials.username} is not active`);

      // Get Hash password
      const {hash,salt} = users.credentials;
      if(!hash || !salt)
        return ResultExceptionFactory.error(StatusCodes.FORBIDDEN,`User with emailId ${users.credentials.username} is not active`);

      // Compare Raw Password with Hash Password
      const comparePasswordResult = await this._hashPasswordService.comparePasswordAsync(rawPassword, hash);
      if(comparePasswordResult.isErr())
        return ResultExceptionFactory.error(StatusCodes.UNAUTHORIZED,`username and password does not match`);

      return new Ok(undefined);
    }
    catch(ex){
      const error=ex as Error;
      return ResultExceptionFactory.error(StatusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
  }

}
