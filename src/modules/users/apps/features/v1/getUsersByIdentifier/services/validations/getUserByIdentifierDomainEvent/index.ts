import { sealed } from "@/shared/utils/decorators/sealed";
import { DtoValidation } from "@/shared/utils/validations/dto";
import { Service } from "typedi";
import { GetUserByIdentifierDomainEventRequestDto } from "../../../contracts/Index";

@sealed
@Service()
export class GetUserByIdentifierDomainEventValidationService extends DtoValidation<GetUserByIdentifierDomainEventRequestDto>{
  public constructor(){
    super();
  }
}
