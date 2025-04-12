import Container, { Service } from 'typedi';
import { AddService } from '../../../../../../shared/services/db/add';
import { UserEntity } from '../../../../infrastructures/entity/tUsers';
import { UserCommunicationEntity } from '../../../../infrastructures/entity/tUserCommunication';
import { UserTokenEntity } from '../../../../infrastructures/entity/tUserToken';
import { UserSettingsEntity } from '../../../../infrastructures/entity/tUserSettings';

Container.set<AddService<UserEntity>>(
	AddService<UserEntity>,
	new AddService<UserEntity>(UserEntity)
);
Container.set<AddService<UserCommunicationEntity>>(
	AddService<UserCommunicationEntity>,
	new AddService<UserCommunicationEntity>(UserCommunicationEntity)
);
Container.set<AddService<UserTokenEntity>>(
	AddService<UserTokenEntity>,
	new AddService<UserTokenEntity>(UserTokenEntity)
);
Container.set<AddService<UserSettingsEntity>>(
	AddService<UserSettingsEntity>,
	new AddService<UserSettingsEntity>(UserSettingsEntity)
);

@Service()
export class AddUserService extends AddService<UserEntity> {
	public constructor() {
		super(UserEntity);
	}
}

@Service()
export class AddUserCommunicationService extends AddService<UserCommunicationEntity> {
	public constructor() {
		super(UserCommunicationEntity);
	}
}

@Service()
export class AddUserTokenService extends AddService<UserTokenEntity> {
	public constructor() {
		super(UserTokenEntity);
	}
}

@Service()
export class AddUserSettingsService extends AddService<UserSettingsEntity> {
	public constructor() {
		super(UserSettingsEntity);
	}
}
