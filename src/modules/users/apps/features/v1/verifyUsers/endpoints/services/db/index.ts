import { sealed } from "@/shared/utils/decorators/sealed";
import { ResultError, ResultExceptionFactory } from "@/shared/utils/exceptions/results";
import { IServiceHandlerAsync } from "@/shared/utils/helpers/services";
import { GetEmailVerificationTokenService, UserSettingsEntity } from "@kishornaik/mma_db";
import { StatusCodes } from "http-status-codes";
import { Ok, Result } from "neverthrow";
import Container, { Service } from "typedi";

Container.set(GetEmailVerificationTokenService,new GetEmailVerificationTokenService());

export interface GetEmailVerificationTokenServiceResult{
  isValidToken:boolean;
  userId:string;
}

export interface IIsEmailTokenValidService extends IServiceHandlerAsync<UserSettingsEntity,GetEmailVerificationTokenServiceResult>{}

@sealed
@Service()
export class IsEmailTokenValidService implements IIsEmailTokenValidService {

  private readonly _getEmailVerificationTokenService:GetEmailVerificationTokenService;

  public constructor(){
    this._getEmailVerificationTokenService=Container.get(GetEmailVerificationTokenService);
  }

  public async handleAsync(params: UserSettingsEntity): Promise<Result<GetEmailVerificationTokenServiceResult, ResultError>> {
    let isValidToken:boolean;
    try
    {
      //@guard
      if(!params)
        return ResultExceptionFactory.error(StatusCodes.BAD_REQUEST,"Invalid params");

      // Get User Settings Data by Email Verification Token
      const getEmailVerificationTokenServiceResult=await this._getEmailVerificationTokenService.handleAsync({
        userSettingsEntity:params
      });
      if(getEmailVerificationTokenServiceResult.isErr()){
        const error=getEmailVerificationTokenServiceResult.error.message;
        if(error.includes("entity not found"))
          return ResultExceptionFactory.error(StatusCodes.NOT_ACCEPTABLE,`Email Verification Token is not valid`);

        return ResultExceptionFactory.error(getEmailVerificationTokenServiceResult.error.statusCode,getEmailVerificationTokenServiceResult.error.message);
      }

      const userSettingEntity:UserSettingsEntity=getEmailVerificationTokenServiceResult.value;

      // Check Email verification token with expire data
      const emailTokenExpiredAt=userSettingEntity.email_Verification_Token_expires_at.toString();
      const currentDate=new Date().toISOString().split('T')[0];
      const isValidToken = currentDate <= emailTokenExpiredAt;

      const result:GetEmailVerificationTokenServiceResult={
        isValidToken:isValidToken,
        userId:userSettingEntity.userId,
      }

      return new Ok(result);
    }
    catch(ex){
      const error=ex as Error;
      return ResultExceptionFactory.error(StatusCodes.INTERNAL_SERVER_ERROR,error.message);
    }
  }

}
