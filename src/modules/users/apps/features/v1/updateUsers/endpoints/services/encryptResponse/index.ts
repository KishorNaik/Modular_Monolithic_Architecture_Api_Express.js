import { sealed } from "@/shared/utils/decorators/sealed";
import { AesEncryptWrapper } from "@/shared/utils/helpers/aes";
import { Service } from "typedi";
import { UpdateUserResponseDto } from "../../../contracts";

@sealed
@Service()
export class UpdateUserEncryptResponseService extends AesEncryptWrapper<UpdateUserResponseDto>{
  public constructor(){
    super();
  }
}
