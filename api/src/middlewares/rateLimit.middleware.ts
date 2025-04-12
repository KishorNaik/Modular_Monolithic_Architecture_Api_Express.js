import { NextFunction, Request, Response } from 'express';
import { DataResponseFactory } from '@/shared/models/response/data.Response';
import rateLimit from 'express-rate-limit';
import { RATE_LIMITER } from '@/config';
import { StatusCodes } from 'http-status-codes';

export const rateLimitMiddleware = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: parseInt(RATE_LIMITER),
	handler: (req: Request, res: Response) => {
		const response = DataResponseFactory.Response(
			false,
			StatusCodes.TOO_MANY_REQUESTS,
			null!,
			'Too many requests from this IP, please try again after 15 minutes'
		);

		res.status(StatusCodes.TOO_MANY_REQUESTS).json(response);
	},
	standardHeaders: true,
	legacyHeaders: false,
});
