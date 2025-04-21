import { IUsers } from '@/modules/users/shared/types';
import { sealed } from '@/shared/utils/decorators/sealed';
import { ResultError, ResultExceptionFactory } from '@/shared/utils/exceptions/results';
import { IServiceHandlerAsync } from '@/shared/utils/helpers/services';
import { UserEntity, UserKeysEntity } from '@kishornaik/mma_db';
import { StatusCodes } from 'http-status-codes';
import { Ok, Result } from 'neverthrow';
import { Service } from 'typedi';

export interface IMapRefreshTokenUserEntityServiceParameters {
	refreshToken: string;
	users: IUsers;
}

export interface IMapRefreshTokenUserEntityServiceResults {
	entity: {
		userEntity: UserEntity;
		keys: UserKeysEntity;
	};
}

export interface IMapRefreshTokenUserEntityService
	extends IServiceHandlerAsync<
		IMapRefreshTokenUserEntityServiceParameters,
		IMapRefreshTokenUserEntityServiceResults
	> {}

@sealed
@Service()
export class MapRefreshTokenUserEntityService implements IMapRefreshTokenUserEntityService {
	public async handleAsync(
		params: IMapRefreshTokenUserEntityServiceParameters
	): Promise<Result<IMapRefreshTokenUserEntityServiceResults, ResultError>> {
		try {
			//@Guard
			if (!params)
				return ResultExceptionFactory.error(StatusCodes.BAD_REQUEST, 'Invalid params');

			if (!params.refreshToken)
				return ResultExceptionFactory.error(
					StatusCodes.BAD_REQUEST,
					'Invalid refreshToken'
				);

			if (!params.users)
				return ResultExceptionFactory.error(StatusCodes.BAD_REQUEST, 'Invalid users');

			const { refreshToken, users } = params;

			// Map Entity
			const userEntity = new UserEntity();
			userEntity.identifier = users.identifier;
			userEntity.status = users.status;
			userEntity.modified_date = new Date();

			const keysEntity = new UserKeysEntity();
			keysEntity.identifier = users.keys.identifier;
			keysEntity.status = users.keys.status;
			keysEntity.refresh_token = refreshToken;
			keysEntity.refresh_Token_expires_at = new Date(
				new Date().getTime() + 24 * 60 * 60 * 1000
			);

			const result: IMapRefreshTokenUserEntityServiceResults = {
				entity: {
					userEntity,
					keys: keysEntity,
				},
			};

			return new Ok(result);
		} catch (ex) {
			const error = ex as Error;
			return ResultExceptionFactory.error(StatusCodes.INTERNAL_SERVER_ERROR, error.message);
		}
	}
}
