import { sealed } from '@/shared/utils/decorators/sealed';
import { IServiceHandlerAsync } from '@/shared/utils/helpers/services';
import { UserEntity } from '@kishornaik/mma_db';
import { Service } from 'typedi';
import { IUsersForAdmin } from '../../../../../contracts';
import { ResultError, ResultExceptionFactory } from '@/shared/utils/exceptions/results';
import { Ok, Result } from 'neverthrow';
import { StatusCodes } from 'http-status-codes';
import Enumerable from 'linq';

export interface IGetUsersFromEntityToTypeMapperService
	extends IServiceHandlerAsync<Array<UserEntity>, Array<IUsersForAdmin>> {}

@sealed
@Service()
export class GetUsersFromEntityToTypeMapperService
	implements IGetUsersFromEntityToTypeMapperService
{
	public async handleAsync(params: UserEntity[]): Promise<Result<IUsersForAdmin[], ResultError>> {
		try {
			//@guard
			if (!params || params.length === 0)
				return ResultExceptionFactory.error(StatusCodes.BAD_REQUEST, 'Invalid params');

			// Mapper
			const users = Enumerable.from(params)
				.select<IUsersForAdmin>((x) => ({
					clientId: x.clientId,
					identifier: x.identifier,
					firstName: x.firstName,
					lastName: x.lastName,
					status: x.status,
					version: x.version,
					created_date: x.created_date,
					modified_date: x.modified_date,
					communication: x.userCommunication,
					settings: x.userSetting,
					credentials: x.userCredentials,
					keys: x.userKeys,
				}))
				.toArray();

			if (!users || users.length == 0)
				return ResultExceptionFactory.error(StatusCodes.NOT_FOUND, `users not found`);

			return new Ok(users);
		} catch (ex) {
			const error = ex as Error;
			return ResultExceptionFactory.error(StatusCodes.INTERNAL_SERVER_ERROR, error.message);
		}
	}
}
