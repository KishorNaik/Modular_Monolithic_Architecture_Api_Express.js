import { UserVerificationTokenEmailIntegrationEventRequestDto, UserVerificationTokenEmailIntegrationEventService } from '@/modules/notiifcations/apps/features/v1/userVerificationTokenEmail';
import medaitR from '@/shared/medaitR';
import { sealed } from '@/shared/utils/decorators/sealed';
import { logConstruct, logger } from '@/shared/utils/helpers/loggers';
import { StatusEnum } from '@kishornaik/mma_db';
import { NotificationData, NotificationHandler, notificationHandler } from 'mediatr-ts';

// @region Domain Event
@sealed
export class UserCreatedDomainEventService extends NotificationData {
	private readonly _identifier: string;
  private readonly _email:string;
  private readonly _fullName:string;

	public constructor(identifier: string, email:string, fullName:string) {
		super();
		this._identifier = identifier;
    this._email = email;
    this._fullName = fullName;
	}

	public get identifier(): string {
		return this._identifier;
	}

  public get email(): string {
    return this._email;
  }

  public get fullName(): string {
    return this._fullName;
  }
}
// @endregion

// @region Domain Event Handler
@sealed
@notificationHandler(UserCreatedDomainEventService)
export class UserCreatedDomainEventServiceHandler implements NotificationHandler<UserCreatedDomainEventService> {
	public async handle(notification: UserCreatedDomainEventService): Promise<void> {
		try {

      // @Guard
      if (!notification)
        throw new Error('Invalid notification');

      // User Verification Token Email Send Integration Event
      const userVerificationTokenEmailIntegrationEventRequestDto:UserVerificationTokenEmailIntegrationEventRequestDto=new UserVerificationTokenEmailIntegrationEventRequestDto();
      userVerificationTokenEmailIntegrationEventRequestDto.email=notification.email;
      userVerificationTokenEmailIntegrationEventRequestDto.fullName=notification.fullName;
      userVerificationTokenEmailIntegrationEventRequestDto.userId=notification.identifier;
      const userVerificationTokenEmailIntegrationEventService:UserVerificationTokenEmailIntegrationEventService=new UserVerificationTokenEmailIntegrationEventService(userVerificationTokenEmailIntegrationEventRequestDto);
      await medaitR.publish(userVerificationTokenEmailIntegrationEventService);

		} catch (ex) {
			const error = ex as Error;
			logger.error(logConstruct(`UserCreatedDomainEventHandler`, `handle`, error.message));
			throw ex;
		}
	}
}
// @endregion
