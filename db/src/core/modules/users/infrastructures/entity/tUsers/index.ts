import { Column, Entity, Index, OneToOne } from 'typeorm';
import { BaseEntity } from '../../../../../shared/entity/base';
import { UserCommunicationEntity } from '../tUserCommunication';
import { UserTokenEntity } from '../tUserToken';
import { UserSettingsEntity } from '../tUserSettings';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { IsSafeString } from '../../../../../shared/utils/validations/decorators/isSafeString';

@Entity({ name: `users` })
export class UserEntity extends BaseEntity {
	@Column(`varchar`, { length: 100, nullable: false })
	@IsNotEmpty()
	@IsString()
	@IsSafeString()
	public firstName?: string;

	@Column(`varchar`, { length: 100, nullable: false })
	@IsNotEmpty()
	@IsString()
	@IsSafeString()
	public lastName?: string;

	@Column(`varchar`, { length: 100, nullable: false })
	@Index({ unique: true })
	@IsNotEmpty()
	@IsEmail()
	@IsSafeString()
	public email?: string;

	@OneToOne(() => UserCommunicationEntity, (userCommunication) => userCommunication.users)
	public userCommunication?: UserCommunicationEntity;

	@OneToOne(() => UserTokenEntity, (userTokenEntity) => userTokenEntity.users)
	public userToken?: UserTokenEntity;

	@OneToOne(() => UserSettingsEntity, (userSettings) => userSettings.users)
	public userSetting?: UserSettingsEntity;
}
