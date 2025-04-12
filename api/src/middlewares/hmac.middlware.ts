import { DataResponseFactory } from '@/shared/models/response/data.Response';
import { ResultError } from '@/shared/utils/exceptions/results';
import { compareHmac } from '@/shared/utils/helpers/hmac';
import express, { Request, Response, NextFunction } from 'express';
import { Ok, Result } from 'neverthrow';

export async function authenticateHmac(req: Request, res: Response, next: NextFunction) {
	const payload = JSON.stringify(req.body);
	const receivedSignature = req.headers['x-auth-signature'] as string;
	const clientId = req.headers['x-client-id'] as string;

	if (!clientId) {
		const response = DataResponseFactory.Response<undefined>(
			false,
			403,
			undefined,
			'Forbidden - You do not have permission to access this resource: Client Id is required'
		);
		return res.status(403).json(response);
	}

	if (!receivedSignature) {
		const response = DataResponseFactory.Response<undefined>(
			false,
			403,
			undefined,
			'Forbidden - You do not have permission to access this resource: Signature is required'
		);
		return res.status(403).json(response);
	}

	const secretKeyResult = await getSecretKeyFromDatabaseAsync(clientId);
	if (secretKeyResult.isErr()) {
		const response = DataResponseFactory.Response<undefined>(
			false,
			secretKeyResult.error.status,
			undefined,
			`Forbidden - You do not have permission to access this resource: ${secretKeyResult.error.message}`
		);
		return res.status(secretKeyResult.error.status).json(response);
	}

	const SECRET_KEY = secretKeyResult.value;

	const compareHmacResult = compareHmac(payload, SECRET_KEY, receivedSignature);
	if (compareHmacResult.isErr()) {
		const response = DataResponseFactory.Response<undefined>(
			false,
			compareHmacResult.error.status,
			undefined,
			compareHmacResult.error.message
		);
		return res.status(compareHmacResult.error.status).json(response);
	}

	next();
}

const getSecretKeyFromDatabaseAsync = async (
	clientId: string
): Promise<Result<string, ResultError>> => {
	// Get secret key from database by clientId

	return Promise.resolve(new Ok('secret_key'));
};
