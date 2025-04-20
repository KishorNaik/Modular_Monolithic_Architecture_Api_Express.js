import { GetUsersByClientIdService } from '@/modules/users/shared/services/getUserByClientId';
import { DataResponseFactory } from '@/shared/models/response/data.Response';
import { ResultError, ResultExceptionFactory } from '@/shared/utils/exceptions/results';
import { compareHmac } from '@/shared/utils/helpers/hmac';
import { logConstruct, logger } from '@/shared/utils/helpers/loggers';
import express, { Request, Response, NextFunction } from 'express';
import { Ok, Result } from 'neverthrow';
import Container from 'typedi';

export async function authenticateHmac(req: Request, res: Response, next: NextFunction) {
	const payload = req.method === 'GET' || req.method === 'DELETE'
    ? req.originalUrl.trim()
    : JSON.stringify(req.body).replace(/\s+/g, '');
	const receivedSignature = req.headers['x-auth-signature'] as string;
	const clientId = req.headers['x-client-id'] as string;

	if (!clientId) {
    logger.error(
      logConstruct(
        `authenticateHmac`,
        `authenticateHmac`,
        `Forbidden - You do not have permission to access this resource: Client Id is required`
      )
    );
		const response = DataResponseFactory.Response<undefined>(
			false,
			403,
			undefined,
			'Forbidden - You do not have permission to access this resource: Client Id is required'
		);
		return res.status(403).json(response);
	}

	if (!receivedSignature) {
    logger.error(
      logConstruct(
        `authenticateHmac`,
        `authenticateHmac`,
        `Forbidden - You do not have permission to access this resource: receivedSignature is required`
      )
    );
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

    logger.error(
      logConstruct(
        `authenticateHmac`,
        `authenticateHmac`,
        `Forbidden - You do not have permission to access this resource: ${secretKeyResult.error.message}`
      )
    );

		const response = DataResponseFactory.Response<undefined>(
			false,
			403,
			undefined,
			`Forbidden - You do not have permission to access this resource: ${secretKeyResult.error.message}`
		);
		return res.status(response.StatusCode).json(response);
	}

	const SECRET_KEY = secretKeyResult.value;

	const compareHmacResult = compareHmac(payload, SECRET_KEY, receivedSignature);
	if (compareHmacResult.isErr()) {

    logger.error(
      logConstruct(
        `authenticateHmac`,
        `authenticateHmac`,
        `Forbidden - You do not have permission to access this resource: ${compareHmacResult.error.message}`
      )
    );

		const response = DataResponseFactory.Response<undefined>(
			false,
			403,
			undefined,
			compareHmacResult.error.message
		);
		return res.status(response.StatusCode).json(response);
	}

	next();
}

const getSecretKeyFromDatabaseAsync = async (
	clientId: string
): Promise<Result<string, ResultError>> => {
	// Get secret key from database by clientId

  const getUsersByClientIdService:GetUsersByClientIdService=Container.get(GetUsersByClientIdService);
  const getUsersByClientIdServiceResult= await getUsersByClientIdService.handleAsync({
    clientId: clientId,
  });
  if(getUsersByClientIdServiceResult.isErr())
    return ResultExceptionFactory.error(getUsersByClientIdServiceResult.error.status,getUsersByClientIdServiceResult.error.message);

  const secretKey:string = getUsersByClientIdServiceResult.value.keys.hmacSecretKey;
	return new Ok(secretKey);
};
