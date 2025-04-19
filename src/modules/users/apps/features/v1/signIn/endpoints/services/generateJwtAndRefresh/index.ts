import { RoleEnum } from "@/shared/models/enums/role.enum";
import { JwtExtendedService, JwtService } from "@/shared/services/users/userJwt.Service";
import { sealed } from "@/shared/utils/decorators/sealed";
import { ResultError, ResultExceptionFactory } from "@/shared/utils/exceptions/results";
import { IServiceHandlerAsync } from "@/shared/utils/helpers/services";
import { StatusCodes } from "http-status-codes";
import { Ok, Result } from "neverthrow";
import Container, { Service } from "typedi";

export interface IUseSignInGenerateJwtAndRefreshTokenServiceParameters{
 userId:string;
 role:RoleEnum;
}

export interface IUserSignInGenerateJwtAndRefreshTokenServiceResult{
  accessToken:string;
  refreshToken:string;
}

export interface IUserSignInGenerateJwtAndRefreshTokenService extends IServiceHandlerAsync<IUseSignInGenerateJwtAndRefreshTokenServiceParameters,IUserSignInGenerateJwtAndRefreshTokenServiceResult>{}

@sealed
@Service()
export class UserSignInGenerateJwtAndRefreshTokenService implements IUserSignInGenerateJwtAndRefreshTokenService {
  private readonly _JwtService:JwtExtendedService;
  public constructor(){
    this._JwtService=Container.get(JwtExtendedService);
  }
  public async handleAsync(params: IUseSignInGenerateJwtAndRefreshTokenServiceParameters): Promise<Result<IUserSignInGenerateJwtAndRefreshTokenServiceResult, ResultError>> {
    try
    {
      //@Guard
      if(!params)
        return ResultExceptionFactory.error(StatusCodes.BAD_REQUEST,'Invalid params');

      if(!params.role)
        return ResultExceptionFactory.error(StatusCodes.BAD_REQUEST,'Invalid role');

      if(!params.userId)
        return ResultExceptionFactory.error(StatusCodes.BAD_REQUEST,"Invalid Users")

      // Generate Jwt Token
      const generateJwtTokenResult=await this._JwtService.generateJwtTokenAsync({
        id:params.userId,
        role:params.role
      });
      if(generateJwtTokenResult.isErr())
        return ResultExceptionFactory.error(StatusCodes.INTERNAL_SERVER_ERROR,generateJwtTokenResult.error.message);

      const accessToken=generateJwtTokenResult.value[0];
      const refreshToken=generateJwtTokenResult.value[1];

      const result:IUserSignInGenerateJwtAndRefreshTokenServiceResult={
        accessToken,
        refreshToken
      }

      return new Ok(result);
    }
    catch(ex){
      const error=ex as Error;
      return ResultExceptionFactory.error(StatusCodes.INTERNAL_SERVER_ERROR,error.message);
    }
  }
}
