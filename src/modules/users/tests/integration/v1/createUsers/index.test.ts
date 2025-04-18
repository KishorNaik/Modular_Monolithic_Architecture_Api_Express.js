import { App } from '@/app';
import { modulesFederation } from '@/modules';
import { AesRequestDto } from '@/shared/models/request/aes.RequestDto';
import { ValidateEnv } from '@/shared/utils/validations/env';
import { destroyDatabase, initializeDatabase } from '@kishornaik/mma_db';
import { afterEach, beforeEach, describe, it } from 'node:test';
import expect from 'expect';
import request from 'supertest';
import { CreateUserRequestDto } from '@/modules/users/apps/features/v1/createUsers/contracts';
import { AES } from '@/shared/utils/helpers/aes';
import { ENCRYPTION_KEY } from '@/config';

process.env.NODE_ENV = 'development';
process.env.ENCRYPTION_KEY = 'RWw5ejc0Wzjq0i0T2ZTZhcYu44fQI5M6';
ValidateEnv();

const appInstance = new App([...modulesFederation]);
const app = appInstance.getServer();

describe(`Create User Integration Test`, () => {
	beforeEach(async () => {
		//await initializeDatabase();
	});

	afterEach(async () => {
		//await destroyDatabase();
	});

	// node --trace-deprecation --test --test-name-pattern='should_return_false_aes_body_validation_failed' --require ts-node/register -r tsconfig-paths/register ./src/modules/users/tests/integration/v1/createUsers/index.test.ts
	it(`should_return_false_aes_body_validation_failed`, async () => {
		const aesRequestDto: AesRequestDto = new AesRequestDto();
		aesRequestDto.body = '';

		const response = await request(app).post('/api/v1/users').send(aesRequestDto);
		expect(response.status).toBe(400);
		setTimeout(() => {
			process.exit(0);
		}, 2000);
	});

	// node --trace-deprecation --test --test-name-pattern='should_return_false_request_body_validation_failed' --require ts-node/register -r tsconfig-paths/register ./src/modules/users/tests/integration/v1/createUsers/index.test.ts
	it(`should_return_false_request_body_validation_failed`, async () => {
		const createUserRequestDto: CreateUserRequestDto = new CreateUserRequestDto();
		createUserRequestDto.firstName = '';
		createUserRequestDto.lastName = '';
		createUserRequestDto.email = '';
		createUserRequestDto.mobileNo = '';
		createUserRequestDto.password = '';

		const aes = new AES(ENCRYPTION_KEY);
		const encryptRequestBody = await aes.encryptAsync(JSON.stringify(createUserRequestDto));

		const aesRequestDto: AesRequestDto = new AesRequestDto();
		aesRequestDto.body = encryptRequestBody;

		const response = await request(app).post('/api/v1/users').send(aesRequestDto);
		expect(response.status).toBe(400);
		setTimeout(() => {
			process.exit(0);
		}, 2000);
	});

	// node --trace-deprecation --test --test-name-pattern='should_return_true_if_all_services_passed' --require ts-node/register -r tsconfig-paths/register ./src/modules/users/tests/integration/v1/createUsers/index.test.ts
	it(`should_return_true_if_all_services_passed`, async () => {
		const createUserRequestDto: CreateUserRequestDto = new CreateUserRequestDto();
		createUserRequestDto.firstName = 'eshann';
		createUserRequestDto.lastName = 'naik';
		createUserRequestDto.email = 'eshaan.naik.dev60@gmail.com';
		createUserRequestDto.mobileNo = '9167791160';
		createUserRequestDto.password = 'Shree@123';

		const aes = new AES(ENCRYPTION_KEY);
		const encryptRequestBody = await aes.encryptAsync(JSON.stringify(createUserRequestDto));

		const aesRequestDto: AesRequestDto = new AesRequestDto();
		aesRequestDto.body = encryptRequestBody;

		await initializeDatabase();

		const response = await request(app).post('/api/v1/users').send(aesRequestDto);
		expect(response.status).toBe(201);
		// setTimeout(() => {
		// 	process.exit(0);
		// }, 50000);
	});
});
