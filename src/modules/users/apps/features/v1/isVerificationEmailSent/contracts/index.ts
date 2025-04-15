import { Type } from "class-transformer";
import { IsNotEmpty, IsUUID } from "class-validator";

// @region Integration Event Request Dto
export class IsVerificationEmailSendIntegrationEventRequestDto{
  @IsNotEmpty()
  @IsUUID()
  @Type(()=> String)
  public identifier?: string
}
// @endregion
