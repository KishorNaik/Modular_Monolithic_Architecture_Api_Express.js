import { sealed } from '@/shared/utils/decorators/sealed';
import { IServiceHandlerAsync } from '@/shared/utils/helpers/services';
import Container, { Service } from 'typedi';
import { IUsers } from '../../types';
import { ResultError, ResultExceptionFactory } from '@/shared/utils/exceptions/results';
import { Ok, Result } from 'neverthrow';
import { UserSharedCacheService } from '../../cache';
import { StatusCodes } from 'http-status-codes';
import { RedisHelper } from '@/shared/utils/helpers/redis';

export interface IGetUsersByClientIdServiceParameters {
	clientId: string;
}

export interface IGetUsersByClientIdService
	extends IServiceHandlerAsync<IGetUsersByClientIdServiceParameters, IUsers> {}

@sealed
@Service()
export class GetUsersByClientIdService implements IGetUsersByClientIdService {
	private readonly _redisHelper: RedisHelper;

	public constructor() {
		this._redisHelper = Container.get(RedisHelper);
	}

	public async handleAsync(
		params: IGetUsersByClientIdServiceParameters
	): Promise<Result<IUsers, ResultError>> {
		try {
			// @Guard
			if (!params)
				return ResultExceptionFactory.error(StatusCodes.BAD_REQUEST, 'Invalid params');

			if (!params.clientId)
				return ResultExceptionFactory.error(StatusCodes.BAD_REQUEST, 'Invalid clientId');

			// Get Users By EmailId
			const cacheKey: string = `users_clientId_${params.clientId}`;

			// init Redis Cache
			await this._redisHelper.init(true);

			// Get Users By EmailId From Cache
			const getUserByClientIdCacheServiceResult = await this._redisHelper.get(cacheKey);
			if (getUserByClientIdCacheServiceResult.isErr())
				return ResultExceptionFactory.error(
					getUserByClientIdCacheServiceResult.error.status,
					getUserByClientIdCacheServiceResult.error.message
				);

			const cacheValue: string = getUserByClientIdCacheServiceResult.value;

			// If User Not Found
			if (!cacheValue)
				return ResultExceptionFactory.error(
					StatusCodes.NOT_FOUND,
					`User with ClientId ${params.clientId} not found`
				);

			const users: IUsers = JSON.parse(cacheValue);
			return new Ok(users);
		} catch (ex) {
			const error = ex as Error;
			return ResultExceptionFactory.error(StatusCodes.INTERNAL_SERVER_ERROR, error.message);
		}
	}
}
