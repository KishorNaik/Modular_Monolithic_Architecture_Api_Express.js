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
import { RefreshTokenRequestDto } from '@/modules/users/apps/features/v1/refreshToken';
import { AesRequestDto } from '@/shared/models/request/aes.RequestDto';


process.env.NODE_ENV = 'development';
process.env.ENCRYPTION_KEY = 'RWw5ejc0Wzjq0i0T2ZTZhcYu44fQI5M6';
ValidateEnv();

const appInstance = new App([...modulesFederation]);
const app = appInstance.getServer();

describe(`Refresh Token Integration Test`, () => {

  beforeEach(async () => {
		await initializeDatabase();
	});

	afterEach(async () => {
		await destroyDatabase();
	});

    // node --trace-deprecation --test --test-name-pattern='should_return_false_when_refresh_token_is_provided_wrong' --require ts-node/register -r tsconfig-paths/register ./src/modules/users/tests/integration/v1/refreshToken/index.test.ts
	it(`should_return_false_when_refresh_token_is_provided_wrong`, async () => {
		// HMAC Auth
		const clientId: string = '006dbdfb-0f56-42ae-2b1d-9c0e1adb4979';
		const hmacSecretKey: string = '66898044-0df2-d050-cc10-a6a5b73c3b5b';
    const aesSecretKey:string="RWw5ejc0Wzjq0i0T2ZTZhcYu44fQI5M7";
		const userId: string = 'e30ff63e-caa1-5dc0-99a5-504f14e55317';

    // Body
    // Jwt Auth
		const token = jwt.sign({ id: userId, role: RoleEnum.USER }, SECRET_KEY, {
			expiresIn: '1h',
		});
    const refreshToken:string="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImUzMGZmNjNlLWNhYTEtNWRjMC05OWE1LTUwNGYxNGU1NTMxNyIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzQ1MDgwNzYyLCJleHAiOjE3NDU2ODU1NjJ9.eVraEHXbhz-Lwm73L4Y8iV1b0YvpqzCtvFihI2L_Q7s"
    const refreshTokenRequestDto:RefreshTokenRequestDto=new RefreshTokenRequestDto();
    refreshTokenRequestDto.accessToken=token;
    refreshTokenRequestDto.refreshToken=refreshToken;

    const aes = new AES(aesSecretKey);
    const encryptRequestBody = await aes.encryptAsync(JSON.stringify(refreshTokenRequestDto));

    const aesRequestDto: AesRequestDto = new AesRequestDto();
    aesRequestDto.body = encryptRequestBody;

		const endpoint = `/api/v1/users/refresh-token`;

		//const payload = endpoint;
    const payload=aesRequestDto;
		const signatureResult = generateHmac(JSON.stringify(payload), hmacSecretKey);
		//const signatureResult = generateHmac(payload, hmacSecretKey);
		if (signatureResult.isErr()) {
			expect(signatureResult.isErr()).toBe(false);
			return;
		}
		const signature = signatureResult.value;

		const response = await request(app)
			.patch(endpoint)
			.set('x-auth-signature', signature)
			.set('x-client-id', clientId)
      //.set('authorization', `Bearer ${token}`);
      .send(payload)


		expect(response.status).toBe(401);
		// setTimeout(() => {
		// 	process.exit(0);
		// }, 2000);
	});

  // node --trace-deprecation --test --test-name-pattern='should_return_true_when_all_services_pass' --require ts-node/register -r tsconfig-paths/register ./src/modules/users/tests/integration/v1/refreshToken/index.test.ts
	it(`should_return_true_when_all_services_pass`, async () => {
		// HMAC Auth
		const clientId: string = '006dbdfb-0f56-42ae-2b1d-9c0e1adb4979';
		const hmacSecretKey: string = '66898044-0df2-d050-cc10-a6a5b73c3b5b';
    const aesSecretKey:string="RWw5ejc0Wzjq0i0T2ZTZhcYu44fQI5M7";
		const userId: string = 'e30ff63e-caa1-5dc0-99a5-504f14e55317';

    // Body
    // Jwt Auth
		const token = jwt.sign({ id: userId, role: RoleEnum.USER }, SECRET_KEY, {
			expiresIn: '1h',
		});
    const refreshToken:string="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImUzMGZmNjNlLWNhYTEtNWRjMC05OWE1LTUwNGYxNGU1NTMxNyIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzQ1MDgwNzYyLCJleHAiOjE3NDU2ODU1NjJ9.eVraEHXbhz-Lwm73L4Y8iV1b0YvpqzCtvFihI2L_Q7s"
    const refreshTokenRequestDto:RefreshTokenRequestDto=new RefreshTokenRequestDto();
    refreshTokenRequestDto.accessToken=token;
    refreshTokenRequestDto.refreshToken=refreshToken;

    const aes = new AES(aesSecretKey);
    const encryptRequestBody = await aes.encryptAsync(JSON.stringify(refreshTokenRequestDto));

    const aesRequestDto: AesRequestDto = new AesRequestDto();
    aesRequestDto.body = encryptRequestBody;

		const endpoint = `/api/v1/users/refresh-token`;

		//const payload = endpoint;
    const payload=aesRequestDto;
		const signatureResult = generateHmac(JSON.stringify(payload), hmacSecretKey);
		//const signatureResult = generateHmac(payload, hmacSecretKey);
		if (signatureResult.isErr()) {
			expect(signatureResult.isErr()).toBe(false);
			return;
		}
		const signature = signatureResult.value;

		const response = await request(app)
			.patch(endpoint)
			.set('x-auth-signature', signature)
			.set('x-client-id', clientId)
      //.set('authorization', `Bearer ${token}`);
      .send(payload)


		expect(response.status).toBe(200);
		// setTimeout(() => {
		// 	process.exit(0);
		// }, 2000);
	});
});
