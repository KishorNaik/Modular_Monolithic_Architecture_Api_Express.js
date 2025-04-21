import { MapRefreshTokenUserEntityService } from '@/modules/users/shared/services/mapRefrehToken';
import { IUsers } from '@/modules/users/shared/types';
import { sealed } from '@/shared/utils/decorators/sealed';
import { ResultError, ResultExceptionFactory } from '@/shared/utils/exceptions/results';
import { IServiceHandlerAsync } from '@/shared/utils/helpers/services';
import { UserEntity, UserKeysEntity } from '@kishornaik/mma_db';
import { StatusCodes } from 'http-status-codes';
import { Ok, Result } from 'neverthrow';
import { Service } from 'typedi';

export interface IMapUserSignInEntityServiceParameters {
	refreshToken: string;
	users: IUsers;
}

export interface IMapUserSignInEntityServiceResults {
	entity: {
		userEntity: UserEntity;
		keys: UserKeysEntity;
	};
}

export interface IMapUserSignInEntityService
	extends IServiceHandlerAsync<
		IMapUserSignInEntityServiceParameters,
		IMapUserSignInEntityServiceResults
	> {}

@sealed
@Service()
export class MapUserSignInEntityService implements IMapUserSignInEntityService {
	private readonly _mapRefreshTokenUserEntityService: MapRefreshTokenUserEntityService;

	public async handleAsync(
		params: IMapUserSignInEntityServiceParameters
	): Promise<Result<IMapUserSignInEntityServiceResults, ResultError>> {
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

			const mapRefreshTokenUserEntityServiceResult =
				await this._mapRefreshTokenUserEntityService.handleAsync({
					refreshToken,
					users,
				});
			if (mapRefreshTokenUserEntityServiceResult.isErr())
				return ResultExceptionFactory.error(
					mapRefreshTokenUserEntityServiceResult.error.status,
					mapRefreshTokenUserEntityServiceResult.error.message
				);

			const result: IMapUserSignInEntityServiceResults = {
				entity: {
					userEntity: mapRefreshTokenUserEntityServiceResult.value.entity.userEntity,
					keys: mapRefreshTokenUserEntityServiceResult.value.entity.keys,
				},
			};

			return new Ok(result);
		} catch (ex) {
			const error = ex as Error;
			return ResultExceptionFactory.error(StatusCodes.INTERNAL_SERVER_ERROR, error.message);
		}
	}
}
