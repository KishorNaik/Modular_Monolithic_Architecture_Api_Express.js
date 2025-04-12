import { Column, Entity, Index, JoinColumn, OneToOne, ViewColumn } from 'typeorm';
import { BaseEntity } from '../../../../../shared/entity/base';
import { UserEntity } from '../tUsers';
import { IsEmail, IsNotEmpty } from 'class-validator';

@Entity({ name: `usersCommunication` })
export class UserCommunicationEntity extends BaseEntity {
	@Column(`varchar`, { length: 100, nullable: false })
	@Index({ unique: true })
	@IsNotEmpty()
	@IsEmail()
	public email?: string;

	@Column(`varchar`, { length: 200, nullable: false })
	@IsNotEmpty()
	public googleId?: string;

	@ViewColumn({ name: 'user_id' })
	public user_id?: string;

	@OneToOne(() => UserEntity, (users) => users.userCommunication, { cascade: true })
	@JoinColumn({ name: 'user_id', referencedColumnName: 'identifier' })
	public users?: UserEntity;
}
