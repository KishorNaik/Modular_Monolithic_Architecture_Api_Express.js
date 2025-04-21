import { sealed } from "@/shared/utils/decorators/sealed";
import { DtoValidation } from "@/shared/utils/validations/dto";
import { Service } from "typedi";
import { RefreshTokenRequestDto } from "../../../contracts";

@sealed
@Service()
export class UpdateRefreshTokenRequestValidationService extends DtoValidation<RefreshTokenRequestDto>{
  public constructor(){
    super();
  }
}
