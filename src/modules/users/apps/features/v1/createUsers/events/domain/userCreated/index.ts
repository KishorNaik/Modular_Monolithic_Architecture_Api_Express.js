import { sealed } from '@/shared/utils/decorators/sealed';
import { logConstruct, logger } from '@/shared/utils/helpers/loggers';
import { StatusEnum } from '@kishornaik/mma_db';
import { NotificationData, NotificationHandler, notificationHandler } from 'mediatr-ts';

// @region Domain Event
@sealed
export class UserCreatedDomainEvent extends NotificationData {
	private readonly _identifier: string;
	private readonly _status: StatusEnum;

	public constructor(identifier: string, status: StatusEnum) {
		super();
		this._identifier = identifier;
		this._status = status;
	}

	public get identifier(): string {
		return this._identifier;
	}

	public get status(): StatusEnum {
		return this._status;
	}
}
// @endregion

// @region Domain Event Handler
@sealed
@notificationHandler(UserCreatedDomainEvent)
export class UserCreatedDomainEventHandler implements NotificationHandler<UserCreatedDomainEvent> {
	public async handle(notification: UserCreatedDomainEvent): Promise<void> {
		try {
		} catch (ex) {
			const error = ex as Error;
			logger.error(logConstruct(`UserCreatedDomainEventHandler`, `handle`, error.message));
			throw ex;
		}
	}
}
// @endregion
