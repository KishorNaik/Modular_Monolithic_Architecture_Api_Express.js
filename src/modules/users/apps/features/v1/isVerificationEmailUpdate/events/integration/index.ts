import { NotificationData, NotificationHandler, notificationHandler } from 'mediatr-ts';
import { IsVerificationEmailSendIntegrationEventRequestDto } from '../../contracts';
import { sealed } from '@/shared/utils/decorators/sealed';
import { IsVerificationEmailSendIntegrationEventValidationService } from './services/validations';
import Container from 'typedi';
import { getQueryRunner, StatusEnum } from '@kishornaik/mma_db';
import {
	IIIsVerificationEmailSendUpdateDbService,
	IsVerificationEmailSendUpdateDbService,
} from './services/db';
import { UserSharedCacheService } from '@/modules/users/shared/cache';
import { dbDataSource, initializeDatabase } from '@kishornaik/mma_db/dist/core/config/dbSource';

// @region Integration Event
export class IsVerificationEmailSendIntegrationEventService extends NotificationData {
	private readonly _request: IsVerificationEmailSendIntegrationEventRequestDto;

	public constructor(request: IsVerificationEmailSendIntegrationEventRequestDto) {
		super();
		this._request = request;
	}

	public get request(): IsVerificationEmailSendIntegrationEventRequestDto {
		return this._request;
	}
}
// @endregion

// @region Integration Event Handler
@sealed
@notificationHandler(IsVerificationEmailSendIntegrationEventService)
export class IsVerificationEmailSendIntegrationEventServiceHandler
	implements NotificationHandler<IsVerificationEmailSendIntegrationEventService>
{
	private readonly _isVerificationEmailSendIntegrationEventValidationService: IsVerificationEmailSendIntegrationEventValidationService;
	private readonly _isVerificationEmailSendUpdateDbService: IsVerificationEmailSendUpdateDbService;
	private readonly _userSharedCacheService: UserSharedCacheService;

	public constructor() {
		this._isVerificationEmailSendIntegrationEventValidationService = Container.get(
			IsVerificationEmailSendIntegrationEventValidationService
		);
		this._isVerificationEmailSendUpdateDbService = Container.get(
			IsVerificationEmailSendUpdateDbService
		);
		this._userSharedCacheService = Container.get(UserSharedCacheService);
	}

	public async handle(
		notification: IsVerificationEmailSendIntegrationEventService
	): Promise<void> {
		const queryRunner = getQueryRunner();
    await queryRunner.connect();
		try {
			// @guard
			if (!notification) throw new Error('Invalid notification');

			if (!notification.request) throw new Error(`Invalid notification request`);

			const request: IsVerificationEmailSendIntegrationEventRequestDto = notification.request;

			// Validation
			const isVerificationEmailSendIntegrationEventValidationServiceResult =
				await this._isVerificationEmailSendIntegrationEventValidationService.handleAsync({
					dto: request,
					dtoClass: IsVerificationEmailSendIntegrationEventRequestDto,
				});
			if (isVerificationEmailSendIntegrationEventValidationServiceResult.isErr())
				throw new Error(
					isVerificationEmailSendIntegrationEventValidationServiceResult.error.message
				);

			// Db Service
			await queryRunner.startTransaction("SERIALIZABLE");

			const isVerificationEmailSendUpdateDbServiceResult =
				await this._isVerificationEmailSendUpdateDbService.handleAsync({
					request: request,
					queryRunner: queryRunner,
				});
			if (isVerificationEmailSendUpdateDbServiceResult.isErr()) {
				await queryRunner.rollbackTransaction();
				throw new Error(isVerificationEmailSendUpdateDbServiceResult.error.message);
			}

			// Cache Update
			const userSharedCacheServiceResult = await this._userSharedCacheService.handleAsync({
				identifier: request.identifier,
				status: StatusEnum.INACTIVE,
				queryRunner: queryRunner,
			});
			if (userSharedCacheServiceResult.isErr()) {
				await queryRunner.rollbackTransaction();
				throw new Error(userSharedCacheServiceResult.error.message);
			}

			await queryRunner.commitTransaction();
		} catch (ex) {
			const error = ex as Error;
			if (queryRunner.isTransactionActive) {
				await queryRunner.rollbackTransaction();
			}
			throw error;
		} finally {
			await queryRunner.release();
		}
	}
}

// @endregion
