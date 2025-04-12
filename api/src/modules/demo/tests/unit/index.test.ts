// Debug Mode:All Test Case Run
//node --trace-deprecation --test --require ts-node/register -r tsconfig-paths/register ./src/modules/demo/tests/unit/index.test.ts

// Debug Mode:Specific Test Case Run
//node --trace-deprecation --test --test-name-pattern='test_name' --require ts-node/register -r tsconfig-paths/register ./src/modules/demo/tests/unit/index.test.ts

// If Debug not Worked then use
//node --trace-deprecation --test --test-name-pattern='test_name' --require ts-node/register --inspect=4321 -r tsconfig-paths/register ./src/modules/demo/tests/unit/index.test.ts

import 'reflect-metadata';
import test, { afterEach, beforeEach, describe } from 'node:test';
import expect from 'expect';
import Sinon, * as sinon from 'sinon';
import { Err, ok } from 'neverthrow';
import { StatusCodes } from 'http-status-codes';
import { DemoAesCommand, DemoAesCommandHandler } from '../../apps/features/v1/demoAes';
import { ResultError } from '@/shared/utils/exceptions/results';
import { AesRequestDto } from '@/shared/models/request/aes.RequestDto';
import { ENCRYPTION_KEY } from '@/config';
import { faker } from '@faker-js/faker';
import Container from 'typedi';
import {
	AesDemoValidationService,
	IAseDemoValidationServiceParameters,
} from '../../apps/features/v1/demoAes/services/validation';
import {
	DemoAesRequestDto,
	DemoAesResponseDto,
} from '../../apps/contracts/v1/demoAes/index.Contract';
import {
	AesDemoEncryptResponseService,
	IAesDemoEncryptResponseServiceParameters,
} from '../../apps/features/v1/demoAes/services/encryptResponse';
import { AesResponseDto } from '@/shared/models/response/aes.ResponseDto';
import {
	AesDemoDecryptService,
	IAseDemoDecryptServiceParameters,
} from '../../apps/features/v1/demoAes/services/decryptRequest';

describe('demoAes', () => {
	let demoAesCommandHandler: DemoAesCommandHandler;
	let aesDemoDecryptServiceStub: sinon.SinonStubbedInstance<AesDemoDecryptService>;
	let aesDemoValidationServiceStub: sinon.SinonStubbedInstance<AesDemoValidationService>;
	let aesDemoEncryptResponseServiceStub: sinon.SinonStubbedInstance<AesDemoEncryptResponseService>;

	beforeEach(() => {
		aesDemoDecryptServiceStub = sinon.createStubInstance(AesDemoDecryptService);
		aesDemoValidationServiceStub = sinon.createStubInstance(AesDemoValidationService);
		aesDemoEncryptResponseServiceStub = sinon.createStubInstance(AesDemoEncryptResponseService);

		sinon
			.stub(Container, 'get')
			.withArgs(sinon.match((value) => value === AesDemoDecryptService))
			.returns(aesDemoDecryptServiceStub)
			.withArgs(sinon.match((value) => value === AesDemoValidationService))
			.returns(aesDemoValidationServiceStub)
			.withArgs(sinon.match((value) => value === AesDemoEncryptResponseService))
			.returns(aesDemoEncryptResponseServiceStub);

		demoAesCommandHandler = new DemoAesCommandHandler();
	});

	afterEach(() => {
		sinon.restore();
	});

	//node --trace-deprecation --test --test-name-pattern='should_return_false_if_command_is_invalid_or_null' --require ts-node/register -r tsconfig-paths/register ./src/modules/demo/tests/unit/index.test.ts
	test(`should_return_false_if_command_is_invalid_or_null`, async () => {
		// Arrange
		const request = null;
		const demoAesCommand: DemoAesCommand = null;

		// Act
		const result = await demoAesCommandHandler.handle(demoAesCommand);

		// Assert
		expect(result.Success).toBe(false);
		expect(result.StatusCode).toBe(StatusCodes.BAD_REQUEST);
		expect(result.Message).toBe('Invalid command');
	});

	//node --trace-deprecation --test --test-name-pattern='should_return_false_if_request_is_null' --require ts-node/register -r tsconfig-paths/register ./src/modules/demo/tests/unit/index.test.ts
	test(`should_return_false_if_request_is_null`, async () => {
		// Arrange
		const request = null;
		const demoAesCommand: DemoAesCommand = new DemoAesCommand(request);

		// Act
		const result = await demoAesCommandHandler.handle(demoAesCommand);

		// Assert
		expect(result.Success).toBe(false);
		expect(result.StatusCode).toBe(StatusCodes.BAD_REQUEST);
		expect(result.Message).toBe('Invalid request');
	});

	//node --trace-deprecation --test --test-name-pattern='should_return_false_if_decrypt_request_is_null' --require ts-node/register -r tsconfig-paths/register ./src/modules/demo/tests/unit/index.test.ts
	test(`should_return_false_if_body_is_null`, async () => {
		// Arrange
		const request: AesRequestDto = new AesRequestDto();
		request.body = null;
		const demoAesCommand: DemoAesCommand = new DemoAesCommand(request);

		// Act
		const result = await demoAesCommandHandler.handle(demoAesCommand);

		// Assert
		expect(result.Success).toBe(false);
		expect(result.StatusCode).toBe(StatusCodes.BAD_REQUEST);
		expect(result.Message).toBe('Invalid request body');
	});

	//node --trace-deprecation --test --test-name-pattern='should_return_false_if_decrypt_service_return_error' --require ts-node/register -r tsconfig-paths/register ./src/modules/demo/tests/unit/index.test.ts
	test(`should_return_false_if_decrypt_service_return_error`, async () => {
		// Arrange
		const request: AesRequestDto = new AesRequestDto();
		request.body = faker.string.alphanumeric(15);
		const demoAesCommand: DemoAesCommand = new DemoAesCommand(request);

		const aesDemoDecryptServiceParameters: IAseDemoDecryptServiceParameters = {
			request: request,
			key: ENCRYPTION_KEY,
		};

		// Set up the stub to return an error
		aesDemoDecryptServiceStub.handleAsync
			.withArgs(aesDemoDecryptServiceParameters)
			.resolves(new Err(new ResultError(StatusCodes.BAD_REQUEST, 'key is null')));

		// Act
		const result = await demoAesCommandHandler.handle(demoAesCommand);

		// Assert
		expect(result.Success).toBe(false);
		expect(result.StatusCode).toBe(StatusCodes.BAD_REQUEST);
		expect(result.Message).toBe('key is null');
		expect(aesDemoDecryptServiceStub.handleAsync.calledOnce).toBe(true);
		expect(
			aesDemoDecryptServiceStub.handleAsync.calledWith(
				sinon.match(aesDemoDecryptServiceParameters)
			)
		).toBe(true);
	});

	//node --trace-deprecation --test --test-name-pattern='should_return_false_if_validation_service_return_error' --require ts-node/register -r tsconfig-paths/register ./src/modules/demo/tests/unit/index.test.ts
	test(`should_return_false_if_validation_service_return_error`, async () => {
		// Arrange
		const request: AesRequestDto = new AesRequestDto();
		request.body = faker.string.alphanumeric(15);
		const demoAesCommand: DemoAesCommand = new DemoAesCommand(request);

		const aesDemoDecryptServiceParameterMock: IAseDemoDecryptServiceParameters = {
			request: request,
			key: ENCRYPTION_KEY,
		};

		const decryptedRequestResultMock: DemoAesRequestDto = new DemoAesRequestDto();
		decryptedRequestResultMock.firstName = faker.person.firstName();
		decryptedRequestResultMock.lastName = faker.person.lastName();

		// Set up the stub to return an error
		aesDemoDecryptServiceStub.handleAsync
			.withArgs(aesDemoDecryptServiceParameterMock)
			.resolves(ok(decryptedRequestResultMock));

		const aesValidationServiceParameterMock: IAseDemoValidationServiceParameters = {
			request: decryptedRequestResultMock,
		};

		aesDemoValidationServiceStub.handleAsync
			.withArgs(aesValidationServiceParameterMock)
			.resolves(new Err(new ResultError(StatusCodes.BAD_REQUEST, 'null')));

		// Act
		const result = await demoAesCommandHandler.handle(demoAesCommand);

		// Assert
		expect(result.Success).toBe(false);
		expect(result.StatusCode).toBe(StatusCodes.BAD_REQUEST);
		expect(result.Message).toBe('null');
		expect(aesDemoDecryptServiceStub.handleAsync.calledOnce).toBe(true);
		expect(
			aesDemoDecryptServiceStub.handleAsync.calledWith(
				sinon.match(aesDemoDecryptServiceParameterMock)
			)
		).toBe(true);
		expect(aesDemoValidationServiceStub.handleAsync.calledOnce).toBe(true);
		expect(
			aesDemoValidationServiceStub.handleAsync.calledWith(
				sinon.match(aesValidationServiceParameterMock)
			)
		).toBe(true);
	});

	//node --trace-deprecation --test --test-name-pattern='should_return_false_if_validation_service_return_error' --require ts-node/register -r tsconfig-paths/register ./src/modules/demo/tests/unit/index.test.ts
	test(`should_return_false_if_validation_service_return_error`, async () => {
		// Arrange
		const request: AesRequestDto = new AesRequestDto();
		request.body = faker.string.alphanumeric(15);
		const demoAesCommand: DemoAesCommand = new DemoAesCommand(request);

		const aesDemoDecryptServiceParameterMock: IAseDemoDecryptServiceParameters = {
			request: request,
			key: ENCRYPTION_KEY,
		};

		const decryptedRequestResultMock: DemoAesRequestDto = new DemoAesRequestDto();
		decryptedRequestResultMock.firstName = faker.person.firstName();
		decryptedRequestResultMock.lastName = faker.person.lastName();

		// Set up the stub to return an error
		aesDemoDecryptServiceStub.handleAsync
			.withArgs(aesDemoDecryptServiceParameterMock)
			.resolves(ok(decryptedRequestResultMock));

		const aesValidationServiceParameterMock: IAseDemoValidationServiceParameters = {
			request: decryptedRequestResultMock,
		};

		aesDemoValidationServiceStub.handleAsync
			.withArgs(aesValidationServiceParameterMock)
			.resolves(new Err(new ResultError(StatusCodes.BAD_REQUEST, 'null')));

		// Act
		const result = await demoAesCommandHandler.handle(demoAesCommand);

		// Assert
		expect(result.Success).toBe(false);
		expect(result.StatusCode).toBe(StatusCodes.BAD_REQUEST);
		expect(result.Message).toBe('null');
		expect(aesDemoDecryptServiceStub.handleAsync.calledOnce).toBe(true);
		expect(
			aesDemoDecryptServiceStub.handleAsync.calledWith(
				sinon.match(aesDemoDecryptServiceParameterMock)
			)
		).toBe(true);
		expect(aesDemoValidationServiceStub.handleAsync.calledOnce).toBe(true);
		expect(
			aesDemoValidationServiceStub.handleAsync.calledWith(
				sinon.match(aesValidationServiceParameterMock)
			)
		).toBe(true);
	});

	//node --trace-deprecation --test --test-name-pattern='should_return_false_if_response_service_return_error' --require ts-node/register -r tsconfig-paths/register ./src/modules/demo/tests/unit/index.test.ts
	test(`should_return_false_if_response_service_return_error`, async () => {
		// Arrange
		const request: AesRequestDto = new AesRequestDto();
		request.body = faker.string.alphanumeric(15);
		const demoAesCommand: DemoAesCommand = new DemoAesCommand(request);

		const aesDemoDecryptServiceParameterMock: IAseDemoDecryptServiceParameters = {
			request: request,
			key: ENCRYPTION_KEY,
		};

		const decryptedRequestResultMock: DemoAesRequestDto = new DemoAesRequestDto();
		decryptedRequestResultMock.firstName = faker.person.firstName();
		decryptedRequestResultMock.lastName = faker.person.lastName();

		// Set up the stub to return an error
		aesDemoDecryptServiceStub.handleAsync
			.withArgs(aesDemoDecryptServiceParameterMock)
			.resolves(ok(decryptedRequestResultMock));

		const aesValidationServiceParameterMock: IAseDemoValidationServiceParameters = {
			request: decryptedRequestResultMock,
		};

		aesDemoValidationServiceStub.handleAsync
			.withArgs(aesValidationServiceParameterMock)
			.resolves(ok(undefined));

		const demoAesResponseDtoMock: DemoAesResponseDto = new DemoAesResponseDto();
		demoAesResponseDtoMock.firstName = decryptedRequestResultMock.firstName;
		demoAesResponseDtoMock.lastName = decryptedRequestResultMock.lastName;

		const aesDemoEncryptResponseServiceParametersMock: IAesDemoEncryptResponseServiceParameters =
			{
				key: ENCRYPTION_KEY,
				response: demoAesResponseDtoMock,
			};

		aesDemoEncryptResponseServiceStub.handleAsync
			.withArgs(aesDemoEncryptResponseServiceParametersMock)
			.resolves(new Err(new ResultError(StatusCodes.BAD_REQUEST, 'null')));

		// Act
		const result = await demoAesCommandHandler.handle(demoAesCommand);

		// Assert
		expect(result.Success).toBe(false);
		expect(result.StatusCode).toBe(StatusCodes.BAD_REQUEST);
		expect(result.Message).toBe('null');
		expect(aesDemoDecryptServiceStub.handleAsync.calledOnce).toBe(true);
		expect(
			aesDemoDecryptServiceStub.handleAsync.calledWith(
				sinon.match(aesDemoDecryptServiceParameterMock)
			)
		).toBe(true);
		expect(aesDemoValidationServiceStub.handleAsync.calledOnce).toBe(true);
		expect(
			aesDemoValidationServiceStub.handleAsync.calledWith(
				sinon.match(aesValidationServiceParameterMock)
			)
		).toBe(true);
		expect(aesDemoEncryptResponseServiceStub.handleAsync.calledOnce).toBe(true);
		expect(
			aesDemoEncryptResponseServiceStub.handleAsync.calledWith(
				sinon.match(aesDemoEncryptResponseServiceParametersMock)
			)
		).toBe(true);
	});

	//node --trace-deprecation --test --test-name-pattern='should_return_true_if_all_service_return_ok' --require ts-node/register -r tsconfig-paths/register ./src/modules/demo/tests/unit/index.test.ts
	test(`should_return_true_if_all_service_return_ok`, async () => {
		// Arrange
		const request: AesRequestDto = new AesRequestDto();
		request.body = faker.string.alphanumeric(15);
		const demoAesCommand: DemoAesCommand = new DemoAesCommand(request);

		const aesDemoDecryptServiceParameterMock: IAseDemoDecryptServiceParameters = {
			request: request,
			key: ENCRYPTION_KEY,
		};

		const decryptedRequestResultMock: DemoAesRequestDto = new DemoAesRequestDto();
		decryptedRequestResultMock.firstName = faker.person.firstName();
		decryptedRequestResultMock.lastName = faker.person.lastName();

		// Set up the stub to return an error
		aesDemoDecryptServiceStub.handleAsync
			.withArgs(aesDemoDecryptServiceParameterMock)
			.resolves(ok(decryptedRequestResultMock));

		const aesValidationServiceParameterMock: IAseDemoValidationServiceParameters = {
			request: decryptedRequestResultMock,
		};

		aesDemoValidationServiceStub.handleAsync
			.withArgs(aesValidationServiceParameterMock)
			.resolves(ok(undefined));

		const demoAesResponseDtoMock: DemoAesResponseDto = new DemoAesResponseDto();
		demoAesResponseDtoMock.firstName = decryptedRequestResultMock.firstName;
		demoAesResponseDtoMock.lastName = decryptedRequestResultMock.lastName;

		const aesDemoEncryptResponseServiceParametersMock: IAesDemoEncryptResponseServiceParameters =
			{
				key: ENCRYPTION_KEY,
				response: demoAesResponseDtoMock,
			};

		const aesResponseDtoMock: AesResponseDto = new AesResponseDto();
		aesResponseDtoMock.body = faker.string.alphanumeric(15);

		aesDemoEncryptResponseServiceStub.handleAsync
			.withArgs(aesDemoEncryptResponseServiceParametersMock)
			.resolves(ok(aesResponseDtoMock));

		// Act
		const result = await demoAesCommandHandler.handle(demoAesCommand);

		// Assert
		expect(result.Success).toBe(true);
		expect(result.StatusCode).toBe(StatusCodes.OK);
		expect(result.Message).toBe('Success');
		expect(aesDemoDecryptServiceStub.handleAsync.calledOnce).toBe(true);
		expect(
			aesDemoDecryptServiceStub.handleAsync.calledWith(
				sinon.match(aesDemoDecryptServiceParameterMock)
			)
		).toBe(true);
		expect(aesDemoValidationServiceStub.handleAsync.calledOnce).toBe(true);
		expect(
			aesDemoValidationServiceStub.handleAsync.calledWith(
				sinon.match(aesValidationServiceParameterMock)
			)
		).toBe(true);
		expect(aesDemoEncryptResponseServiceStub.handleAsync.calledOnce).toBe(true);
		expect(
			aesDemoEncryptResponseServiceStub.handleAsync.calledWith(
				sinon.match(aesDemoEncryptResponseServiceParametersMock)
			)
		).toBe(true);
	});
});
