import { NotificationData, notificationHandler, NotificationHandler } from "mediatr-ts";
import { UserVerificationTokenEmailIntegrationEventRequestDto } from "../../contracts";
import { sealed } from "@/shared/utils/decorators/sealed";
import { UserVerificationTokenEmailIntegrationEventRequestValidationService } from "./services/validations";
import Container from "typedi";
import { SendUserEmailVerificationTokenService } from "./services/email";
import medaitR from "@/shared/medaitR";
import { IsVerificationEmailSendIntegrationEventRequestDto, IsVerificationEmailSendIntegrationEventService } from "@/modules/users/apps/features/v1/isVerificationEmailUpdate";

// @region Integration Event
export class UserVerificationTokenEmailIntegrationEventService extends NotificationData  {
  private readonly _request:UserVerificationTokenEmailIntegrationEventRequestDto;

  public constructor(request){
    super();
    this._request=request;
  }

  public get request():UserVerificationTokenEmailIntegrationEventRequestDto{
    return this._request;
  }
}
// @endregion

// @region Integration Event Handler
@sealed
@notificationHandler(UserVerificationTokenEmailIntegrationEventService)
export class UserVerificationTokenEmailIntegrationEventServiceHandler implements NotificationHandler<UserVerificationTokenEmailIntegrationEventService>  {

  private readonly _userVerificationTokenEmailIntegrationEventRequestValidationService:UserVerificationTokenEmailIntegrationEventRequestValidationService
  private readonly _sendUserEmailVerificationTokenService:SendUserEmailVerificationTokenService;
  public constructor(){
    this._userVerificationTokenEmailIntegrationEventRequestValidationService=Container.get(UserVerificationTokenEmailIntegrationEventRequestValidationService);
    this._sendUserEmailVerificationTokenService=Container.get(SendUserEmailVerificationTokenService);
  }

  public async handle(notification: UserVerificationTokenEmailIntegrationEventService): Promise<void> {
    try
    {
      // @Gaurd
      if(!notification)
        throw new Error('invalid notification');

      if(!notification.request)
        throw new Error("invalid notification request");

      const request:UserVerificationTokenEmailIntegrationEventRequestDto=notification.request;

      // Validation
      const userVerificationTokenEmailIntegrationEventRequestValidationServiceResult=await this._userVerificationTokenEmailIntegrationEventRequestValidationService.handleAsync({
        dto:request,
        dtoClass:UserVerificationTokenEmailIntegrationEventRequestDto
      });
      if(userVerificationTokenEmailIntegrationEventRequestValidationServiceResult.isErr())
        throw new Error(userVerificationTokenEmailIntegrationEventRequestValidationServiceResult.error.message);

      // Email Send
      const sendUserEmailVerificationTokenServiceResult=await this._sendUserEmailVerificationTokenService.handle(request);
      if(sendUserEmailVerificationTokenServiceResult.isErr())
        throw new Error(sendUserEmailVerificationTokenServiceResult.error.message);

      // Update User verification Flag
      const isVerificationEmailSendIntegrationEventRequestDto:IsVerificationEmailSendIntegrationEventRequestDto=new IsVerificationEmailSendIntegrationEventRequestDto();
      isVerificationEmailSendIntegrationEventRequestDto.identifier=request.userId;
      await medaitR.publish(new IsVerificationEmailSendIntegrationEventService(isVerificationEmailSendIntegrationEventRequestDto));
    }
    catch(ex){
      throw ex;
    }
  }

}
// @endregion
