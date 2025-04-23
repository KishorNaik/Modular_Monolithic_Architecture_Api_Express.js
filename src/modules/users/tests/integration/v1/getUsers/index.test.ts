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

process.env.NODE_ENV = 'development';
process.env.ENCRYPTION_KEY = 'RWw5ejc0Wzjq0i0T2ZTZhcYu44fQI5M6';
ValidateEnv();

const appInstance = new App([...modulesFederation]);
const app = appInstance.getServer();

describe(`Get Users Integration Test`, () => {
	beforeEach(async () => {
		await initializeDatabase();
	});

	afterEach(async () => {
		await destroyDatabase();
	});

	// node --trace-deprecation --test --test-name-pattern='should_return_false_when_any_query_is_provided' --require ts-node/register -r tsconfig-paths/register ./src/modules/users/tests/integration/v1/getUsers/index.test.ts
	it(`should_return_false_when_any_query_is_provided`, async () => {
		// HMAC Auth
		const clientId: string = '006dbdfb-0f56-42ae-2b1d-9c0e1adb4979';
		const hmacSecretKey: string = '66898044-0df2-d050-cc10-a6a5b73c3b5b';
		const userId: string = 'e30ff63e-caa1-5dc0-99a5-504f14e55317';

		// Jwt Auth
		const token = jwt.sign({ id: userId, role: RoleEnum.ADMIN }, SECRET_KEY, {
			expiresIn: '1h',
		});

		const endpoint = `/api/v1/users`;

		const payload = endpoint;
		//const signatureResult = generateHmac(JSON.stringify(payload), hmacSecretKey);
		const signatureResult = generateHmac(payload, hmacSecretKey);
		if (signatureResult.isErr()) {
			expect(signatureResult.isErr()).toBe(false);
			return;
		}
		const signature = signatureResult.value;

		const response = await request(app)
			.get(endpoint)
			.set('x-auth-signature', signature)
			.set('x-client-id', clientId)
			.set('authorization', `Bearer ${token}`);
		//.send(payload);

		expect(response.status).toBe(400);
		// setTimeout(() => {
		// 	process.exit(0);
		// }, 2000);
	});

	// node --trace-deprecation --test --test-name-pattern='should_return_true_when_pagination_is_provided' --require ts-node/register -r tsconfig-paths/register ./src/modules/users/tests/integration/v1/getUsers/index.test.ts
	it(`should_return_true_when_pagination_is_provided`, async () => {
		// HMAC Auth
		const clientId: string = '006dbdfb-0f56-42ae-2b1d-9c0e1adb4979';
		const hmacSecretKey: string = '66898044-0df2-d050-cc10-a6a5b73c3b5b';
		const userId: string = 'e30ff63e-caa1-5dc0-99a5-504f14e55317';

		// Jwt Auth
		const token = jwt.sign({ id: userId, role: RoleEnum.ADMIN }, SECRET_KEY, {
			expiresIn: '1h',
		});

		const endpoint = `/api/v1/users?pageNumber=1&pageSize=10`;

		const payload = endpoint;
		//const signatureResult = generateHmac(JSON.stringify(payload), hmacSecretKey);
		const signatureResult = generateHmac(payload, hmacSecretKey);
		if (signatureResult.isErr()) {
			expect(signatureResult.isErr()).toBe(false);
			return;
		}
		const signature = signatureResult.value;

		const response = await request(app)
			.get(endpoint)
			.set('x-auth-signature', signature)
			.set('x-client-id', clientId)
			.set('authorization', `Bearer ${token}`);
		//.send(payload);

		expect(response.status).toBe(200);
		// setTimeout(() => {
		// 	process.exit(0);
		// }, 2000);
	});

	// node --trace-deprecation --test --test-name-pattern='should_return_true_when_filter_is_provided' --require ts-node/register -r tsconfig-paths/register ./src/modules/users/tests/integration/v1/getUsers/index.test.ts
	it(`should_return_true_when_filter_is_provided`, async () => {
		// HMAC Auth
		const clientId: string = '006dbdfb-0f56-42ae-2b1d-9c0e1adb4979';
		const hmacSecretKey: string = '66898044-0df2-d050-cc10-a6a5b73c3b5b';
		const userId: string = 'e30ff63e-caa1-5dc0-99a5-504f14e55317';

		// Jwt Auth
		const token = jwt.sign({ id: userId, role: RoleEnum.ADMIN }, SECRET_KEY, {
			expiresIn: '1h',
		});

		const endpoint = `/api/v1/users?pageNumber=1&pageSize=10&filter=eshaan`;

		const payload = endpoint;
		//const signatureResult = generateHmac(JSON.stringify(payload), hmacSecretKey);
		const signatureResult = generateHmac(payload, hmacSecretKey);
		if (signatureResult.isErr()) {
			expect(signatureResult.isErr()).toBe(false);
			return;
		}
		const signature = signatureResult.value;

		const response = await request(app)
			.get(endpoint)
			.set('x-auth-signature', signature)
			.set('x-client-id', clientId)
			.set('authorization', `Bearer ${token}`);
		//.send(payload);

		expect(response.status).toBe(200);
		// setTimeout(() => {
		// 	process.exit(0);
		// }, 2000);
	});
});
