import { Column, Entity, JoinColumn, OneToOne, ViewColumn } from 'typeorm';
import { BaseEntity } from '../../../../../shared/entity/base';
import { UserEntity } from '../tUsers';
import { IsBoolean } from 'class-validator';

@Entity({ name: `usersSettings` })
export class UserSettingsEntity extends BaseEntity {
	@Column(`bool`, { default: false })
	@IsBoolean()
	public isEmailVerified?: boolean;

	@ViewColumn({ name: 'user_id' })
	public user_id?: string;

	@OneToOne(() => UserEntity, (users) => users.userSetting, { cascade: true })
	@JoinColumn({ name: 'user_id', referencedColumnName: 'identifier' })
	public users?: UserEntity;
}
