import { IsSafeString } from '@/shared/utils/validations/decorators/isSafeString';
import { Type } from 'class-transformer';
import { IsEmail, IsMobilePhone, IsNotEmpty, IsString, Length, Matches } from 'class-validator';

// @region Request dto
export class CreateUserRequestDto {
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

	@IsString()
	@IsNotEmpty()
	@IsSafeString({ message: 'Name must not contain HTML or JavaScript code' })
	@Length(8, 20, { message: 'Password must be between 8 and 20 characters' })
	@Matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/, {
		message: 'Password must contain at least one letter and one number',
	})
	@Type(() => String)
	public password?: string;
}
// @endregion

// @region Response dto
export class CreateUserResponseDto {}
// @endregion
