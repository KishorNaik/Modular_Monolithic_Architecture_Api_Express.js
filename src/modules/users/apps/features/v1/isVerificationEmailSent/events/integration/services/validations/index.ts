import { sealed } from "@/shared/utils/decorators/sealed";
import { DtoValidation } from "@/shared/utils/validations/dto";
import { Service } from "typedi";
import { IsVerificationEmailSendIntegrationEventRequestDto } from "../../../../contracts";

@sealed
@Service()
export class IsVerificationEmailSendIntegrationEventValidationService extends DtoValidation<IsVerificationEmailSendIntegrationEventRequestDto>{
  public constructor() {
    super();
  }
}
