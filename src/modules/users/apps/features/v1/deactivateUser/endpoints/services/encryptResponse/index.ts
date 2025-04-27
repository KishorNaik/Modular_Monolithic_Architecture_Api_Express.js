import { sealed } from "@/shared/utils/decorators/sealed";
import { AesEncryptWrapper } from "@/shared/utils/helpers/aes";
import { Service } from "typedi";
import { DeactivateUserResponseDto } from "../../../contracts";

@sealed
@Service()
export class DeactivatedUserEncryptResponseService extends AesEncryptWrapper<DeactivateUserResponseDto> {
  public constructor(){
    super();
  }
}
