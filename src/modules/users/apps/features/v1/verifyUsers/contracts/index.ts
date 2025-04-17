import { Type } from "class-transformer";
import { IsNotEmpty, IsUUID } from "class-validator";

// @region  Request Dto
export class VerifyUserRequestDto{

  @IsNotEmpty()
  @IsUUID()
  @Type(()=> String)
  public emailToken:string;
}
// @endregion

// @Region Response Dto
export class VerifyUserResponseDto{

  public message:string;
}
