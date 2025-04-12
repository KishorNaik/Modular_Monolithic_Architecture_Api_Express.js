import { IsSafeString } from '@/shared/utils/validations/decorators/isSafeString';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

// #region Request Dto
export class DemoAesRequestDto {
	@IsNotEmpty()
	@IsString()
	@IsSafeString({ message: 'Name must not contain HTML or JavaScript code' })
	@Type(() => String)
	public firstName: string;

	@IsNotEmpty()
	@IsString()
	@IsSafeString({ message: 'Name must not contain HTML or JavaScript code' })
	@Type(() => String)
	public lastName: string;
}

// #endregion

// #region Response Dto
export class DemoAesResponseDto {
	public firstName: string;

	public lastName: string;
}
// #endregion
