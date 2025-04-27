import { IsSafeString } from "@/shared/utils/validations/decorators/isSafeString";
import { Type } from "class-transformer";
import { IsNotEmpty, IsString, IsUUID } from "class-validator";

//@region Request Dto
export class DeactivateUserRequestDto {

    @IsNotEmpty()
    @IsString()
    @IsSafeString({ message: 'Name must not contain HTML or JavaScript code' })
    @IsUUID()
    @Type(() => String)
    public identifier: string;

}
//@endregion

//@region Response Dto
export class DeactivateUserResponseDto{
  public message: string;
}
//@endregion
