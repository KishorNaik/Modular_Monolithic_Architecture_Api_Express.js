import { Err, Result } from 'neverthrow';
import { HttpException } from '../http';
import { StatusCodes } from 'http-status-codes';

export class ResultError extends HttpException {
	public constructor(statusCode: StatusCodes, message: string, fallback?: object) {
		super(statusCode, message);
		this.fallbackObject = fallback;
	}

	public fallbackObject?: object;
}

export class ResultExceptionFactory {
	public static error<T>(
		statusCode: StatusCodes,
		message: string,
		fallbackObject?: object
	): Result<T, ResultError> {
		return new Err(new ResultError(statusCode, message, fallbackObject));
	}

	public static errorInstance<T>(resultError: ResultError): Result<T, ResultError> {
		return new Err(resultError);
	}
}
