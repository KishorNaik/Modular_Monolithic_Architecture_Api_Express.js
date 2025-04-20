import { UserSharedCacheService } from '@/modules/users/shared/cache';
import { IUsers } from '@/modules/users/shared/types';
import { sealed } from '@/shared/utils/decorators/sealed';
import { ResultError, ResultExceptionFactory } from '@/shared/utils/exceptions/results';
import { IServiceHandlerAsync } from '@/shared/utils/helpers/services';
import { StatusEnum } from '@kishornaik/mma_db';
import { StatusCodes } from 'http-status-codes';
import { Ok, Result } from 'neverthrow';
import Container, { Service } from 'typedi';

export interface IGetUserByIdentifierServiceParameters {
	userId: string;
	status: StatusEnum;
}

export interface IGetUserByIdentifierService
	extends IServiceHandlerAsync<IGetUserByIdentifierServiceParameters, IUsers> {}

@sealed
@Service()
export class GetUserByIdentifierService implements IGetUserByIdentifierService {
	private readonly _userSharedCacheService: UserSharedCacheService;

	public constructor() {
		this._userSharedCacheService = Container.get(UserSharedCacheService);
	}

	public async handleAsync(
		params: IGetUserByIdentifierServiceParameters
	): Promise<Result<IUsers, ResultError>> {
		try {
			// @Guard
			if (!params)
				return ResultExceptionFactory.error(StatusCodes.BAD_REQUEST, 'Invalid params');

			if (!params.userId)
				return ResultExceptionFactory.error(StatusCodes.BAD_REQUEST, 'Invalid userId');

			if (params.status === null)
				return ResultExceptionFactory.error(StatusCodes.BAD_REQUEST, 'Invalid status');

			// Get User data by User Id
			const userSharedCacheServiceResult = await this._userSharedCacheService.handleAsync({
				identifier: params.userId,
				status: params.status,
			});
			if (userSharedCacheServiceResult.isErr())
				return ResultExceptionFactory.error(
					userSharedCacheServiceResult.error.status,
					userSharedCacheServiceResult.error.message
				);

			const users: IUsers = userSharedCacheServiceResult.value.users;

			if (users.status !== StatusEnum.ACTIVE)
				return ResultExceptionFactory.error(
					StatusCodes.FORBIDDEN,
					`User with emailId ${users.credentials.username} is not active`
				);

			return new Ok(users);
		} catch (ex) {
			const error = ex as Error;
			return ResultExceptionFactory.error(StatusCodes.INTERNAL_SERVER_ERROR, error.message);
		}
	}
}
