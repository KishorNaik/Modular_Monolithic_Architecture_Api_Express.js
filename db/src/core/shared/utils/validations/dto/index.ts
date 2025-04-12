import { validateOrReject, ValidationError } from 'class-validator';
import { StatusCodes } from 'http-status-codes';
import { Err, Ok, Result } from 'neverthrow';
import { plainToInstance } from 'class-transformer';
import { Service } from 'typedi';
import { ResultError } from '../../exceptions/results';
import { IServiceHandlerAsync } from '../../helpers/services';

async function validateOrRejectAsync<TDto>(
	input: object,
	dtoClass: new () => TDto
): Promise<Result<unknown, ResultError>> {
	try {
		// Convert plain object to class instance
		const instance = plainToInstance(dtoClass, input);

		// Validate the instance
		await validateOrReject(instance as object, { skipMissingProperties: true });

		return new Ok('ok');
	} catch (errors) {
		const errorsArray = errors as ValidationError[];
		const message = errorsArray
			.map((error: ValidationError) => Object.values(error.constraints!).join(', '))
			.join(', ');
		return new Err(new ResultError(StatusCodes.BAD_REQUEST, message));
	}
}

export interface IDtoValidationParameters<Tdto extends object> {
	dto: Tdto;
	dtoClass: new () => Tdto;
}

export interface IDtoValidation<Tdto extends object>
	extends IServiceHandlerAsync<IDtoValidationParameters<Tdto>, unknown> {}

@Service()
export class DtoValidation<Tdto extends object> implements IDtoValidation<Tdto> {
	public async handleAsync(
		params: IDtoValidationParameters<Tdto>
	): Promise<Result<unknown, ResultError>> {
		try {
			if (!params)
				return new Err(new ResultError(StatusCodes.BAD_REQUEST, 'parameter is null'));

			if (!params.dto)
				return new Err(new ResultError(StatusCodes.BAD_REQUEST, 'dto is null'));

			if (!params.dtoClass)
				return new Err(new ResultError(StatusCodes.BAD_REQUEST, 'dtoClass is null'));

			return await validateOrRejectAsync(params.dto, params.dtoClass);
		} catch (ex) {
			const error = ex as Error;
			return new Err(new ResultError(StatusCodes.INTERNAL_SERVER_ERROR, error.message));
		}
	}
}
