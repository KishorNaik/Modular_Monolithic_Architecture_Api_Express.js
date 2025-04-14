import { IUsers } from '@/modules/users/shared/types';
import { IsSafeString } from '@/shared/utils/validations/decorators/isSafeString';
import { QueryRunner, StatusEnum } from '@kishornaik/mma_db';
import { Type } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsString, IsUUID, ValidateIf } from 'class-validator';

// @region Request Dto
export class GetUserByIdentifierRequestDto {
	@IsNotEmpty()
	@IsString()
	@IsSafeString({ message: 'Name must not contain HTML or JavaScript code' })
	@IsUUID()
	@Type(() => String)
	public identifier: string;
}
// @endregion

// @region Response Dto
export class GetUserByIdentifierResponseDto {
	public user: UserType;
}
// @endregion

// @region Get User By Identifier Domain Event Request
export class GetUserByIdentifierDomainEventRequestDto {
	@IsNotEmpty()
	@IsString()
	@IsSafeString({ message: 'Name must not contain HTML or JavaScript code' })
	@IsUUID()
	@Type(() => String)
	public identifier: string;

	@IsEnum(StatusEnum)
	@IsNotEmpty()
	public status: StatusEnum;
}
// @endregion

//@region Get User By Identifier Domain Event Handler Response
export class GetUserByIdentifierDomainEventResponseDto {
	public user: IUsers;
}
//@endregion

// @region Types
export type UserType = Omit<IUsers, 'keys' | 'credentials' | 'version'>;
// @endregion
