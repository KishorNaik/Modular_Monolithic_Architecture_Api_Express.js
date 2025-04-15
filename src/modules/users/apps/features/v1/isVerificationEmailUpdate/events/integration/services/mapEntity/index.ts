import { IUsers } from '@/modules/users/shared/types';
import { sealed } from '@/shared/utils/decorators/sealed';
import { ResultError, ResultExceptionFactory } from '@/shared/utils/exceptions/results';
import { IServiceHandlerAsync } from '@/shared/utils/helpers/services';
import { UserSettingsEntity } from '@kishornaik/mma_db';
import { BoolEnum } from '@kishornaik/mma_db/dist/core/shared/models/enums/bool.enum';
import { StatusCodes } from 'http-status-codes';
import { Ok, Result } from 'neverthrow';
import { Service } from 'typedi';

export interface IIsVerificationEmailSendIntegrationEventMapEntityService
	extends IServiceHandlerAsync<IUsers, UserSettingsEntity> {}

@sealed
@Service()
export class IsVerificationEmailSendIntegrationEventMapEntityService
	implements IIsVerificationEmailSendIntegrationEventMapEntityService
{
	public async handleAsync(params: IUsers): Promise<Result<UserSettingsEntity, ResultError>> {
		try {
			//@guard
			if (!params)
				return ResultExceptionFactory.error(StatusCodes.BAD_REQUEST, 'Invalid params');

			// Map Entity
			const userSettingsEntity = new UserSettingsEntity();
			userSettingsEntity.identifier = params.settings.identifier;
      userSettingsEntity.status=params.settings.status;
			userSettingsEntity.isVerificationEmailSent = BoolEnum.YES;

			return new Ok(userSettingsEntity);
		} catch (ex) {
			const error = ex as ResultError;
			return ResultExceptionFactory.error(StatusCodes.INTERNAL_SERVER_ERROR, error.message);
		}
	}
}
