import { IsSafeString } from '@/shared/utils/validations/decorators/isSafeString';
import { Type } from 'class-transformer';
import { IsEmail, IsMobilePhone, IsNotEmpty, IsString, IsUUID, Length } from 'class-validator';

//@region Request Dto
export class UpdateUserRequestDto {
	@IsNotEmpty()
	@IsString()
	@IsSafeString({ message: 'Name must not contain HTML or JavaScript code' })
	@IsUUID()
	@Type(() => String)
	public identifier: string;

	@IsString()
	@IsNotEmpty()
	@IsSafeString({ message: 'Name must not contain HTML or JavaScript code' })
	@Length(2, 50, { message: 'First name must be between 2 and 50 characters' })
	@Type(() => String)
	public firstName?: string;

	@IsString()
	@IsNotEmpty()
	@IsSafeString({ message: 'Name must not contain HTML or JavaScript code' })
	@Length(2, 50, { message: 'Last name must be between 2 and 50 characters' })
	@Type(() => String)
	public lastName?: string;

	@IsString()
	@IsNotEmpty()
	@IsEmail({}, { message: 'Email must be a valid email address' })
	@IsSafeString({ message: 'Name must not contain HTML or JavaScript code' })
	@Type(() => String)
	public email?: string;

	@IsString()
	@IsNotEmpty()
	@IsMobilePhone('en-IN', {}, { message: 'Mobile number must be a valid Indian mobile number' })
	@IsSafeString({ message: 'Name must not contain HTML or JavaScript code' })
	@Type(() => String)
	public mobileNo?: string;
}
//@endregion

//@region Response Dto
export class UpdateUserResponseDto {
	public message: string;
}
// @endregion
