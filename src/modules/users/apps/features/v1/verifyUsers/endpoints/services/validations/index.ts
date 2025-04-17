import { sealed } from "@/shared/utils/decorators/sealed";
import { DtoValidation } from "@/shared/utils/validations/dto";
import { Service } from "typedi";
import { VerifyUserRequestDto } from "../../../contracts";

@sealed
@Service()
export class VerifyUserValidationRequestService extends DtoValidation<VerifyUserRequestDto>{
  public constructor()
  {
    super();
  }
}
