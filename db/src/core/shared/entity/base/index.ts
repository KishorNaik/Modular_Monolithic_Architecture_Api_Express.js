import { IsNotEmpty, IsUUID } from 'class-validator';
import {
	Column,
	CreateDateColumn,
	Index,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
	VersionColumn,
} from 'typeorm';
import { StatusEnum } from '../../models/enums/status.enum';

export class BaseEntity {
	@PrimaryGeneratedColumn('increment', { type: 'bigint', unsigned: true })
	public id?: number;

	@Column('varchar', { length: 50 })
	@IsNotEmpty()
	@IsUUID()
	@Index({ unique: true })
	public identifier?: string;

	@Column('enum', { enum: StatusEnum, default: StatusEnum.INACTIVE })
	public status?: StatusEnum;

	@CreateDateColumn({
		type: 'timestamp',
		precision: 6,
		default: () => 'CURRENT_TIMESTAMP(6)',
	})
	public created_date?: Date;

	@UpdateDateColumn({
		type: 'timestamp',
		precision: 6,
		default: () => 'CURRENT_TIMESTAMP(6)',
		onUpdate: 'CURRENT_TIMESTAMP(6)',
	})
	public modified_date?: Date;

	@VersionColumn()
	public version?: number;
}
