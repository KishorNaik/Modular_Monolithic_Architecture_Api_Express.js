import { IUsers } from "@/modules/users/shared/types";
import { sealed } from "@/shared/utils/decorators/sealed";
import { IServiceHandlerAsync } from "@/shared/utils/helpers/services";
import { Service } from "typedi";
import { RefreshTokenResponseDto } from "../../../contracts";
import { IUserSignInGenerateJwtAndRefreshTokenServiceResult } from "@/modules/users/shared/services/generateJwtAndRefresh";
import { ResultError, ResultExceptionFactory } from "@/shared/utils/exceptions/results";
import { Ok, Result } from "neverthrow";
import { StatusCodes } from "http-status-codes";

export interface IMapUpdateRefreshTokenService extends IServiceHandlerAsync<IUserSignInGenerateJwtAndRefreshTokenServiceResult,RefreshTokenResponseDto>{}

@sealed
@Service()
export class MapUpdateRefreshTokenResponseService implements IMapUpdateRefreshTokenService{
  public async handleAsync(params: IUserSignInGenerateJwtAndRefreshTokenServiceResult): Promise<Result<RefreshTokenResponseDto, ResultError>> {
    try
    {
      if(!params)
        return ResultExceptionFactory.error(StatusCodes.BAD_REQUEST,'Invalid params');
      if(!params.accessToken)
        return ResultExceptionFactory.error(StatusCodes.BAD_REQUEST,'Invalid accessToken');
      if(!params.refreshToken)
        return ResultExceptionFactory.error(StatusCodes.BAD_REQUEST,'Invalid refreshToken');

      // Map Response
      const result: RefreshTokenResponseDto = new RefreshTokenResponseDto();
      result.accessToken = params.accessToken;
      result.refreshToken = params.refreshToken;

      return new Ok(result);
    }
    catch(ex){
      const error=ex as Error;
      return ResultExceptionFactory.error(StatusCodes.INTERNAL_SERVER_ERROR,error.message);
    }
  }

}
