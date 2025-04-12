// Generate Hashed Message Authentication Code (HMAC)
import { createHmac } from 'crypto';
import { Ok, Result } from 'neverthrow';
import { ResultError, ResultExceptionFactory } from '../../exceptions/results';
import { StatusCodes } from 'http-status-codes';

export const generateHmac = (payload: string, secret: string): Result<string, ResultError> => {
	try {
		if (!payload)
			return ResultExceptionFactory.error(StatusCodes.BAD_REQUEST, 'Payload is required');

		if (!secret)
			return ResultExceptionFactory.error(StatusCodes.BAD_REQUEST, 'Secret is required');

		const hmac = createHmac('sha256', secret);
		hmac.update(payload);
		const signature: string = hmac.digest('hex');

		if (!signature)
			return ResultExceptionFactory.error(
				StatusCodes.INTERNAL_SERVER_ERROR,
				'Failed to generate HMAC'
			);
		return new Ok(signature);
	} catch (ex) {
		const error = ex as Error;
		return ResultExceptionFactory.error(
			StatusCodes.INTERNAL_SERVER_ERROR,
			`An error occurred while generating HMAC: ${error.message}`
		);
	}
};

// Compare HMAC Signature
export const compareHmac = (
	payload: string,
	secret: string,
	receivedSignature: string
): Result<boolean, ResultError> => {
	try {
		if (!payload)
			return ResultExceptionFactory.error(StatusCodes.BAD_REQUEST, 'Payload is required');

		if (!secret)
			return ResultExceptionFactory.error(StatusCodes.BAD_REQUEST, 'Secret is required');

		if (!receivedSignature)
			return ResultExceptionFactory.error(StatusCodes.BAD_REQUEST, 'Signature is required');

		const createHmacResult = generateHmac(payload, secret);
		if (createHmacResult.isErr())
			return ResultExceptionFactory.error(
				createHmacResult.error.status,
				createHmacResult.error.message
			);

		const signature = createHmacResult.value;
		if (signature !== receivedSignature)
			return ResultExceptionFactory.error(StatusCodes.UNAUTHORIZED, 'Invalid signature');

		return new Ok(true);
	} catch (ex) {
		const error = ex as Error;
		return ResultExceptionFactory.error(
			StatusCodes.INTERNAL_SERVER_ERROR,
			`An error occurred while comparing HMAC: ${error.message}`
		);
	}
};
