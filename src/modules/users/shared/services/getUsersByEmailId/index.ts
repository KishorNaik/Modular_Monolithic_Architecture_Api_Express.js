import { sealed } from '@/shared/utils/decorators/sealed';
import { IServiceHandlerAsync } from '@/shared/utils/helpers/services';
import Container, { Service } from 'typedi';
import { IUsers } from '../../types';
import { ResultError, ResultExceptionFactory } from '@/shared/utils/exceptions/results';
import { Ok, Result } from 'neverthrow';
import { UserSharedCacheService } from '../../cache';
import { StatusCodes } from 'http-status-codes';
import { RedisHelper } from '@/shared/utils/helpers/redis';

export interface IGetUsersByEmailIdServiceParameters {
	emailId: string;
}

export interface IGetUsersByEmailIdService
	extends IServiceHandlerAsync<IGetUsersByEmailIdServiceParameters, IUsers> {}

@sealed
@Service()
export class GetUsersByEmailIdService implements IGetUsersByEmailIdService {
	private readonly _redisHelper: RedisHelper;

	public constructor() {
		this._redisHelper = Container.get(RedisHelper);
	}

	public async handleAsync(
		params: IGetUsersByEmailIdServiceParameters
	): Promise<Result<IUsers, ResultError>> {
		try {
			// @Guard
			if (!params)
				return ResultExceptionFactory.error(StatusCodes.BAD_REQUEST, 'Invalid params');

			if (!params.emailId)
				return ResultExceptionFactory.error(StatusCodes.BAD_REQUEST, 'Invalid emailId');

			// Get Users By EmailId
			const cacheKey: string = `users_email_${params.emailId}`;

			// init Redis Cache
			await this._redisHelper.init(true);

			// Get Users By EmailId From Cache
			const getUserByEmailIdCacheServiceResult = await this._redisHelper.get(cacheKey);
			if (getUserByEmailIdCacheServiceResult.isErr())
				return ResultExceptionFactory.error(
					getUserByEmailIdCacheServiceResult.error.status,
					getUserByEmailIdCacheServiceResult.error.message
				);

			const cacheValue: string = getUserByEmailIdCacheServiceResult.value;

			// If User Not Found
			if (!cacheValue)
				return ResultExceptionFactory.error(
					StatusCodes.NOT_FOUND,
					`User with emailId ${params.emailId} not found`
				);

			const users: IUsers = JSON.parse(cacheValue);
			return new Ok(users);
		} catch (ex) {
			const error = ex as Error;
			return ResultExceptionFactory.error(StatusCodes.INTERNAL_SERVER_ERROR, error.message);
		}
	}
}
