import { sealed } from '@/shared/utils/decorators/sealed';
import { ResultError, ResultExceptionFactory } from '@/shared/utils/exceptions/results';
import { IServiceHandlerAsync } from '@/shared/utils/helpers/services';
import { GetUsersByIdentifierService, UserEntity } from '@kishornaik/mma_db';
import { StatusCodes } from 'http-status-codes';
import { Ok, Result } from 'neverthrow';
import Container, { Service } from 'typedi';

Container.set<GetUsersByIdentifierService>(
	GetUsersByIdentifierService,
	new GetUsersByIdentifierService()
);

export interface IGetUsersByIdentifierDbService
	extends IServiceHandlerAsync<UserEntity, UserEntity> {}

@sealed
@Service()
export class GetUserByIdentifierDbService implements IGetUsersByIdentifierDbService {
	private readonly _getUserByIdentifierService: GetUsersByIdentifierService;

	public constructor() {
		this._getUserByIdentifierService = Container.get(GetUsersByIdentifierService);
	}

	public async handleAsync(params: UserEntity): Promise<Result<UserEntity, ResultError>> {
		try {
			// @guard
			if (!params)
				return ResultExceptionFactory.error(StatusCodes.BAD_REQUEST, 'Invalid params');

			// Db Service
			const getUserByIdentifierServiceResult =
				await this._getUserByIdentifierService.handleAsync({
					userEntity: params,
				});
			if (getUserByIdentifierServiceResult.isErr())
				return ResultExceptionFactory.error(
					getUserByIdentifierServiceResult.error.statusCode,
					getUserByIdentifierServiceResult.error.message
				);

			return new Ok(getUserByIdentifierServiceResult.value);
		} catch (ex) {
			const error = ex as Error;
			return ResultExceptionFactory.error(StatusCodes.INTERNAL_SERVER_ERROR, error.message);
		}
	}
}
