import { App } from '@/app';
import { modulesFederation } from '@/modules';
import { ValidateEnv } from '@/shared/utils/validations/env';
import { destroyDatabase, initializeDatabase } from '@kishornaik/mma_db';
import { afterEach, beforeEach, describe, it } from 'node:test';
import expect from 'expect';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { generateHmac } from '@/shared/utils/helpers/hmac';
import { AES } from '@/shared/utils/helpers/aes';
import { RoleEnum } from '@/shared/models/enums/role.enum';
import { SECRET_KEY } from '@/config';
import { UpdateUserRequestDto } from '@/modules/users/apps/features/v1/updateUsers';
import { AesRequestDto } from '@/shared/models/request/aes.RequestDto';
import { StatusCodes } from 'http-status-codes';

process.env.NODE_ENV = 'development';
process.env.ENCRYPTION_KEY = 'RWw5ejc0Wzjq0i0T2ZTZhcYu44fQI5M6';
ValidateEnv();

const appInstance = new App([...modulesFederation]);
const app = appInstance.getServer();

describe(`deactivate Users Integration Test`, () => {
	beforeEach(async () => {
		await initializeDatabase();
	});

	afterEach(async () => {
		await destroyDatabase();
	});

	// node --trace-deprecation --test --test-name-pattern='should_return_false_when_userid_passed_wrong' --require ts-node/register -r tsconfig-paths/register ./src/modules/users/tests/integration/v1/deactivateUser/index.test.ts
	it(`should_return_false_when_userid_passed_wrong`, async () => {
		// HMAC Auth
		const clientId: string = '006dbdfb-0f56-42ae-2b1d-9c0e1adb4979';
		const hmacSecretKey: string = '66898044-0df2-d050-cc10-a6a5b73c3b5b';
		const aesSecretKey: string = 'RWw5ejc0Wzjq0i0T2ZTZhcYu44fQI5M7';
		const userId: string = 'e30ff63e-caa1-5dc0-99a5-504f14e55317';

		// Jwt Auth
		const token = jwt.sign({ id: userId, role: RoleEnum.USER }, SECRET_KEY, {
			expiresIn: '1h',
		});

		const endpoint = `/api/v1/users/e30ff63e-caa1-5dc0-99a5-504f14e55318`;

		const payload = endpoint;
		const signatureResult = generateHmac(payload, hmacSecretKey);
		if (signatureResult.isErr()) {
			expect(signatureResult.isErr()).toBe(false);
			return;
		}
		const signature = signatureResult.value;

		const response = await request(app)
			.delete(endpoint)
			.set('x-auth-signature', signature)
			.set('x-client-id', clientId)
			.set('authorization', `Bearer ${token}`);

		expect(response.status).toBe(StatusCodes.UNAUTHORIZED);
	});

	// node --trace-deprecation --test --test-name-pattern='should_return_false_when_userid_is_not_uuid' --require ts-node/register -r tsconfig-paths/register ./src/modules/users/tests/integration/v1/deactivateUser/index.test.ts
	it(`should_return_false_when_userid_is_not_uuid`, async () => {
		// HMAC Auth
		const clientId: string = '006dbdfb-0f56-42ae-2b1d-9c0e1adb4979';
		const hmacSecretKey: string = '66898044-0df2-d050-cc10-a6a5b73c3b5b';
		const aesSecretKey: string = 'RWw5ejc0Wzjq0i0T2ZTZhcYu44fQI5M7';
		const userId: string = 'e30ff63e-caa1-5dc0-99a5-504f14e55317';

		// Jwt Auth
		const token = jwt.sign({ id: userId, role: RoleEnum.USER }, SECRET_KEY, {
			expiresIn: '1h',
		});

		const endpoint = `/api/v1/users/hello-world`;

		const payload = endpoint;
		const signatureResult = generateHmac(payload, hmacSecretKey);
		if (signatureResult.isErr()) {
			expect(signatureResult.isErr()).toBe(false);
			return;
		}
		const signature = signatureResult.value;

		const response = await request(app)
			.delete(endpoint)
			.set('x-auth-signature', signature)
			.set('x-client-id', clientId)
			.set('authorization', `Bearer ${token}`);

		expect(response.status).toBe(StatusCodes.UNAUTHORIZED);
	});

	// node --trace-deprecation --test --test-name-pattern='should_return_true_when_all_service_passed' --require ts-node/register -r tsconfig-paths/register ./src/modules/users/tests/integration/v1/deactivateUser/index.test.ts
	it(`should_return_true_when_all_service_passed`, async () => {
		// HMAC Auth
		const clientId: string = '006dbdfb-0f56-42ae-2b1d-9c0e1adb4979';
		const hmacSecretKey: string = '66898044-0df2-d050-cc10-a6a5b73c3b5b';
		const aesSecretKey: string = 'RWw5ejc0Wzjq0i0T2ZTZhcYu44fQI5M7';
		const userId: string = 'e30ff63e-caa1-5dc0-99a5-504f14e55317';

		// Jwt Auth
		const token = jwt.sign({ id: userId, role: RoleEnum.USER }, SECRET_KEY, {
			expiresIn: '1h',
		});

		const endpoint = `/api/v1/users/${userId}`;

		const payload = endpoint;
		const signatureResult = generateHmac(payload, hmacSecretKey);
		if (signatureResult.isErr()) {
			expect(signatureResult.isErr()).toBe(false);
			return;
		}
		const signature = signatureResult.value;

		const response = await request(app)
			.delete(endpoint)
			.set('x-auth-signature', signature)
			.set('x-client-id', clientId)
			.set('authorization', `Bearer ${token}`);

		expect(response.status).toBe(StatusCodes.OK);
	});

	// node --trace-deprecation --test --test-name-pattern='should_return_false_when_user_already_deactivated' --require ts-node/register -r tsconfig-paths/register ./src/modules/users/tests/integration/v1/deactivateUser/index.test.ts
	it(`should_return_false_when_user_already_deactivated`, async () => {
		// HMAC Auth
		const clientId: string = '006dbdfb-0f56-42ae-2b1d-9c0e1adb4979';
		const hmacSecretKey: string = '66898044-0df2-d050-cc10-a6a5b73c3b5b';
		const aesSecretKey: string = 'RWw5ejc0Wzjq0i0T2ZTZhcYu44fQI5M7';
		const userId: string = 'e30ff63e-caa1-5dc0-99a5-504f14e55317';

		// Jwt Auth
		const token = jwt.sign({ id: userId, role: RoleEnum.USER }, SECRET_KEY, {
			expiresIn: '1h',
		});

		const endpoint = `/api/v1/users/${userId}`;

		const payload = endpoint;
		const signatureResult = generateHmac(payload, hmacSecretKey);
		if (signatureResult.isErr()) {
			expect(signatureResult.isErr()).toBe(false);
			return;
		}
		const signature = signatureResult.value;

		const response = await request(app)
			.delete(endpoint)
			.set('x-auth-signature', signature)
			.set('x-client-id', clientId)
			.set('authorization', `Bearer ${token}`);

		expect(response.status).toBe(StatusCodes.NOT_FOUND);
	});
});
