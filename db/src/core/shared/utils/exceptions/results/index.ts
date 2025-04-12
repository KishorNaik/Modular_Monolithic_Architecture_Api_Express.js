import { Err, Result } from 'neverthrow';
import { StatusCodes } from 'http-status-codes';

export class ResultError {
	constructor(
		public statusCode: StatusCodes,
		public message: string
	) {}
}

export class ResultExceptionFactory {
	public static error<T>(statusCode: StatusCodes, message: string): Result<T, ResultError> {
		return new Err(new ResultError(statusCode, message));
	}

	public static errorInstance<T>(resultError: ResultError): Result<T, ResultError> {
		return new Err(resultError);
	}
}
