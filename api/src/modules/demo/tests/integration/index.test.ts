// Debug Mode:All Test Case Run
//node --trace-deprecation --test --require ts-node/register -r tsconfig-paths/register ./src/modules/demo/tests/integration/index.test.ts

// Debug Mode:Specific Test Case Run
//node --trace-deprecation --test --test-name-pattern='test_name' --require ts-node/register -r tsconfig-paths/register ./src/modules/demo/tests/integration/index.test.ts

// If Debug not Worked then use
//node --trace-deprecation --test --test-name-pattern='test_name' --require ts-node/register --inspect=4321 -r tsconfig-paths/register ./src/modules/demo/tests/integration/index.test.ts

import 'reflect-metadata';
import { describe, it } from 'node:test';
import expect from 'expect';
import request from 'supertest';
import { App } from '@/app';
import { ValidateEnv } from '@/shared/utils/validations/env';
import { modulesFederation } from '@/modules';

process.env.NODE_ENV = 'development';
process.env.ENCRYPTION_KEY = 'RWw5ejc0Wzjq0i0T2ZTZhcYu44fQI5M6';
ValidateEnv();

const appInstance = new App([...modulesFederation]);
const app = appInstance.getServer();

describe('Demo Aes Integration Test', () => {
	// node --trace-deprecation --test --test-name-pattern='should_return_true_if_all_service_return_ok' --require ts-node/register -r tsconfig-paths/register ./src/modules/demo/tests/integration/index.test.ts
	it('should_return_true_if_all_service_return_ok', async () => {
		const response = await request(app).post('/api/v1/demo').send({
			body: '31cb5787acd4d7e14b3d93aa72cc8ddb:3efb69ded0ab33cfca1ce89575ed3b18657e2d20c3da2590973aca8dcad7bb980790267f8667bd8465f2c7fb1a6947f6',
		});
		expect(response.status).toBe(200);
	});
});
