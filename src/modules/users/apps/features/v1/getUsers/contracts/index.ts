import { IUserCredentials, IUserKeys, IUsers } from '@/modules/users/shared/types';
import { PaginationQueryStringParametersModel } from '@/shared/models/request/paginationQueryString.request';
import { IsSafeString } from '@/shared/utils/validations/decorators/isSafeString';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

//@region Request Dto
export class GetUsersRequestDto extends PaginationQueryStringParametersModel {
	@IsOptional()
	@IsString()
	@IsNotEmpty()
	@IsSafeString()
	@Type(() => String)
	public filter?: string;
}
//@endregion

//@region Response Dto
export class GetUsersResponseDto implements IUsersForAdmin {}

//@endregion

//@region Types
// Omit aesSecretKey and hmacSecretKey from IUserKeys
export type IUserKeysWithoutSecrets = Omit<IUserKeys, 'aesSecretKey' | 'hmacSecretKey'>;

// Omit salt and hash from IUserCredentials
export type IUserCredentialsWithoutSensitive = Omit<IUserCredentials, 'salt' | 'hash'>;

// Extend IUsers to redefine keys and credentials with the modified types
export interface IUsersForAdmin extends IUsers {
	keys?: IUserKeysWithoutSecrets;
	credentials?: IUserCredentialsWithoutSensitive;
}
//@endregion
