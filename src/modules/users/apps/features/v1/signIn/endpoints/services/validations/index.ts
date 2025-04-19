import { sealed } from "@/shared/utils/decorators/sealed";
import { DtoValidation } from "@/shared/utils/validations/dto";
import { Service } from "typedi";
import { UserSignInRequestDto } from "../../../contracts";

@sealed
@Service()
export class UserSignInRequestDtoValidationService extends DtoValidation<UserSignInRequestDto>{
  public constructor(){
    super();
  }
}
