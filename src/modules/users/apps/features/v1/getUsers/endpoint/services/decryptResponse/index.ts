import { sealed } from "@/shared/utils/decorators/sealed";
import { AesEncryptWrapper } from "@/shared/utils/helpers/aes";
import { Service } from "typedi";
import { GetUsersResponseDto } from "../../../contracts";

@sealed
@Service()
export class GetUsersDecryptResponseService extends AesEncryptWrapper<Array<GetUsersResponseDto>>{
  public constructor() {
    super();
  }
}
