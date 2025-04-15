import { sealed } from '@/shared/utils/decorators/sealed';
import { IServiceHandlerVoid } from '@/shared/utils/helpers/services';
import { Service } from 'typedi';
import { UserVerificationTokenEmailIntegrationEventRequestDto } from '../../../../contracts';
import { ResultError, ResultExceptionFactory } from '@/shared/utils/exceptions/results';
import { Ok, Result } from 'neverthrow';
import { StatusCodes } from 'http-status-codes';

export interface ISendUserEmailVerificationTokenService
	extends IServiceHandlerVoid<UserVerificationTokenEmailIntegrationEventRequestDto> {}

@sealed
@Service()
export class SendUserEmailVerificationTokenService
	implements ISendUserEmailVerificationTokenService
{
	public handle(
		params: UserVerificationTokenEmailIntegrationEventRequestDto
	): Result<undefined, ResultError> {
		try {
			// @Guard
			if (!params)
				return ResultExceptionFactory.error(StatusCodes.BAD_REQUEST, 'Invalid params');

			//Todo : Send Email

			return new Ok(undefined);
		} catch (ex) {
			const error = ex as Error;
			return ResultExceptionFactory.error(StatusCodes.INTERNAL_SERVER_ERROR, error.message);
		}
	}
}
