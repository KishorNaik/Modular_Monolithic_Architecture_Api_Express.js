import { App } from '@/app';
import { modulesFederation } from '@/modules';
import { AesRequestDto } from '@/shared/models/request/aes.RequestDto';
import { ValidateEnv } from '@/shared/utils/validations/env';
import { destroyDatabase, initializeDatabase } from '@kishornaik/mma_db';
import { afterEach, beforeEach, describe, it } from 'node:test';
import expect from 'expect';
import request from 'supertest';
import { AES } from '@/shared/utils/helpers/aes';
import { generateHmac } from '@/shared/utils/helpers/hmac';
import jwt from 'jsonwebtoken';
import { SECRET_KEY } from '@/config';
import { RoleEnum } from '@/shared/models/enums/role.enum';

process.env.NODE_ENV = 'development';
process.env.ENCRYPTION_KEY = 'RWw5ejc0Wzjq0i0T2ZTZhcYu44fQI5M6';
ValidateEnv();

const appInstance = new App([...modulesFederation]);
const app = appInstance.getServer();

describe(`get user by identifier integration test`,()=>{
  beforeEach(async () => {
		await initializeDatabase();
	});

	afterEach(async () => {
		await destroyDatabase();
	});

  // node --trace-deprecation --test --test-name-pattern='should_return_false_when_clientId_provided_wrong' --require ts-node/register -r tsconfig-paths/register ./src/modules/users/tests/integration/v1/getUsersByIdentifier/index.test.ts
	it(`should_return_false_when_clientId_provided_wrong`, async () => {

    // HMAC Auth
    const clientId:string="006dbdfb-0f56-42ae-2b1d-9c0e1adb4978";
    const clientSecretId:string="66898044-0df2-d050-cc10-a6a5b73c3b5b";
    const userId:string="e30ff63e-caa1-5dc0-99a5-504f14e55317";

    //const endpoint = '/api/v1/users/e30ff63e-caa1-5dc0-99a5-504f14e55317'; //* True
    const endpoint = '/api/v1/users/hello';

    const payload = endpoint;
    //const signatureResult = generateHmac(JSON.stringify(payload), clientSecretId);
    const signatureResult = generateHmac(payload, clientSecretId);
    if(signatureResult.isErr()){
      expect(signatureResult.isErr()).toBe(false);
      return;
    }
    const signature = signatureResult.value;

    // Jwt Auth
		const token = jwt.sign({ id: userId, role:RoleEnum.USER }, SECRET_KEY, { expiresIn: '1h' });

		const response = await request(app)
                          .get(endpoint)
                          .set('x-auth-signature', signature)
                          .set('x-client-id', clientId)
                          .set('authorization', `Bearer ${token}`)

		expect(response.status).toBe(403);
		// setTimeout(() => {
		// 	process.exit(0);
		// }, 2000);
	});

  // node --trace-deprecation --test --test-name-pattern='should_return_false_when_clientSecretId_provided_wrong' --require ts-node/register -r tsconfig-paths/register ./src/modules/users/tests/integration/v1/getUsersByIdentifier/index.test.ts
	it(`should_return_false_when_clientSecretId_provided_wrong`, async () => {

    // HMAC Auth
    const clientId:string="006dbdfb-0f56-42ae-2b1d-9c0e1adb4979";
    const clientSecretId:string="66898044-0df2-d050-cc10-a6a5b73c3b5c";
    const userId:string="e30ff63e-caa1-5dc0-99a5-504f14e55317";

    //const endpoint = '/api/v1/users/e30ff63e-caa1-5dc0-99a5-504f14e55317'; //* True
    const endpoint = '/api/v1/users/hello';

    const payload = endpoint;
    //const signatureResult = generateHmac(JSON.stringify(payload), clientSecretId);
    const signatureResult = generateHmac(payload, clientSecretId);
    if(signatureResult.isErr()){
      expect(signatureResult.isErr()).toBe(false);
      return;
    }
    const signature = signatureResult.value;

    // Jwt Auth
		const token = jwt.sign({ id: userId, role:RoleEnum.USER }, SECRET_KEY, { expiresIn: '1h' });

		const response = await request(app)
                          .get(endpoint)
                          .set('x-auth-signature', signature)
                          .set('x-client-id', clientId)
                          .set('authorization', `Bearer ${token}`)

		expect(response.status).toBe(403);
		// setTimeout(() => {
		// 	process.exit(0);
		// }, 2000);
	});

  // node --trace-deprecation --test --test-name-pattern='should_return_false_when_userId_provided_wrong' --require ts-node/register -r tsconfig-paths/register ./src/modules/users/tests/integration/v1/getUsersByIdentifier/index.test.ts
	it(`should_return_false_when_userId_provided_wrong`, async () => {

    // HMAC Auth
    const clientId:string="006dbdfb-0f56-42ae-2b1d-9c0e1adb4979";
    const clientSecretId:string="66898044-0df2-d050-cc10-a6a5b73c3b5b";
    const userId:string="e30ff63e-caa1-5dc0-99a5-504f14e55318";

    //const endpoint = '/api/v1/users/e30ff63e-caa1-5dc0-99a5-504f14e55317'; //* True
    const endpoint = `/api/v1/users/${userId}`;

    const payload = endpoint;
    //const signatureResult = generateHmac(JSON.stringify(payload), clientSecretId);
    const signatureResult = generateHmac(payload, clientSecretId);
    if(signatureResult.isErr()){
      expect(signatureResult.isErr()).toBe(false);
      return;
    }
    const signature = signatureResult.value;

    // Jwt Auth
		const token = jwt.sign({ id: userId, role:RoleEnum.USER }, SECRET_KEY, { expiresIn: '1h' });

		const response = await request(app)
                          .get(endpoint)
                          .set('x-auth-signature', signature)
                          .set('x-client-id', clientId)
                          .set('authorization', `Bearer ${token}`)

		expect(response.status).toBe(404);
		// setTimeout(() => {
		// 	process.exit(0);
		// }, 2000);
	});

  // node --trace-deprecation --test --test-name-pattern='should_return_false_when_identifier_is_not_uuid' --require ts-node/register -r tsconfig-paths/register ./src/modules/users/tests/integration/v1/getUsersByIdentifier/index.test.ts
	it(`should_return_false_when_identifier_is_not_uuid`, async () => {

    // HMAC Auth
    const clientId:string="006dbdfb-0f56-42ae-2b1d-9c0e1adb4979";
    const clientSecretId:string="66898044-0df2-d050-cc10-a6a5b73c3b5b";
    const userId:string="hello";

    //const endpoint = '/api/v1/users/e30ff63e-caa1-5dc0-99a5-504f14e55317'; //* True
    const endpoint = `/api/v1/users/${userId}`;

    const payload = endpoint;
    //const signatureResult = generateHmac(JSON.stringify(payload), clientSecretId);
    const signatureResult = generateHmac(payload, clientSecretId);
    if(signatureResult.isErr()){
      expect(signatureResult.isErr()).toBe(false);
      return;
    }
    const signature = signatureResult.value;

    // Jwt Auth
		const token = jwt.sign({ id: userId, role:RoleEnum.USER }, SECRET_KEY, { expiresIn: '1h' });

		const response = await request(app)
                          .get(endpoint)
                          .set('x-auth-signature', signature)
                          .set('x-client-id', clientId)
                          .set('authorization', `Bearer ${token}`)

		expect(response.status).toBe(400);
		// setTimeout(() => {
		// 	process.exit(0);
		// }, 2000);
	});

   // node --trace-deprecation --test --test-name-pattern='should_return_false_when_jwt_token_provided_wrong' --require ts-node/register -r tsconfig-paths/register ./src/modules/users/tests/integration/v1/getUsersByIdentifier/index.test.ts
  it(`should_return_false_when_jwt_token_provided_wrong`, async () => {

    // HMAC Auth
    const clientId:string="006dbdfb-0f56-42ae-2b1d-9c0e1adb4979";
    const clientSecretId:string="66898044-0df2-d050-cc10-a6a5b73c3b5b";
    const userId:string="e30ff63e-caa1-5dc0-99a5-504f14e55317";

    //const endpoint = '/api/v1/users/e30ff63e-caa1-5dc0-99a5-504f14e55317'; //* True
    const endpoint = `/api/v1/users/${userId}`;

    const payload = endpoint;
    //const signatureResult = generateHmac(JSON.stringify(payload), clientSecretId);
    const signatureResult = generateHmac(payload, clientSecretId);
    if(signatureResult.isErr()){
      expect(signatureResult.isErr()).toBe(false);
      return;
    }
    const signature = signatureResult.value;

    // Jwt Auth
		const token = jwt.sign({ id: `${userId}1234`, role:RoleEnum.USER }, SECRET_KEY, { expiresIn: '1h' });

		const response = await request(app)
                          .get(endpoint)
                          .set('x-auth-signature', signature)
                          .set('x-client-id', clientId)
                          .set('authorization', `Bearer ${token}`)

		expect(response.status).toBe(401);
		// setTimeout(() => {
		// 	process.exit(0);
		// }, 2000);
	});

  // node --trace-deprecation --test --test-name-pattern='should_return_true_when_all_services_pass' --require ts-node/register -r tsconfig-paths/register ./src/modules/users/tests/integration/v1/getUsersByIdentifier/index.test.ts
	it(`should_return_true_when_all_services_pass`, async () => {

    // HMAC Auth
    const clientId:string="006dbdfb-0f56-42ae-2b1d-9c0e1adb4979";
    const clientSecretId:string="66898044-0df2-d050-cc10-a6a5b73c3b5b";
    const userId:string="e30ff63e-caa1-5dc0-99a5-504f14e55317";

    //const endpoint = '/api/v1/users/e30ff63e-caa1-5dc0-99a5-504f14e55317'; //* True
    const endpoint = `/api/v1/users/${userId}`;

    const payload = endpoint;
    //const signatureResult = generateHmac(JSON.stringify(payload), clientSecretId);
    const signatureResult = generateHmac(payload, clientSecretId);
    if(signatureResult.isErr()){
      expect(signatureResult.isErr()).toBe(false);
      return;
    }
    const signature = signatureResult.value;

    // Jwt Auth
		const token = jwt.sign({ id: userId, role:RoleEnum.USER }, SECRET_KEY, { expiresIn: '1h' });

		const response = await request(app)
                          .get(endpoint)
                          .set('x-auth-signature', signature)
                          .set('x-client-id', clientId)
                          .set('authorization', `Bearer ${token}`)

		expect(response.status).toBe(200);
		// setTimeout(() => {
		// 	process.exit(0);
		// }, 2000);
	});
})
