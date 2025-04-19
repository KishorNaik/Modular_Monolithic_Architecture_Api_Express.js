import { IsSafeString } from "@/shared/utils/validations/decorators/isSafeString";
import { Type } from "class-transformer";
import { IsEmail, IsNotEmpty, IsString, Length, Matches } from "class-validator";

// @region Request Dto
export class UserSignInRequestDto {

  @IsString()
  @IsNotEmpty()
  @IsEmail({}, { message: 'Username must be a valid email address' })
  @IsSafeString({ message: 'Name must not contain HTML or JavaScript code' })
  @Type(() => String)
  public userName:string;

  @IsString()
  @IsNotEmpty()
  @IsSafeString({ message: 'Name must not contain HTML or JavaScript code' })
  @Length(8, 20, { message: 'Password must be between 8 and 20 characters' })
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/, {
    message: 'Password must contain at least one letter and one number',
  })
  @Type(() => String)
  public password:string;
}
//@endregion

// region Response Dto
export class UserSignInResponseDto{

  public identifier?:string;
  public clientId?:string;
  public email?:string;
  public userName?:string;
  public firstName?:string;
  public lastName?:string;
  public fullName?:string;
  public tokens?:{
    accessToken?:string;
    refreshToken?:string;
  }
  public keys?:{
    aes?:string;
    hmac?:string;
  }
}
