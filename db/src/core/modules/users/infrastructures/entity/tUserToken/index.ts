import { Column, Entity, JoinColumn, OneToOne, ViewColumn } from 'typeorm';
import { BaseEntity } from '../../../../../shared/entity/base';
import { UserEntity } from '../tUsers';
import { IsNotEmpty, IsEmail } from 'class-validator';

@Entity({ name: `usersTokens` })
export class UserTokenEntity extends BaseEntity {
	@Column(`text`, { nullable: true, unique: true })
	@IsNotEmpty()
	public refresh_token?: string;

	@Column(`date`)
	public expires_at?: Date;

	@ViewColumn({ name: 'user_id' })
	public user_id?: string;

	@OneToOne(() => UserEntity, (users) => users.userToken, { cascade: true })
	@JoinColumn({ name: 'user_id', referencedColumnName: 'identifier' })
	public users?: UserEntity;

	@Column('text', { nullable: true, unique: true })
	public aesSecretKey?: string;
}
