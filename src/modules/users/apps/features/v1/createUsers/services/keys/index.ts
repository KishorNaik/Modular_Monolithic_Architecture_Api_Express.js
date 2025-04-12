import { sealed } from '@/shared/utils/decorators/sealed';
import { ResultError, ResultExceptionFactory } from '@/shared/utils/exceptions/results';
import { IServiceHandlerNoParamsAsync } from '@/shared/utils/helpers/services';
import { Guid } from 'guid-typescript';
import { StatusCodes } from 'http-status-codes';
import { Ok, Result } from 'neverthrow';
import { Service } from 'typedi';

export interface ICreateUserKeyServiceResult {
	aesSecretKey: string;
	hmacSecretKey: string;
}

export interface ICreateUserKeyService
	extends IServiceHandlerNoParamsAsync<ICreateUserKeyServiceResult> {}

@sealed
@Service()
export class CreateUserKeysService implements ICreateUserKeyService {
	public async handleAsync(): Promise<Result<ICreateUserKeyServiceResult, ResultError>> {
		try {
			const result: ICreateUserKeyServiceResult = {
				aesSecretKey: Guid.create().toString(),
				hmacSecretKey: Guid.create().toString(),
			};

			return new Ok(result);
		} catch (ex) {
			const error = ex as Error;
			return ResultExceptionFactory.error(StatusCodes.INTERNAL_SERVER_ERROR, error.message);
		}
	}
}
