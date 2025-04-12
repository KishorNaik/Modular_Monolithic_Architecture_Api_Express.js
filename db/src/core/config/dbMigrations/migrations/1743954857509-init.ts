import { MigrationInterface, QueryRunner } from 'typeorm';

export class Init1743954857509 implements MigrationInterface {
	name = 'Init1743954857509';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "usersTokens" ADD CONSTRAINT "UQ_f3b74b5b713fe727de733995961" UNIQUE ("refresh_token")`
		);
		await queryRunner.query(
			`ALTER TABLE "usersTokens" ADD CONSTRAINT "UQ_d72cf715178ce07916b88b50c08" UNIQUE ("aesSecretKey")`
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_97672ac88f789774dd47f7c8be" ON "users" ("email") `
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_b99ca9c360cc1c3c62143dae84" ON "usersCommunication" ("email") `
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP INDEX "public"."IDX_b99ca9c360cc1c3c62143dae84"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_97672ac88f789774dd47f7c8be"`);
		await queryRunner.query(
			`ALTER TABLE "usersTokens" DROP CONSTRAINT "UQ_d72cf715178ce07916b88b50c08"`
		);
		await queryRunner.query(
			`ALTER TABLE "usersTokens" DROP CONSTRAINT "UQ_f3b74b5b713fe727de733995961"`
		);
	}
}
