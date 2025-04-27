import { sealed } from "@/shared/utils/decorators/sealed";
import { DtoValidation } from "@/shared/utils/validations/dto";
import { Service } from "typedi";
import { UpdateUserRequestDto } from "../../../contracts";

@sealed
@Service()
export class UpdateUserValidationRequestService extends DtoValidation<UpdateUserRequestDto>{
  public constructor(){
    super();
  }
}
