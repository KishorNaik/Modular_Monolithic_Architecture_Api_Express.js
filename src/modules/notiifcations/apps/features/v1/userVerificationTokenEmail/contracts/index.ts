import { IsSafeString } from '@/shared/utils/validations/decorators/isSafeString';
import { Type } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, IsUUID } from 'class-validator';

// @region  UserVerificationTokenEmail Integration Event Request Dto
export class UserVerificationTokenEmailIntegrationEventRequestDto {
	@IsNotEmpty()
	@IsUUID()
	@Type(() => String)
	public userId: string;

	@IsString()
	@IsNotEmpty()
	@IsEmail({}, { message: 'Email must be a valid email address' })
	@IsSafeString({ message: 'Name must not contain HTML or JavaScript code' })
	@Type(() => String)
	public email?: string;

	@IsString()
	@IsNotEmpty()
	@IsSafeString({ message: 'Name must not contain HTML or JavaScript code' })
	@Type(() => String)
	public fullName?: string;

	@IsString()
	@IsNotEmpty()
	@IsUUID()
	@IsSafeString({ message: 'Name must not contain HTML or JavaScript code' })
	@Type(() => String)
	public emailVerificationToken: string;
}
// @endregion
