import { App } from '@/app';
import { modulesFederation } from '@/modules';
import { AesRequestDto } from '@/shared/models/request/aes.RequestDto';
import { ValidateEnv } from '@/shared/utils/validations/env';
import { destroyDatabase, initializeDatabase } from '@kishornaik/mma_db';
import { afterEach, beforeEach, describe, it } from 'node:test';
import expect from 'expect';
import request from 'supertest';
import { AES } from '@/shared/utils/helpers/aes';
import { ENCRYPTION_KEY } from '@/config';
import { UserSignInRequestDto } from '@/modules/users/apps/features/v1/signIn';

process.env.NODE_ENV = 'development';
process.env.ENCRYPTION_KEY = 'RWw5ejc0Wzjq0i0T2ZTZhcYu44fQI5M6';
ValidateEnv();

const appInstance = new App([...modulesFederation]);
const app = appInstance.getServer();

describe(`Sign In Integration Test`, () => {
	beforeEach(async () => {
		await initializeDatabase();
	});

	afterEach(async () => {
		await destroyDatabase();
	});

	// node --trace-deprecation --test --test-name-pattern='should_return_false_aes_body_validation_failed' --require ts-node/register -r tsconfig-paths/register ./src/modules/users/tests/integration/v1/signIn/index.test.ts
	it(`should_return_false_aes_body_validation_failed`, async () => {
		const aesRequestDto: AesRequestDto = new AesRequestDto();
		aesRequestDto.body = '';

		const response = await request(app).post('/api/v1/users/sign-in').send(aesRequestDto);
		expect(response.status).toBe(400);
		setTimeout(() => {
			process.exit(0);
		}, 2000);
	});

	// node --trace-deprecation --test --test-name-pattern='should_return_false_request_body_validation_failed' --require ts-node/register -r tsconfig-paths/register ./src/modules/users/tests/integration/v1/signIn/index.test.ts
	it(`should_return_false_request_body_validation_failed`, async () => {
		const userSignInRequestDto: UserSignInRequestDto = new UserSignInRequestDto();
		userSignInRequestDto.userName = '';
		userSignInRequestDto.password = '';

		const aes = new AES(ENCRYPTION_KEY);
		const encryptRequestBody = await aes.encryptAsync(JSON.stringify(userSignInRequestDto));

		const aesRequestDto: AesRequestDto = new AesRequestDto();
		aesRequestDto.body = encryptRequestBody;

		const response = await request(app).post('/api/v1/users/sign-in').send(aesRequestDto);
		expect(response.status).toBe(400);
		// setTimeout(() => {
		// 	process.exit(0);
		// }, 2000);
	});

	// node --trace-deprecation --test --test-name-pattern='should_return_false_if_username_not_found' --require ts-node/register -r tsconfig-paths/register ./src/modules/users/tests/integration/v1/signIn/index.test.ts
	it(`should_return_false_if_username_not_found`, async () => {
		const userSignInRequestDto: UserSignInRequestDto = new UserSignInRequestDto();
		userSignInRequestDto.userName = 'eshaan.naik.dev63@gmail.com';
		userSignInRequestDto.password = 'Shree@123';

		const aes = new AES(ENCRYPTION_KEY);
		const encryptRequestBody = await aes.encryptAsync(JSON.stringify(userSignInRequestDto));

		const aesRequestDto: AesRequestDto = new AesRequestDto();
		aesRequestDto.body = encryptRequestBody;

		const response = await request(app).post('/api/v1/users/sign-in').send(aesRequestDto);
		expect(response.status).toBe(401);
		// setTimeout(() => {
		// 	process.exit(0);
		// }, 2000);
	});

	// node --trace-deprecation --test --test-name-pattern='should_return_false_if_username_and_password_does_not_match' --require ts-node/register -r tsconfig-paths/register ./src/modules/users/tests/integration/v1/signIn/index.test.ts
	it(`should_return_false_if_username_and_password_does_not_match`, async () => {
		const userSignInRequestDto: UserSignInRequestDto = new UserSignInRequestDto();
		userSignInRequestDto.userName = 'eshaan.naik.dev62@gmail.com'; // *True
		userSignInRequestDto.password = 'Shree@123';

		const aes = new AES(ENCRYPTION_KEY);
		const encryptRequestBody = await aes.encryptAsync(JSON.stringify(userSignInRequestDto));

		const aesRequestDto: AesRequestDto = new AesRequestDto();
		aesRequestDto.body = encryptRequestBody;

		const response = await request(app).post('/api/v1/users/sign-in').send(aesRequestDto);
		expect(response.status).toBe(401);
		// setTimeout(() => {
		// 	process.exit(0);
		// }, 2000);
	});

	// node --trace-deprecation --test --test-name-pattern='should_return_true_if_username_and_password_does_match' --require ts-node/register -r tsconfig-paths/register ./src/modules/users/tests/integration/v1/signIn/index.test.ts
	it(`should_return_true_if_username_and_password_does_match`, async () => {
		const userSignInRequestDto: UserSignInRequestDto = new UserSignInRequestDto();
		userSignInRequestDto.userName = 'eshaan.naik.dev62@gmail.com'; // *True
		userSignInRequestDto.password = 'Shree@123';

		const aes = new AES(ENCRYPTION_KEY);
		const encryptRequestBody = await aes.encryptAsync(JSON.stringify(userSignInRequestDto));

		const aesRequestDto: AesRequestDto = new AesRequestDto();
		aesRequestDto.body = encryptRequestBody;

		const response = await request(app).post('/api/v1/users/sign-in').send(aesRequestDto);
		console.log(`response: ${JSON.stringify(response)}`);
		expect(response.status).toBe(200);
		// setTimeout(() => {
		// 	process.exit(0);
		// }, 2000);
	});
});
