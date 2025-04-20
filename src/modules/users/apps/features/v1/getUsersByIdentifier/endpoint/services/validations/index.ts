import { sealed } from "@/shared/utils/decorators/sealed";
import { DtoValidation } from "@/shared/utils/validations/dto";
import { Service } from "typedi";
import { GetUserByIdentifierRequestDto } from "../../../contracts/Index";

@sealed
@Service()
export class GetUserByIdentifierValidationRequestService extends DtoValidation<GetUserByIdentifierRequestDto> {
  public constructor() {
    super()
  }
}
