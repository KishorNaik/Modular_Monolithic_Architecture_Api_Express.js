import { afterEach, beforeEach, describe, it } from 'node:test';
import expect from 'expect';
import request from 'supertest';
import { App } from '@/app';
import { modulesFederation } from '@/modules';
import { ValidateEnv } from '@/shared/utils/validations/env';
import { destroyDatabase, initializeDatabase } from '@kishornaik/mma_db';

process.env.NODE_ENV = 'development';
process.env.ENCRYPTION_KEY = 'RWw5ejc0Wzjq0i0T2ZTZhcYu44fQI5M6';
ValidateEnv();

const appInstance = new App([...modulesFederation]);
const app = appInstance.getServer();

describe(`Verify User Integration Test`, () => {
	beforeEach(async () => {
		await initializeDatabase();
	});

	afterEach(async () => {
		await destroyDatabase();
	});

	// node --trace-deprecation --test --test-name-pattern='should_return_false_when_email_token_is_provided_non_uuid' --require ts-node/register -r tsconfig-paths/register ./src/modules/users/tests/integration/v1/verifyUsers/index.test.ts
	it(`should_return_false_when_email_token_is_provided_non_uuid`, async () => {
		const response = await request(app).get('/api/v1/users/verify/123');
		expect(response.status).toBe(400);
		setTimeout(() => {
			process.exit(0);
		}, 2000);
	});

	// node --trace-deprecation --test --test-name-pattern='should_return_false_when_email_token_is_provided_wrong_which_does_not_exist' --require ts-node/register -r tsconfig-paths/register ./src/modules/users/tests/integration/v1/verifyUsers/index.test.ts
	it(`should_return_false_when_email_token_is_provided_wrong_which_does_not_exist`, async () => {
		const response = await request(app).get(
			'/api/v1/users/verify/fc9b9992-acba-e39f-cfc8-e530a21c8140'
		);
		expect(response.status).toBe(406);
		setTimeout(() => {
			process.exit(0);
		}, 2000);
	});

	// node --trace-deprecation --test --test-name-pattern='should_return_true_when_token_is_Valid' --require ts-node/register -r tsconfig-paths/register ./src/modules/users/tests/integration/v1/verifyUsers/index.test.ts
	it(`should_return_true_when_token_is_Valid`, async () => {
		const response = await request(app).get(
			'/api/v1/users/verify/0cc59fe4-79c0-7398-cc74-8f28345d0f20'
		);
		expect(response.status).toBe(200);
		setTimeout(() => {
			process.exit(0);
		}, 2000);
	});

	// node --trace-deprecation --test --test-name-pattern='should_return_false_when_previous_token_is_used' --require ts-node/register -r tsconfig-paths/register ./src/modules/users/tests/integration/v1/verifyUsers/index.test.ts
	it(`should_return_false_when_previous_token_is_used`, async () => {
		const response = await request(app).get(
			'/api/v1/users/verify/aa02f5ef-a4f3-dc39-78ce-855dfd032f73'
		);
		expect(response.status).toBe(406);
		setTimeout(() => {
			process.exit(0);
		}, 2000);
	});

	// node --trace-deprecation --test --test-name-pattern='should_return_true_when_token_is_expired' --require ts-node/register -r tsconfig-paths/register ./src/modules/users/tests/integration/v1/verifyUsers/index.test.ts
	it(`should_return_true_when_token_is_expired`, async () => {
		const response = await request(app).get(
			'/api/v1/users/verify/88bbbf46-a897-52a9-ef02-086610b8234a'
		);
		expect(response.status).toBe(200);
		setTimeout(() => {
			process.exit(0);
		}, 2000);
	});
});
