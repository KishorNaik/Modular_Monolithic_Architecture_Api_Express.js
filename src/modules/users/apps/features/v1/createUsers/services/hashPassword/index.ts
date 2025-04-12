import {
	HashPasswordService,
	IHashPasswordResult,
} from '@/shared/services/users/user.HashPassword.Service';
import { sealed } from '@/shared/utils/decorators/sealed';
import { ResultError, ResultExceptionFactory } from '@/shared/utils/exceptions/results';
import { IServiceHandlerAsync } from '@/shared/utils/helpers/services';
import { StatusCodes } from 'http-status-codes';
import { Ok, Result } from 'neverthrow';
import Container, { Service } from 'typedi';

export interface ICreateUserHashPasswordParameters {
	password: string;
}

export interface ICreateUserHashPasswordService
	extends IServiceHandlerAsync<ICreateUserHashPasswordParameters, IHashPasswordResult> {}

@sealed
@Service()
export class CreateUserHashPasswordService implements ICreateUserHashPasswordService {
	private readonly _hashPasswordService: HashPasswordService;

	public constructor() {
		this._hashPasswordService = Container.get(HashPasswordService);
	}

	public async handleAsync(
		params: ICreateUserHashPasswordParameters
	): Promise<Result<IHashPasswordResult, ResultError>> {
		try {
			// Guard
			if (!params)
				return ResultExceptionFactory.error(StatusCodes.BAD_REQUEST, 'invalid params');

			if (!params.password)
				return ResultExceptionFactory.error(StatusCodes.BAD_REQUEST, 'invalid Password');

			const hashResult = await this._hashPasswordService.hashPasswordAsync(params.password);
			if (hashResult.isErr())
				return ResultExceptionFactory.error(
					hashResult.error.status,
					hashResult.error.message
				);

			return new Ok(hashResult.value);
		} catch (ex) {
			const error = ex as Error;
			return ResultExceptionFactory.error(StatusCodes.INTERNAL_SERVER_ERROR, error.message);
		}
	}
}
