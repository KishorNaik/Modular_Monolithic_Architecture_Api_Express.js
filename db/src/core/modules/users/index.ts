import { UserCommunicationEntity } from './infrastructures/entity/tUserCommunication';
import { UserEntity } from './infrastructures/entity/tUsers';
import { UserSettingsEntity } from './infrastructures/entity/tUserSettings';
import { UserTokenEntity } from './infrastructures/entity/tUserToken';

// Entity Db Datasource Register
export const userModuleDbDataSourceEntity: Function[] = [
	UserEntity,
	UserTokenEntity,
	UserSettingsEntity,
	UserCommunicationEntity,
];

// Export Entity
export { UserEntity, UserTokenEntity, UserSettingsEntity, UserCommunicationEntity };
