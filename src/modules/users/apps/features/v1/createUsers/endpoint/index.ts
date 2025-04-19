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
import { getQueryRunner, initializeDatabase, StatusEnum } from '@kishornaik/mma_db';
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
import {
	IUserCreatedDomainEventQueueJob,
	UserCreatedDomainEventService,
} from '../events/domain/userCreated';
import { logConstruct, logger } from '@/shared/utils/helpers/loggers';
import { backgroundJobAsync } from '@/shared/utils/miscellaneous/jobs/job';
import { publishQueuesAsync, runWorkers, setQueues } from '@/shared/utils/helpers/bullMq/queues';

const userCreatedDomainEventQueues = setQueues('userCreatedDomainEventQueues');

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
			if (createUserDecryptRequestServiceResult.isErr()) {
				logger.error(
					logConstruct(
						`CreateUserCommandHandler`,
						`CreateUserDecryptRequestService`,
						createUserDecryptRequestServiceResult.error.message
					)
				);
				return DataResponseFactory.error(
					createUserDecryptRequestServiceResult.error.status,
					createUserDecryptRequestServiceResult.error.message
				);
			}

			const createUserRequestDto: CreateUserRequestDto =
				createUserDecryptRequestServiceResult.value;

			logger.info(
				logConstruct(
					`CreateUserCommandHandler`,
					`CreateUserDecryptRequestService`,
					`Decrypt Success`
				)
			);

			// Validation Service
			const createUserRequestValidationServiceResult =
				await this._createUserRequestValidationService.handleAsync({
					dto: createUserRequestDto,
					dtoClass: CreateUserRequestDto,
				});
			if (createUserRequestValidationServiceResult.isErr()) {
				logger.error(
					logConstruct(
						`CreateUserCommandHandler`,
						`CreateUserRequestValidationService`,
						createUserRequestValidationServiceResult.error.message
					)
				);
				return DataResponseFactory.error(
					createUserRequestValidationServiceResult.error.status,
					createUserRequestValidationServiceResult.error.message
				);
			}
			logger.info(
				logConstruct(
					`CreateUserCommandHandler`,
					`createUserRequestValidationService`,
					`Validation Success`
				)
			);

			// Hash Password Service
			const createUserHashPasswordServiceResultPromise =this._createUserHashPasswordService.handleAsync({
					password: createUserRequestDto.password,
				});
      // generate keys Service
			const createUserKeyServiceResultPromise = this._createUserKeysService.handleAsync();

      const [createUserHashPasswordServiceResult, createUserKeyServiceResult] =
        await Promise.all([
          createUserHashPasswordServiceResultPromise,
          createUserKeyServiceResultPromise,
        ]);

      // Hash Password Service Result
			if (createUserHashPasswordServiceResult.isErr()) {
				logger.error(
					logConstruct(
						`CreateUserCommandHandler`,
						`CreateUserHashPasswordService`,
						createUserHashPasswordServiceResult.error.message
					)
				);
				return DataResponseFactory.error(
					createUserHashPasswordServiceResult.error.status,
					createUserHashPasswordServiceResult.error.message
				);
			}

			const hashPasswordResult: IHashPasswordResult =
				createUserHashPasswordServiceResult.value;

			logger.info(
				logConstruct(
					`CreateUserCommandHandler`,
					`CreateUserHashPasswordService`,
					`Hash Password Success`
				)
			);

      // Generate Keys Service Result
			if (createUserKeyServiceResult.isErr()) {
				logger.error(
					logConstruct(
						`CreateUserCommandHandler`,
						`CreateUserKeyService`,
						createUserKeyServiceResult.error.message
					)
				);
				return DataResponseFactory.error(
					createUserKeyServiceResult.error.status,
					createUserKeyServiceResult.error.message
				);
			}

			const createUserKeyResult: ICreateUserKeyServiceResult =
				createUserKeyServiceResult.value;

			logger.info(
				logConstruct(
					`CreateUserCommandHandler`,
					`CreateUserKeyService`,
					`Generate Keys Success`
				)
			);

			// Map Entity Service
			const createUserMapEntityServiceResult =
				await this._createUserMapEntityService.handleAsync({
					createUserRequestDto: createUserRequestDto,
					hashPassword: hashPasswordResult,
					keys: createUserKeyResult,
				});
			if (createUserMapEntityServiceResult.isErr()) {
				logger.error(
					logConstruct(
						`CreateUserCommandHandler`,
						`CreateUserMapEntityService`,
						createUserMapEntityServiceResult.error.message
					)
				);
				return DataResponseFactory.error(
					createUserMapEntityServiceResult.error.status,
					createUserMapEntityServiceResult.error.message
				);
			}
			const entity: ICreateUserMapEntityServiceResult =
				createUserMapEntityServiceResult.value;

			logger.info(
				logConstruct(
					`CreateUserCommandHandler`,
					`CreateUserMapEntityService`,
					`Map Entity Success`
				)
			);

			await queryRunner.startTransaction('SERIALIZABLE');
			logger.info(logConstruct(`CreateUserCommandHandler`, `handle`, `Start Transaction`));

			// Db Service
			const createUserDbServiceResult = await this._createUserDbService.handleAsync({
				entity: entity,
				queryRunner: queryRunner,
			});
			if (createUserDbServiceResult.isErr()) {
				logger.error(
					logConstruct(
						`CreateUserCommandHandler`,
						`CreateUserDbService`,
						createUserDbServiceResult.error.message
					)
				);
				await queryRunner.rollbackTransaction();
				logger.warn(
					logConstruct(
						`CreateUserCommandHandler`,
						`CreateUserDbService`,
						`Rollback Transaction`
					)
				);
				return DataResponseFactory.error(
					createUserDbServiceResult.error.status,
					createUserDbServiceResult.error.message
				);
			}

			logger.info(
				logConstruct(
					`CreateUserCommandHandler`,
					`CreateUserDbService`,
					`Db Service Success`
				)
			);

			// Map Response Service
			const createUserMapResponseServiceResult =
				await this._createUserMapResponseService.handleAsync(entity.entity.users);
			if (createUserMapResponseServiceResult.isErr()) {
				logger.error(
					logConstruct(
						`CreateUserCommandHandler`,
						`CreateUserMapResponseService`,
						createUserMapResponseServiceResult.error.message
					)
				);
				await queryRunner.rollbackTransaction();
				logger.warn(
					logConstruct(
						`CreateUserCommandHandler`,
						`CreateUserMapResponseService`,
						`Rollback Transaction`
					)
				);
				return DataResponseFactory.error(
					createUserMapResponseServiceResult.error.status,
					createUserMapResponseServiceResult.error.message
				);
			}

			const createUserResponseDto: CreateUserResponseDto =
				createUserMapResponseServiceResult.value;

			logger.info(
				logConstruct(
					`CreateUserCommandHandler`,
					`CreateUserMapResponseService`,
					`Map Response Success`
				)
			);

			// Encrypt Service
			const createUserEncryptResponseServiceResult =
				await this._createUserEncryptResponseService.handleAsync({
					data: createUserResponseDto,
					key: ENCRYPTION_KEY,
				});
			if (createUserEncryptResponseServiceResult.isErr()) {
				logger.error(
					logConstruct(
						`CreateUserCommandHandler`,
						`CreateUserEncryptResponseService`,
						createUserEncryptResponseServiceResult.error.message
					)
				);
				await queryRunner.rollbackTransaction();
				logger.warn(
					logConstruct(
						`CreateUserCommandHandler`,
						`CreateUserEncryptResponseService`,
						`Rollback Transaction`
					)
				);
				return DataResponseFactory.error(
					createUserEncryptResponseServiceResult.error.status,
					createUserEncryptResponseServiceResult.error.message
				);
			}

			const aesResponseDto: AesResponseDto =
				createUserEncryptResponseServiceResult.value.aesResponseDto;
			logger.info(
				logConstruct(
					`CreateUserCommandHandler`,
					`CreateUserEncryptResponseService`,
					`Encrypt Success`
				)
			);

			// Update Cache service
			const userCachedSharedServiceResult = await this._userSharedCacheService.handleAsync({
				identifier: createUserResponseDto.identifier,
				status: StatusEnum.INACTIVE,
				queryRunner: queryRunner,
			});
			if (userCachedSharedServiceResult.isErr()) {
				logger.error(
					logConstruct(
						`CreateUserCommandHandler`,
						`UserSharedCacheService`,
						userCachedSharedServiceResult.error.message
					)
				);
				await queryRunner.rollbackTransaction();
				logger.warn(
					logConstruct(
						`CreateUserCommandHandler`,
						`UserSharedCacheService`,
						`Rollback Transaction`
					)
				);
				return DataResponseFactory.error(
					userCachedSharedServiceResult.error.status,
					userCachedSharedServiceResult.error.message
				);
			}
			logger.info(
				logConstruct(
					`CreateUserCommandHandler`,
					`UserSharedCacheService`,
					`Update Cache Success`
				)
			);

			await queryRunner.commitTransaction();

			logger.info(logConstruct(`CreateUserCommandHandler`, `handle`, `Commit Transaction`));

			// Domain Event Service (Background Job)
			// Is Email Verification Notification Integration Event
			await publishQueuesAsync(userCreatedDomainEventQueues, `send-email-verification`, {
				identifier: entity.entity.users.identifier,
				email: entity.entity.communication.email,
				fullName: `${entity.entity.users.firstName} ${entity.entity.users.lastName}`,
				token: entity.entity.settings.emailVerificationToken,
			} as IUserCreatedDomainEventQueueJob);

			return DataResponseFactory.Response(
				true,
				StatusCodes.CREATED,
				aesResponseDto,
				'user created successfully'
			);
		} catch (ex) {
			const error = ex as Error;
			logger.error(logConstruct(`CreateUserCommandHandler`, `handle`, error.message, ex));
			if (queryRunner.isTransactionActive) {
				await queryRunner.rollbackTransaction();
				logger.warn(
					logConstruct(`CreateUserCommandHandler`, `handle`, `Rollback Transaction`)
				);
			}
			return DataResponseFactory.error(StatusCodes.INTERNAL_SERVER_ERROR, error.message);
		} finally {
			await queryRunner.release();
			logger.info(logConstruct(`CreateUserCommandHandler`, `handle`, `Release Transaction`));
		}
	}
}
// @endregion

// @endregion set Workers
const userCreatedDomainEventWorkers = runWorkers(`userCreatedDomainEventQueues`, async (job) => {
	logger.info(logConstruct('userCreatedDomainEventWorkers', 'worker', `Job:${job.id}: started`));

	const jobData = job.data as IUserCreatedDomainEventQueueJob;

	logger.info(
		logConstruct(
			'userCreatedDomainEventWorkers',
			'worker',
			`Job for UserId:${jobData.identifier}`
		)
	);

	await mediatR.publish(
		new UserCreatedDomainEventService(
			jobData.identifier,
			jobData.email,
			jobData.fullName,
			jobData.token
		)
	);

	logger.info(
		logConstruct(
			`CreateUserCommandHandler`,
			`UserCreatedDomainEventService`,
			`Domain Event Success`
		)
	);
});

// Handle errors
userCreatedDomainEventWorkers.on('failed', (job, err) => {
	logger.error(
		logConstruct(
			'userCreatedDomainEventWorkers',
			'worker',
			`Job:${job.id} failed for UserId:${job.data?.identifier}`,
			err
		)
	);
});
// @endregion
