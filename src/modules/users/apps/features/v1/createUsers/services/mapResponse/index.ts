import { sealed } from '@/shared/utils/decorators/sealed';
import { IServiceHandlerAsync } from '@/shared/utils/helpers/services';
import { UserEntity } from '@kishornaik/mma_db';
import { Service } from 'typedi';
import { CreateUserResponseDto } from '../../contracts';
import { ResultError, ResultExceptionFactory } from '@/shared/utils/exceptions/results';
import { Ok, Result } from 'neverthrow';
import { StatusCodes } from 'http-status-codes';

export interface ICreateUserMapResponse
	extends IServiceHandlerAsync<UserEntity, CreateUserResponseDto> {}

@sealed
@Service()
export class CreateUserMapResponseService implements ICreateUserMapResponse {
	public async handleAsync(
		params: UserEntity
	): Promise<Result<CreateUserResponseDto, ResultError>> {
		try {
			//@guard
			if (!params)
				return ResultExceptionFactory.error(StatusCodes.BAD_REQUEST, 'Invalid params');

			// Map
			const createUserResponseDto = new CreateUserResponseDto();
			createUserResponseDto.clientId = params.clientId;
			createUserResponseDto.identifier = params.identifier;

			return new Ok(createUserResponseDto);
		} catch (ex) {
			const error = ex as Error;
			return ResultExceptionFactory.error(StatusCodes.INTERNAL_SERVER_ERROR, error.message);
		}
	}
}
