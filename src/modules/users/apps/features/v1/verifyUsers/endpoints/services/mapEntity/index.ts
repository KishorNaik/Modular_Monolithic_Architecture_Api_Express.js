import { sealed } from "@/shared/utils/decorators/sealed";
import { IServiceHandlerAsync } from "@/shared/utils/helpers/services";
import { Service } from "typedi";
import { VerifyUserRequestDto } from "../../../contracts";
import { StatusEnum, UserSettingsEntity } from "@kishornaik/mma_db";
import { ResultError, ResultExceptionFactory } from "@/shared/utils/exceptions/results";
import { Ok, Result } from "neverthrow";
import { StatusCodes } from "http-status-codes";

export interface IMapVerifyUserRequestDtoToEntityService extends IServiceHandlerAsync<VerifyUserRequestDto,UserSettingsEntity>{}

@sealed
@Service()
export class MapVerifyUserRequestDtoToEntityService implements IMapVerifyUserRequestDtoToEntityService{
  public async handleAsync(params: VerifyUserRequestDto): Promise<Result<UserSettingsEntity, ResultError>> {
    try
    {
      // @Guard
      if(!params)
        return ResultExceptionFactory.error(StatusCodes.BAD_REQUEST,"Invalid params");

      // Map Entity
      const userSettingsEntity:UserSettingsEntity=new UserSettingsEntity();
      userSettingsEntity.emailVerificationToken=params.emailToken;
      userSettingsEntity.status=StatusEnum.INACTIVE;

      return new Ok(userSettingsEntity);
    }
    catch(ex){
      const error=ex as Error;
      return ResultExceptionFactory.error(StatusCodes.INTERNAL_SERVER_ERROR,error.message);
    }
  }

}
