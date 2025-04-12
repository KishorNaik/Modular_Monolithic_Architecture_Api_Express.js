import { NextFunction, Request, Response } from 'express';
import { logger } from '@/shared/utils/helpers/loggers';
import { DataResponse } from '@/shared/models/response/data.Response';
import { HttpException } from '@/shared/utils/exceptions/http';

export const ErrorMiddleware = (
	error: HttpException,
	req: Request,
	res: Response,
	next: NextFunction
) => {
	try {
		let status: number;
		let message: string;

		if ('StatusCode' in error && 'Message' in error) {
			const dataResponse: DataResponse<undefined> = error as DataResponse<undefined>;
			status = dataResponse.StatusCode || 500;
			message = dataResponse.Message || 'Something went wrong';
		} else {
			status = error.status || 500;
			message = error.message || 'Something went wrong';
		}

		logger.error(`[${req.method}] ${req.path} >> StatusCode:: ${status}, Message:: ${message}`);

		const errorResponse: DataResponse<undefined> = {
			Success: false,
			StatusCode: status,
			Data: undefined,
			Message: message,
		};

		res.status(status).json(errorResponse);
	} catch (error) {
		next(error);
	}
};
