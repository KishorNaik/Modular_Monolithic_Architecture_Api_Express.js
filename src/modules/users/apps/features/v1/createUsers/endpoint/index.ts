import { StatusCodes } from 'http-status-codes';
import {
	Body,
	Get,
	HttpCode,
	JsonController,
	OnUndefined,
	Post,
	Res,
	UseBefore,
} from 'routing-controllers';
import { Response } from 'express';
import { OpenAPI } from 'routing-controllers-openapi';
import { AesRequestDto } from '@/shared/models/request/aes.RequestDto';
import { RequestData, RequestHandler, requestHandler } from 'mediatr-ts';
import {
	DataResponse as ApiDataResponse,
	DataResponse,
	DataResponseFactory,
} from '@/shared/models/response/data.Response';
import { AesResponseDto } from '@/shared/models/response/aes.ResponseDto';
import { sealed } from '@/shared/utils/decorators/sealed';
import { ENCRYPTION_KEY } from '@/config';
import Container from 'typedi';
import mediatR from '@/shared/medaitR/index';
import { IHashPasswordResult } from '@/shared/services/users/user.HashPassword.Service';
import { getQueryRunner, StatusEnum } from '@kishornaik/mma_db';
import { UserSharedCacheService } from '@/modules/users/shared/cache';
import { ValidationMiddleware } from '@/middlewares/validation.middleware';
import { CreateUserDecryptRequestService } from './services/decryptRequest';
import { CreateUserRequestValidationService } from './services/validationRequest';
import { CreateUserHashPasswordService } from './services/hashPassword';
import { CreateUserKeysService, ICreateUserKeyServiceResult } from './services/keys';
import {
	CreateUserMapEntityService,
	ICreateUserMapEntityServiceResult,
} from './services/mapEntity';
import { CreateUserDbService } from './services/db';
import { CreateUserMapResponseService } from './services/mapResponse';
import { CreateUserEncryptResponseService } from './services/encryptResponse';
import { CreateUserRequestDto, CreateUserResponseDto } from '../contracts';
import { UserCreatedDomainEventService } from '../events/domain/userCreated';

// @region Controller
@JsonController('/api/v1/users')
@OpenAPI({ tags: ['users'] })
export class CreateUserController {
	@Post()
	@OpenAPI({ summary: 'Create User', tags: ['users'] })
	@HttpCode(StatusCodes.OK)
	@OnUndefined(StatusCodes.BAD_REQUEST)
	@UseBefore(ValidationMiddleware(AesRequestDto))
	public async createAsync(@Body() request: AesRequestDto, @Res() res: Response) {
		const response = await mediatR.send(new CreateUserCommand(request));
		return res.status(response.StatusCode).json(response);
	}
}

// @endregion

// @region Command
@sealed
export class CreateUserCommand extends RequestData<ApiDataResponse<AesResponseDto>> {
	private readonly _request: AesRequestDto;

	public constructor(request: AesRequestDto) {
		super();
		this._request = request;
	}

	public get request(): AesRequestDto {
		return this._request;
	}
}
// @endregion

// @region Command Handler

@sealed
@requestHandler(CreateUserCommand)
export class CreateUserCommandHandler
	implements RequestHandler<CreateUserCommand, ApiDataResponse<AesResponseDto>>
{
	private readonly _createUserDecryptRequestService: CreateUserDecryptRequestService;
	private readonly _createUserRequestValidationService: CreateUserRequestValidationService;
	private readonly _createUserHashPasswordService: CreateUserHashPasswordService;
	private readonly _createUserKeysService: CreateUserKeysService;
	private readonly _createUserMapEntityService: CreateUserMapEntityService;
	private readonly _createUserDbService: CreateUserDbService;
	private readonly _userSharedCacheService: UserSharedCacheService;
	private readonly _createUserMapResponseService: CreateUserMapResponseService;
	private readonly _createUserEncryptResponseService: CreateUserEncryptResponseService;

	public constructor() {
		this._createUserDecryptRequestService = Container.get(CreateUserDecryptRequestService);
		this._createUserRequestValidationService = Container.get(
			CreateUserRequestValidationService
		);
		this._createUserHashPasswordService = Container.get(CreateUserHashPasswordService);
		this._createUserKeysService = Container.get(CreateUserKeysService);
		this._createUserMapEntityService = Container.get(CreateUserMapEntityService);
		this._createUserDbService = Container.get(CreateUserDbService);
		this._userSharedCacheService = Container.get(UserSharedCacheService);
		this._createUserMapResponseService = Container.get(CreateUserMapResponseService);
		this._createUserEncryptResponseService = Container.get(CreateUserEncryptResponseService);
	}

	public async handle(value: CreateUserCommand): Promise<ApiDataResponse<AesResponseDto>> {
		const queryRunner = getQueryRunner();
		await queryRunner.connect();
		try {
			if (!value)
				return DataResponseFactory.error(StatusCodes.BAD_REQUEST, 'Invalid command');

			if (!value.request)
				return DataResponseFactory.error(StatusCodes.BAD_REQUEST, 'Invalid request');

			// Decrypt Service
			const createUserDecryptRequestServiceResult =
				await this._createUserDecryptRequestService.handleAsync({
					data: value.request.body,
					key: ENCRYPTION_KEY,
				});
			if (createUserDecryptRequestServiceResult.isErr())
				return DataResponseFactory.error(
					createUserDecryptRequestServiceResult.error.status,
					createUserDecryptRequestServiceResult.error.message
				);

			const createUserRequestDto: CreateUserRequestDto =
				createUserDecryptRequestServiceResult.value;

			// Validation Service
			const createUserRequestValidationServiceResult =
				await this._createUserRequestValidationService.handleAsync({
					dto: createUserRequestDto,
					dtoClass: CreateUserRequestDto,
				});
			if (createUserRequestValidationServiceResult.isErr())
				return DataResponseFactory.error(
					createUserRequestValidationServiceResult.error.status,
					createUserRequestValidationServiceResult.error.message
				);

			// Hash Password
			const createUserHashPasswordServiceResult =
				await this._createUserHashPasswordService.handleAsync({
					password: createUserRequestDto.password,
				});
			if (createUserHashPasswordServiceResult.isErr())
				return DataResponseFactory.error(
					createUserHashPasswordServiceResult.error.status,
					createUserHashPasswordServiceResult.error.message
				);

			const hashPasswordResult: IHashPasswordResult =
				createUserHashPasswordServiceResult.value;

			// Keys
			const createUserKeyServiceResult = await this._createUserKeysService.handleAsync();
			if (createUserKeyServiceResult.isErr())
				return DataResponseFactory.error(
					createUserKeyServiceResult.error.status,
					createUserKeyServiceResult.error.message
				);

			const createUserKeyResult: ICreateUserKeyServiceResult =
				createUserKeyServiceResult.value;

			// Map Entity Service
			const createUserMapEntityServiceResult =
				await this._createUserMapEntityService.handleAsync({
					createUserRequestDto: createUserRequestDto,
					hashPassword: hashPasswordResult,
					keys: createUserKeyResult,
				});
			if (createUserMapEntityServiceResult.isErr())
				return DataResponseFactory.error(
					createUserMapEntityServiceResult.error.status,
					createUserMapEntityServiceResult.error.message
				);

			const entity: ICreateUserMapEntityServiceResult =
				createUserMapEntityServiceResult.value;

			await queryRunner.startTransaction();
			// Db Service
			const createUserDbServiceResult = await this._createUserDbService.handleAsync({
				entity: entity,
				queryRunner: queryRunner,
			});
			if (createUserDbServiceResult.isErr()) {
				await queryRunner.rollbackTransaction();
				return DataResponseFactory.error(
					createUserDbServiceResult.error.status,
					createUserDbServiceResult.error.message
				);
			}

			// Map Response Service
			const createUserMapResponseServiceResult =
				await this._createUserMapResponseService.handleAsync(entity.entity.users);
			if (createUserMapResponseServiceResult.isErr()) {
				await queryRunner.rollbackTransaction();
				return DataResponseFactory.error(
					createUserMapResponseServiceResult.error.status,
					createUserMapResponseServiceResult.error.message
				);
			}

			const createUserResponseDto: CreateUserResponseDto =
				createUserMapResponseServiceResult.value;

			// Encrypt Service
			const createUserEncryptResponseServiceResult =
				await this._createUserEncryptResponseService.handleAsync({
					data: createUserResponseDto,
					key: ENCRYPTION_KEY,
				});
			if (createUserEncryptResponseServiceResult.isErr()) {
				await queryRunner.rollbackTransaction();
				return DataResponseFactory.error(
					createUserEncryptResponseServiceResult.error.status,
					createUserEncryptResponseServiceResult.error.message
				);
			}

			const aesResponseDto: AesResponseDto =
				createUserEncryptResponseServiceResult.value.aesResponseDto;

			// Shared Cache service
			const userCachedSharedServiceResult = await this._userSharedCacheService.handleAsync({
				identifier: createUserResponseDto.identifier,
				status: StatusEnum.INACTIVE,
				queryRunner: queryRunner,
			});
			if (userCachedSharedServiceResult.isErr()) {
				await queryRunner.rollbackTransaction();
				return DataResponseFactory.error(
					userCachedSharedServiceResult.error.status,
					userCachedSharedServiceResult.error.message
				);
			}

			await queryRunner.commitTransaction();

			// Domain Event Service
			// Is Email Verification Notification Integration Event
			await mediatR.publish(
				new UserCreatedDomainEventService(
					entity.entity.users.identifier,
					entity.entity.communication.email,
					`${entity.entity.users.firstName} ${entity.entity.users.lastName}`,
					entity.entity.settings.emailVerificationToken
				)
			);

			return DataResponseFactory.Response(
				true,
				StatusCodes.CREATED,
				aesResponseDto,
				'user created successfully'
			);
		} catch (ex) {
			const error = ex as Error;
			if (queryRunner.isTransactionActive) {
				await queryRunner.rollbackTransaction();
			}
			return DataResponseFactory.error(StatusCodes.INTERNAL_SERVER_ERROR, error.message);
		} finally {
			await queryRunner.release();
		}
	}
}
// @endregion
