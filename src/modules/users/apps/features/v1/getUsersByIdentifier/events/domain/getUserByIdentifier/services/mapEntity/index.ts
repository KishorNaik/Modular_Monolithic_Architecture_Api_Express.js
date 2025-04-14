import { sealed } from '@/shared/utils/decorators/sealed';
import { Service } from 'typedi';
import { GetUserByIdentifierDomainEventRequestDto } from '../../../../../contracts/Index';
import { IServiceHandlerAsync } from '@/shared/utils/helpers/services';
import { UserEntity } from '@kishornaik/mma_db';
import { ResultError, ResultExceptionFactory } from '@/shared/utils/exceptions/results';
import { Ok, Result } from 'neverthrow';
import { StatusCodes } from 'http-status-codes';

export interface IGetUserByIdentifierMapEntityServiceParameter {
	dto: GetUserByIdentifierDomainEventRequestDto;
}

export interface IGetUserByIdentifierMapEntityService
	extends IServiceHandlerAsync<IGetUserByIdentifierMapEntityServiceParameter, UserEntity> {}

@sealed
@Service()
export class GetUserByIdentifierMapEntityService implements IGetUserByIdentifierMapEntityService {
	public async handleAsync(
		params: IGetUserByIdentifierMapEntityServiceParameter
	): Promise<Result<UserEntity, ResultError>> {
		try {
			// @Guard
			if (!params)
				return ResultExceptionFactory.error(StatusCodes.BAD_REQUEST, 'Invalid params');

			if (!params.dto)
				return ResultExceptionFactory.error(StatusCodes.BAD_REQUEST, 'Invalid dto');

			// Map Entity
			const userEntity = new UserEntity();
			userEntity.identifier = params.dto.identifier;
			userEntity.status = params.dto.status;

			return new Ok(userEntity);
		} catch (ex) {
			const error = ex as Error;
			return ResultExceptionFactory.error(StatusCodes.INTERNAL_SERVER_ERROR, error.message);
		}
	}
}
