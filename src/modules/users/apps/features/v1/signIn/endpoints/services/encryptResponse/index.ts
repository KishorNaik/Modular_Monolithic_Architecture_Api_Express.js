import { sealed } from "@/shared/utils/decorators/sealed";
import { AesEncryptWrapper } from "@/shared/utils/helpers/aes";
import { Service } from "typedi";
import { UserSignInResponseDto } from "../../../contracts";

@sealed
@Service()
export class UserSignInEncryptResponseService extends AesEncryptWrapper<UserSignInResponseDto>{
  public constructor(){
    super();
  }
}
