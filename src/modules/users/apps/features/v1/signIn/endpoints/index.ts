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
import {
	getQueryRunner,
	initializeDatabase,
	StatusEnum,
	UserEntity,
	UserKeysEntity,
} from '@kishornaik/mma_db';
import { ValidationMiddleware } from '@/middlewares/validation.middleware';
import { UserSignInRequestDto, UserSignInResponseDto } from '../contracts';
import { logConstruct, logger } from '@/shared/utils/helpers/loggers';
import { UserSignInDecryptRequestService } from './services/decryptRequest';
import Container from 'typedi';
import { ENCRYPTION_KEY } from '@/config';
import mediatR from '@/shared/medaitR/index';
import { UserSignInRequestDtoValidationService } from './services/validations';
import { GetUsersByEmailIdService } from '@/modules/users/shared/services/getUsersByEmailId';
import { IUsers } from '@/modules/users/shared/types';
import { UserSignInValidateCredentialsService } from './services/validateUserCred';
import { JwtService } from '@/shared/services/users/userJwt.Service';
import {
	IUserSignInGenerateJwtAndRefreshTokenServiceResult,
	UserSignInGenerateJwtAndRefreshTokenService,
} from './services/generateJwtAndRefresh';
import { RoleEnum } from '@/shared/models/enums/role.enum';
import { MapUserSignInEntityService } from './services/mapEntity';
import { UserSignInUpdateDbService } from './services/db';
import { UserSharedCacheService } from '@/modules/users/shared/cache';
import { MapUserSignInResponseService } from './services/mapResponse';
import { UserSignInEncryptResponseService } from './services/encryptResponse';

// @region Controller
@JsonController('/api/v1/users')
@OpenAPI({ tags: ['users'] })
export class UserSignInController {
	@Post('/sign-in')
	@OpenAPI({ summary: 'User Sign In', tags: ['users'] })
	@HttpCode(StatusCodes.OK)
	@OnUndefined(StatusCodes.BAD_REQUEST)
	@UseBefore(ValidationMiddleware(AesRequestDto))
	public async signInAsync(@Body() request: AesRequestDto, @Res() res: Response) {
		const response = await mediatR.send(new UserSignInCommand(request));
		return res.status(response.StatusCode).json(response);
	}
}
// @endregion

// @region Command
class UserSignInCommand extends RequestData<ApiDataResponse<AesResponseDto>> {
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
@requestHandler(UserSignInCommand)
class UserSignInCommandHandler
	implements RequestHandler<UserSignInCommand, ApiDataResponse<AesResponseDto>>
{
	private readonly _userSignInDecryptRequestService: UserSignInDecryptRequestService;
	private readonly _userSignRequestValidationService: UserSignInRequestDtoValidationService;
	private readonly _getUserByEmailIdService: GetUsersByEmailIdService;
	private readonly _userSignInValidateCredentialsService: UserSignInValidateCredentialsService;
	private readonly _userSignInGenerateJwtAndRefreshTokenService: UserSignInGenerateJwtAndRefreshTokenService;
	private readonly _mapUserSignInEntityService: MapUserSignInEntityService;
	private readonly _userSignInUpdateDbService: UserSignInUpdateDbService;
	private readonly _userSharedCacheService: UserSharedCacheService;
	private readonly _mapUserSignInResponseService: MapUserSignInResponseService;
	private readonly _userSignInEncryptResponseService: UserSignInEncryptResponseService;

	public constructor() {
		this._userSignInDecryptRequestService = Container.get(UserSignInDecryptRequestService);
		this._userSignRequestValidationService = Container.get(
			UserSignInRequestDtoValidationService
		);
		this._getUserByEmailIdService = Container.get(GetUsersByEmailIdService);
		this._userSignInValidateCredentialsService = Container.get(
			UserSignInValidateCredentialsService
		);
		this._userSignInGenerateJwtAndRefreshTokenService = Container.get(
			UserSignInGenerateJwtAndRefreshTokenService
		);
		this._mapUserSignInEntityService = Container.get(MapUserSignInEntityService);
		this._userSignInUpdateDbService = Container.get(UserSignInUpdateDbService);
		this._userSharedCacheService = Container.get(UserSharedCacheService);
		this._mapUserSignInResponseService = Container.get(MapUserSignInResponseService);
		this._userSignInEncryptResponseService = Container.get(UserSignInEncryptResponseService);
	}

	public async handle(value: UserSignInCommand): Promise<ApiDataResponse<AesResponseDto>> {
		const queryRunner = getQueryRunner();
		await queryRunner.connect();
		try {
			// @Guard
			if (!value)
				return DataResponseFactory.error(StatusCodes.BAD_REQUEST, 'Invalid Command');

			if (!value.request)
				return DataResponseFactory.error(StatusCodes.BAD_REQUEST, 'Invalid Request');

			const request: AesRequestDto = value.request;

			// Request Decrypt Service
			const userSignInDecryptRequestServiceResult =
				await this._userSignInDecryptRequestService.handleAsync({
					data: request.body,
					key: ENCRYPTION_KEY,
				});
			if (userSignInDecryptRequestServiceResult.isErr()) {
				logger.error(
					logConstruct(
						`UserSignInCommandHandler`,
						`UserSignInDecryptRequestService`,
						userSignInDecryptRequestServiceResult.error.message
					)
				);
				return DataResponseFactory.error(
					userSignInDecryptRequestServiceResult.error.status,
					userSignInDecryptRequestServiceResult.error.message
				);
			}

			const userSignInRequestDto: UserSignInRequestDto =
				userSignInDecryptRequestServiceResult.value;
			logger.info(
				logConstruct(
					`UserSignInCommandHandler`,
					`UserSignInDecryptRequestService`,
					`Decrypt Success`
				)
			);

			// Validation Service
			const userSignInValidationServiceResult =
				await this._userSignRequestValidationService.handleAsync({
					dto: userSignInRequestDto,
					dtoClass: UserSignInRequestDto,
				});
			if (userSignInValidationServiceResult.isErr()) {
				logger.error(
					logConstruct(
						`UserSignInCommandHandler`,
						`UserSignRequestValidationService`,
						userSignInValidationServiceResult.error.message
					)
				);
				return DataResponseFactory.error(
					userSignInValidationServiceResult.error.status,
					userSignInValidationServiceResult.error.message
				);
			}
			logger.info(
				logConstruct(
					`UserSignInCommandHandler`,
					`UserSignRequestValidationService`,
					`Validation Success`
				)
			);

			// get users data by email
			const getUserByEmailIdServiceResult = await this._getUserByEmailIdService.handleAsync({
				emailId: userSignInRequestDto.userName,
			});
			if (getUserByEmailIdServiceResult.isErr()) {
				logger.error(
					logConstruct(
						`UserSignInCommandHandler`,
						`GetUserByEmailIdService`,
						getUserByEmailIdServiceResult.error.message
					)
				);
				const error = getUserByEmailIdServiceResult.error;
				if (error.status === StatusCodes.NOT_FOUND)
					return DataResponseFactory.error(
						StatusCodes.UNAUTHORIZED,
						`username and password is incorrect`
					);
				return DataResponseFactory.error(error.status, error.message);
			}
			let users: IUsers = getUserByEmailIdServiceResult.value;
			logger.info(
				logConstruct(
					`UserSignInCommandHandler`,
					`GetUserByEmailIdService`,
					`Get User By EmailId Success`
				)
			);

			// is User Valid (Check User Status, Check password with Hash Password)
			const userSignInValidateCredentialsServiceResult =
				await this._userSignInValidateCredentialsService.handleAsync({
					users: users,
					rawPassword: userSignInRequestDto.password,
				});
			if (userSignInValidateCredentialsServiceResult.isErr()) {
				logger.error(
					logConstruct(
						`UserSignInCommandHandler`,
						`UserSignInValidateCredentialsService`,
						userSignInValidateCredentialsServiceResult.error.message
					)
				);
				return DataResponseFactory.error(
					userSignInValidateCredentialsServiceResult.error.status,
					userSignInValidateCredentialsServiceResult.error.message
				);
			}
			logger.info(
				logConstruct(
					`UserSignInCommandHandler`,
					`UserSignInValidateCredentialsService`,
					`Validate Credentials Success`
				)
			);

			// Generate JWT and Refresh Token
			const userSignInGenerateJwtAndRefreshTokenServiceResult =
				await this._userSignInGenerateJwtAndRefreshTokenService.handleAsync({
					role: RoleEnum.USER,
					userId: users.identifier,
				});
			if (userSignInGenerateJwtAndRefreshTokenServiceResult.isErr()) {
				logger.error(
					logConstruct(
						`UserSignInCommandHandler`,
						`UserSignInGenerateJwtAndRefreshTokenService`,
						userSignInGenerateJwtAndRefreshTokenServiceResult.error.message
					)
				);
				return DataResponseFactory.error(
					userSignInGenerateJwtAndRefreshTokenServiceResult.error.status,
					userSignInGenerateJwtAndRefreshTokenServiceResult.error.message
				);
			}

			const userSignInGenerateJwtAndRefreshTokenResult: IUserSignInGenerateJwtAndRefreshTokenServiceResult =
				userSignInGenerateJwtAndRefreshTokenServiceResult.value;
			logger.info(
				logConstruct(
					`UserSignInCommandHandler`,
					`userSignInGenerateJwtAndRefreshTokenResult`,
					`Generate JWT and Refresh Token Success`
				)
			);

			// Map Entity Service
			const mapUserSignInEntityServiceResult =
				await this._mapUserSignInEntityService.handleAsync({
					users: users,
					refreshToken: userSignInGenerateJwtAndRefreshTokenResult.refreshToken,
				});
			if (mapUserSignInEntityServiceResult.isErr()) {
				logger.error(
					logConstruct(
						`UserSignInCommandHandler`,
						`MapUserSignInEntityService`,
						mapUserSignInEntityServiceResult.error.message
					)
				);
				return DataResponseFactory.error(
					mapUserSignInEntityServiceResult.error.status,
					mapUserSignInEntityServiceResult.error.message
				);
			}
			const userEntity: UserEntity = mapUserSignInEntityServiceResult.value.entity.userEntity;
			const keysEntity: UserKeysEntity = mapUserSignInEntityServiceResult.value.entity.keys;

			logger.info(
				logConstruct(
					`UserSignInCommandHandler`,
					`MapUserSignInEntityService`,
					`Map Entity Success`
				)
			);

			// Update User Refresh Token Service
			await queryRunner.startTransaction();
			const updateUserRefreshTokenServiceResult =
				await this._userSignInUpdateDbService.handleAsync({
					entity: {
						userEntity: userEntity,
						userKeys: keysEntity,
					},
					queryRunner: queryRunner,
				});
			if (updateUserRefreshTokenServiceResult.isErr()) {
				logger.error(
					logConstruct(
						`UserSignInCommandHandler`,
						`UserSignInUpdateDbService`,
						updateUserRefreshTokenServiceResult.error.message
					)
				);

				await queryRunner.rollbackTransaction();

				logger.error(
					logConstruct(
						`UserSignInCommandHandler`,
						`UserSignInUpdateDbService`,
						`Rollback Transaction`
					)
				);
				return DataResponseFactory.error(
					updateUserRefreshTokenServiceResult.error.status,
					updateUserRefreshTokenServiceResult.error.message
				);
			}

			// Update User Cache Data Service
			const userSharedCacheServiceResult = await this._userSharedCacheService.handleAsync({
				identifier: userEntity.identifier,
				status: userEntity.status,
				queryRunner: queryRunner,
			});
			if (userSharedCacheServiceResult.isErr()) {
				logger.error(
					logConstruct(
						`UserSignInCommandHandler`,
						`UserSignInUpdateDbService`,
						userSharedCacheServiceResult.error.message
					)
				);

				await queryRunner.rollbackTransaction();

				logger.error(
					logConstruct(
						`UserSignInCommandHandler`,
						`userSharedCacheServiceResult`,
						`Rollback Transaction`
					)
				);
				return DataResponseFactory.error(
					userSharedCacheServiceResult.error.status,
					userSharedCacheServiceResult.error.message
				);
			}
			users = userSharedCacheServiceResult.value.users;

			// Map Response Service
			const mapUserSignInResponseServiceResult =
				await this._mapUserSignInResponseService.handleAsync({
					token: {
						accessToken: userSignInGenerateJwtAndRefreshTokenResult.accessToken,
						refreshToken: userSignInGenerateJwtAndRefreshTokenResult.refreshToken,
					},
					users: users,
				});
			if (mapUserSignInResponseServiceResult.isErr()) {
				logger.error(
					logConstruct(
						`UserSignInCommandHandler`,
						`MapUserSignInResponseService`,
						mapUserSignInResponseServiceResult.error.message
					)
				);
				await queryRunner.rollbackTransaction();
				logger.error(
					logConstruct(
						`UserSignInCommandHandler`,
						`mapUserSignInResponseService`,
						`Rollback Transaction`
					)
				);
				return DataResponseFactory.error(
					mapUserSignInResponseServiceResult.error.status,
					mapUserSignInResponseServiceResult.error.message
				);
			}

			const userSignInResponseDto: UserSignInResponseDto =
				mapUserSignInResponseServiceResult.value;

			//Encrypt Response
			const userSignInEncryptRequestServiceResult =
				await this._userSignInEncryptResponseService.handleAsync({
					data: userSignInResponseDto,
					key: ENCRYPTION_KEY,
				});
			if (userSignInEncryptRequestServiceResult.isErr()) {
				logger.error(
					logConstruct(
						`UserSignInCommandHandler`,
						`userSignInEncryptRequestService`,
						userSignInEncryptRequestServiceResult.error.message
					)
				);
				await queryRunner.rollbackTransaction();
				logger.error(
					logConstruct(
						`UserSignInCommandHandler`,
						`userSignInEncryptRequestService`,
						`Rollback Transaction`
					)
				);
				return DataResponseFactory.error(
					userSignInEncryptRequestServiceResult.error.status,
					userSignInEncryptRequestServiceResult.error.message
				);
			}

			const aesResponseDto: AesResponseDto =
				userSignInEncryptRequestServiceResult.value.aesResponseDto;

			await queryRunner.commitTransaction();
			// return
			return DataResponseFactory.Response(true, StatusCodes.OK, aesResponseDto);
		} catch (ex) {
			const error = ex as Error;
			logger.error(logConstruct(`UserSignInCommandHandler`, `handle`, error.message, ex));
			if (queryRunner.isTransactionActive) {
				await queryRunner.rollbackTransaction();
				logger.warn(
					logConstruct(`UserSignInCommandHandler`, `handle`, `Rollback Transaction`)
				);
			}
			return DataResponseFactory.error(StatusCodes.INTERNAL_SERVER_ERROR, error.message);
		} finally {
			await queryRunner.release();
			logger.info(logConstruct(`UserSignInCommandHandler`, `handle`, `Release Transaction`));
		}
	}
}

// @endregion
