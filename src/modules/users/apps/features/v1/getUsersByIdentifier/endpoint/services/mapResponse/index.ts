import { IUsers } from "@/modules/users/shared/types";
import { sealed } from "@/shared/utils/decorators/sealed";
import { IServiceHandlerAsync } from "@/shared/utils/helpers/services";
import { Service } from "typedi";
import { GetUserByIdentifierResponseDto } from "../../../contracts/Index";
import { ResultError, ResultExceptionFactory } from "@/shared/utils/exceptions/results";
import { Ok, Result } from "neverthrow";
import { StatusCodes } from "http-status-codes";

export interface IGetUsersByIdentifierResponseMapperService extends IServiceHandlerAsync<IUsers,GetUserByIdentifierResponseDto> {}

@sealed
@Service()
export class GetUsersByIdentifierResponseMapperService implements IGetUsersByIdentifierResponseMapperService{
  public async handleAsync(params: IUsers): Promise<Result<GetUserByIdentifierResponseDto, ResultError>> {
    try
    {
      //Guard
      if(!params)
        return ResultExceptionFactory.error(StatusCodes.BAD_REQUEST,'Invalid params');

      // Map Response
      const response:GetUserByIdentifierResponseDto=new GetUserByIdentifierResponseDto();
      response.user={
        clientId: params.clientId,
        identifier: params.identifier,
        firstName: params.firstName,
        lastName: params.lastName,
        status: params.status,
        communication:params.communication,
        settings:params.settings
      }

      return new Ok(response);
    }
    catch(ex){
      const error = ex as Error;
      return ResultExceptionFactory.error(StatusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
  }
}
