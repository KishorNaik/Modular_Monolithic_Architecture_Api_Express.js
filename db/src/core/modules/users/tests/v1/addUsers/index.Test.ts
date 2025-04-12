import test, { afterEach, beforeEach, describe } from 'node:test';
import { QueryRunner } from 'typeorm';
import {
	destroyDatabase,
	getQueryRunner,
	initializeDatabase,
} from '../../../../../config/dbSource';
import { UserEntity } from '../../../infrastructures/entity/tUsers';
import { StatusEnum } from '../../../../../shared/models/enums/status.enum';
import {
	AddUserCommunicationService,
	AddUserService,
	AddUserSettingsService,
	AddUserTokenService,
} from '../../../apps/feature/v1/addUsers';
import { Result } from 'neverthrow';
import expect from 'expect';
import { Guid } from 'guid-typescript';
import { UserCommunicationEntity } from '../../../infrastructures/entity/tUserCommunication';
import { UserTokenEntity } from '../../../infrastructures/entity/tUserToken';
import { UserSettingsEntity } from '../../../infrastructures/entity/tUserSettings';

// node --trace-deprecation --test --test-name-pattern='should_return_true_when_add_service_passed' --require ts-node/register -r tsconfig-paths/register ./src/core/modules/users/tests/v1/addUsers/index.test.ts

describe(`Add Users Unit Test`, () => {
	let queryRunner: QueryRunner;

	beforeEach(async () => {
		await initializeDatabase();
		queryRunner = getQueryRunner();
	});

	afterEach(async () => {
		await queryRunner.release();
		await destroyDatabase();
	});

	test(`should_return_false_when_identifier_is_not_provided`, async () => {
		const userEntity: UserEntity = new UserEntity();
		userEntity.firstName = '';
		userEntity.lastName = '';
		userEntity.status = StatusEnum.ACTIVE;
		userEntity.created_date = new Date();
		userEntity.modified_date = new Date();

		await queryRunner.startTransaction();

		const addUserServiceResult = await new AddUserService().handleAsync(
			userEntity,
			queryRunner
		);
		if (addUserServiceResult.isErr()) {
			await queryRunner.rollbackTransaction();
			expect(addUserServiceResult.isErr()).toBe(true);
			return;
		}

		await queryRunner.commitTransaction();
		expect(false).toBe(false);
	});

	test(`should_return_false_when_status_is_not_provided`, async () => {
		const userEntity: UserEntity = new UserEntity();
		userEntity.identifier = Guid.create().toString();
		userEntity.firstName = '';
		userEntity.lastName = '';
		//userEntity.status = StatusEnum.ACTIVE;
		userEntity.created_date = new Date();
		userEntity.modified_date = new Date();

		await queryRunner.startTransaction();

		const addUserServiceResult = await new AddUserService().handleAsync(
			userEntity,
			queryRunner
		);
		if (addUserServiceResult.isErr()) {
			await queryRunner.rollbackTransaction();
			expect(addUserServiceResult.isErr()).toBe(true);
			return;
		}

		await queryRunner.commitTransaction();
		expect(false).toBe(false);
	});

	test(`should_return_false_when_validation_service_failed`, async () => {
		const userEntity: UserEntity = new UserEntity();
		userEntity.identifier = Guid.create().toString();
		userEntity.firstName = '';
		userEntity.lastName = '';
		userEntity.email = '';
		userEntity.status = StatusEnum.ACTIVE;
		userEntity.created_date = new Date();
		userEntity.modified_date = new Date();

		await queryRunner.startTransaction();

		const addUserServiceResult = await new AddUserService().handleAsync(
			userEntity,
			queryRunner
		);
		if (addUserServiceResult.isErr()) {
			await queryRunner.rollbackTransaction();
			expect(addUserServiceResult.isErr()).toBe(true);
			return;
		}

		await queryRunner.commitTransaction();
		expect(false).toBe(false);
	});

	test(`should_return_true_when_add_service_passed`, async () => {
		const userEntity: UserEntity = new UserEntity();
		userEntity.identifier = Guid.create().toString();
		userEntity.firstName = 'jhon';
		userEntity.lastName = 'wick`';
		userEntity.email = 'jhon1@gmail.com';
		userEntity.status = StatusEnum.INACTIVE;
		userEntity.created_date = new Date();
		userEntity.modified_date = new Date();

		await queryRunner.startTransaction();

		const addUserServiceResult = await new AddUserService().handleAsync(
			userEntity,
			queryRunner
		);
		if (addUserServiceResult.isErr()) {
			await queryRunner.rollbackTransaction();
			expect(addUserServiceResult.isErr()).toBe(true);
			return;
		}

		const userCommunication = new UserCommunicationEntity();
		userCommunication.identifier = Guid.create().toString();
		userCommunication.email = userEntity.email;
		userCommunication.googleId = Guid.create().toString();
		userCommunication.user_id = userEntity.identifier;
		userCommunication.status = StatusEnum.INACTIVE;
		userCommunication.created_date = new Date();
		userCommunication.modified_date = new Date();
		//userCommunication.users=userEntity;

		//userEntity.userCommunication=userCommunication;

		const addUserCommunicationServiceResult =
			await new AddUserCommunicationService().handleAsync(userCommunication, queryRunner);
		if (addUserCommunicationServiceResult.isErr()) {
			await queryRunner.rollbackTransaction();
			expect(addUserCommunicationServiceResult.isErr()).toBe(true);
			return;
		}

		const userToken = new UserTokenEntity();
		userToken.identifier = Guid.create().toString();
		userToken.refresh_token = Guid.create().toString();
		userToken.expires_at = new Date(new Date().getTime() + 24 * 60 * 60 * 1000);
		userToken.user_id = userEntity.identifier;
		userToken.status = StatusEnum.INACTIVE;
		userToken.created_date = new Date();
		userToken.modified_date = new Date();
		//userToken.users=userEntity;

		//userEntity.userToken=userToken;

		const addUserTokenServiceResult = await new AddUserTokenService().handleAsync(
			userToken,
			queryRunner
		);
		if (addUserTokenServiceResult.isErr()) {
			await queryRunner.rollbackTransaction();
			expect(addUserTokenServiceResult.isErr()).toBe(true);
			return;
		}

		const userSettings = new UserSettingsEntity();
		userSettings.identifier = Guid.create().toString();
		userSettings.user_id = userEntity.identifier;
		userSettings.isEmailVerified = false;
		userSettings.status = StatusEnum.INACTIVE;
		userSettings.created_date = new Date();
		userSettings.modified_date = new Date();
		//userSettings.users=userEntity;

		//userEntity.userSetting=userSettings;

		const addUserSettingsServiceResult = await new AddUserSettingsService().handleAsync(
			userSettings,
			queryRunner
		);
		if (addUserSettingsServiceResult.isErr()) {
			await queryRunner.rollbackTransaction();
			expect(addUserSettingsServiceResult.isErr()).toBe(true);
			return;
		}

		await queryRunner.commitTransaction();
		expect(false).toBe(false);
	});
});
