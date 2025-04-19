import { sealed } from "@/shared/utils/decorators/sealed";
import { AesDecryptWrapper } from "@/shared/utils/helpers/aes";
import { Service } from "typedi";
import { UserSignInRequestDto } from "../../../contracts";

@sealed
@Service()
export class UserSignInDecryptRequestService extends AesDecryptWrapper<UserSignInRequestDto>{
  public constructor(){
    super();
  }
}
