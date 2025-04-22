import { StatusCodes } from 'http-status-codes';
import {
	Body,
	Get,
	HttpCode,
	JsonController,
	OnUndefined,
	Param,
	Patch,
	Put,
	Req,
	Res,
	UseBefore,
} from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';
import { Response, Request } from 'express';
import {
	DataResponse as ApiDataResponse,
	DataResponse,
	DataResponseFactory,
} from '@/shared/models/response/data.Response';
import { RequestData, RequestHandler, requestHandler } from 'mediatr-ts';
import medaitR from '@/shared/medaitR';
import { sealed } from '@/shared/utils/decorators/sealed';
import { AesResponseDto } from '@/shared/models/response/aes.ResponseDto';
import Container from 'typedi';
import { logConstruct, logger } from '@/shared/utils/helpers/loggers';
import { authenticateHmac } from '@/middlewares/hmac.middlware';
import { authorizeRole } from '@/middlewares/auth.middleware';
import { ValidationMiddleware } from '@/middlewares/validation.middleware';
import { AesRequestDto } from '@/shared/models/request/aes.RequestDto';
import { getQueryRunner } from '@kishornaik/mma_db';
import { RefreshTokenDecryptRequestService } from './services/decryptRequest';
import { UserTokenProviderService } from '@/shared/services/users/userTokenProvider.service';
import { GetAesTokenService } from '@/modules/users/shared/services/getAesToken';
import { GetUsersByClientIdService } from '@/modules/users/shared/services/getUserByClientId';
import { IUsers } from '@/modules/users/shared/types';
import { RefreshTokenRequestDto, RefreshTokenResponseDto } from '../contracts';
import { UpdateRefreshTokenRequestValidationService } from './services/validations';
import { IsValidJwtAndRefreshTokenService } from './services/isValidJwtAndRefreshToken';
import {
	IUserSignInGenerateJwtAndRefreshTokenServiceResult,
	UserSignInGenerateJwtAndRefreshTokenService,
} from '@/modules/users/shared/services/generateJwtAndRefresh';
import { RoleEnum } from '@/shared/models/enums/role.enum';
import {
	IMapRefreshTokenUserEntityServiceResults,
	MapRefreshTokenUserEntityService,
} from '@/modules/users/shared/services/mapRefrehToken';
import { UpdateRefreshTokenDbService } from '@/modules/users/shared/services/updateRefreshToken';
import { UserSharedCacheService } from '@/modules/users/shared/cache';
import { MapUpdateRefreshTokenResponseService } from './services/mapResponse';
import { UpdateRefreshTokenEncryptResponseService } from './services/encryptResponse';

// @region Controller
@JsonController('/api/v1/users')
@OpenAPI({ tags: ['users'] })
export class UpdateRefreshTokenController {
	@Patch('/refresh-token')
	@OpenAPI({ summary: `update refresh token`, tags: ['users'] })
	@HttpCode(StatusCodes.OK)
	@OnUndefined(StatusCodes.NOT_FOUND)
	@OnUndefined(StatusCodes.BAD_REQUEST)
	@UseBefore(authenticateHmac,ValidationMiddleware(AesRequestDto))
	public async updateRefreshToken(
		@Body() request: AesRequestDto,
		@Req() req: Request,
		@Res() res: Response
	) {
		const response = await medaitR.send(new UpdateRefreshTokenCommand(request, req));
		return res.status(response.StatusCode).json(response);
	}
}

// @endregion

// @region Command
class UpdateRefreshTokenCommand extends RequestData<ApiDataResponse<AesResponseDto>> {
	private readonly _request: AesRequestDto;
	private readonly _expressRequest: Request;

	public constructor(request: AesRequestDto, expressRequest: Request) {
		super();
		this._request = request;
		this._expressRequest = expressRequest;
	}

	public get request(): AesRequestDto {
		return this._request;
	}

	public get expressRequest(): Request {
		return this._expressRequest;
	}
}
// @endregion

// @region Command Handler
@sealed
@requestHandler(UpdateRefreshTokenCommand)
class UpdateRefreshTokenCommandHandler
	implements RequestHandler<UpdateRefreshTokenCommand, ApiDataResponse<AesResponseDto>>
{
	private readonly _getUsersByClientIdService: GetUsersByClientIdService;
	private readonly _refreshTokenDecryptRequestService: RefreshTokenDecryptRequestService;
	private readonly _updateRefreshTokenRequestValidationService: UpdateRefreshTokenRequestValidationService;
	private readonly _isValidJwtAndRefreshTokenService: IsValidJwtAndRefreshTokenService;
	private readonly _userSignInGenerateJwtAndRefreshTokenService: UserSignInGenerateJwtAndRefreshTokenService;
	private readonly _mapRefreshTokenUserEntityService: MapRefreshTokenUserEntityService;
	private readonly _updateRefreshTokenDbService: UpdateRefreshTokenDbService;
	private readonly _userSharedCacheService = Container.get(UserSharedCacheService);
	private readonly _mapUpdateRefreshTokenResponseService: MapUpdateRefreshTokenResponseService;
	private readonly _updateRefreshTokenEncryptResponseService: UpdateRefreshTokenEncryptResponseService;

	public constructor() {
		this._getUsersByClientIdService = Container.get(GetUsersByClientIdService);
		this._refreshTokenDecryptRequestService = Container.get(RefreshTokenDecryptRequestService);
		this._updateRefreshTokenRequestValidationService = Container.get(
			UpdateRefreshTokenRequestValidationService
		);
		this._isValidJwtAndRefreshTokenService = Container.get(IsValidJwtAndRefreshTokenService);
		this._userSignInGenerateJwtAndRefreshTokenService = Container.get(
			UserSignInGenerateJwtAndRefreshTokenService
		);
		this._mapRefreshTokenUserEntityService = Container.get(MapRefreshTokenUserEntityService);
		this._updateRefreshTokenDbService = Container.get(UpdateRefreshTokenDbService);
		this._userSharedCacheService = Container.get(UserSharedCacheService);
		this._mapUpdateRefreshTokenResponseService = Container.get(
			MapUpdateRefreshTokenResponseService
		);
		this._updateRefreshTokenEncryptResponseService = Container.get(
			UpdateRefreshTokenEncryptResponseService
		);
	}

	public async handle(
		value: UpdateRefreshTokenCommand
	): Promise<ApiDataResponse<AesResponseDto>> {
		const queryRunner = getQueryRunner();
		await queryRunner.connect();
		try {
			if (!value)
				return DataResponseFactory.error(StatusCodes.BAD_REQUEST, 'Invalid command');

			if (!value.request)
				return DataResponseFactory.error(StatusCodes.BAD_REQUEST, 'Invalid request');

			if (!value.expressRequest)
				return DataResponseFactory.error(StatusCodes.BAD_REQUEST, 'Invalid expressRequest');

			// Get Client Id from header
			const clientId = value.expressRequest.headers['x-client-id'] as string;
			if (!clientId)
				return DataResponseFactory.error(StatusCodes.UNAUTHORIZED, `Client Id is required`);

			// Get Users
			const getUsersByClientIdServiceResult =
				await this._getUsersByClientIdService.handleAsync({
					clientId: clientId,
				});
			if (getUsersByClientIdServiceResult.isErr()) {
				logger.error(
					logConstruct(
						`UpdateRefreshTokenCommandHandler`,
						`GetUsersByClientIdService`,
						getUsersByClientIdServiceResult.error.message
					)
				);
				return DataResponseFactory.error(
					getUsersByClientIdServiceResult.error.status,
					getUsersByClientIdServiceResult.error.message
				);
			}

			let users: IUsers = getUsersByClientIdServiceResult.value;
			logger.info(
				logConstruct(
					`UpdateRefreshTokenCommandHandler`,
					`GetUsersByClientIdService`,
					`Get User By Client Id Success`
				)
			);

			// Get Aes Token
			const aesToken: string = users.keys.aesSecretKey;

			// Decrypt Service
			const refreshTokenDecryptRequestServiceResult =
				await this._refreshTokenDecryptRequestService.handleAsync({
					data: value.request.body,
					key: aesToken,
				});
			if (refreshTokenDecryptRequestServiceResult.isErr()) {
				logger.error(
					logConstruct(
						`UpdateRefreshTokenCommandHandler`,
						`RefreshTokenDecryptRequestService`,
						refreshTokenDecryptRequestServiceResult.error.message
					)
				);

				return DataResponseFactory.error(
					refreshTokenDecryptRequestServiceResult.error.status,
					refreshTokenDecryptRequestServiceResult.error.message
				);
			}

			const request: RefreshTokenRequestDto = refreshTokenDecryptRequestServiceResult.value;
			logger.info(
				logConstruct(
					`UpdateRefreshTokenCommandHandler`,
					`RefreshTokenDecryptRequestService`,
					`Refresh Token Decrypt Success`
				)
			);

			// Validation Service
			const updateRefreshTokenRequestValidationServiceResult =
				await this._updateRefreshTokenRequestValidationService.handleAsync({
					dto: request,
					dtoClass: RefreshTokenRequestDto,
				});
			if (updateRefreshTokenRequestValidationServiceResult.isErr()) {
				logger.error(
					logConstruct(
						`UpdateRefreshTokenCommandHandler`,
						`UpdateRefreshTokenRequestValidationService`,
						updateRefreshTokenRequestValidationServiceResult.error.message
					)
				);
				return DataResponseFactory.error(
					updateRefreshTokenRequestValidationServiceResult.error.status,
					updateRefreshTokenRequestValidationServiceResult.error.message
				);
			}
			logger.info(
				logConstruct(
					`UpdateRefreshTokenCommandHandler`,
					`UpdateRefreshTokenRequestValidationService`,
					`Update Refresh Token Request Validation Success`
				)
			);

			// Is Valid Token
			const isValidJwtAndRefreshTokenServiceResult =
				await this._isValidJwtAndRefreshTokenService.handleAsync({
					token: request,
					users: users,
				});
			if (isValidJwtAndRefreshTokenServiceResult.isErr()) {
				logger.error(
					logConstruct(
						`UpdateRefreshTokenCommandHandler`,
						`IsValidJwtAndRefreshTokenService`,
						isValidJwtAndRefreshTokenServiceResult.error.message
					)
				);
				return DataResponseFactory.error(
					isValidJwtAndRefreshTokenServiceResult.error.status,
					isValidJwtAndRefreshTokenServiceResult.error.message
				);
			}
			logger.info(
				logConstruct(
					`UpdateRefreshTokenCommandHandler`,
					`IsValidJwtAndRefreshTokenService`,
					`Is Valid Jwt And Refresh Token Success`
				)
			);

			// Generate Jwt and Refresh Token
			const userSignInGenerateJwtAndRefreshTokenServiceResult =
				await this._userSignInGenerateJwtAndRefreshTokenService.handleAsync({
					userId: users.identifier,
					role: RoleEnum.USER,
				});
			if (userSignInGenerateJwtAndRefreshTokenServiceResult.isErr()) {
				logger.error(
					logConstruct(
						`UpdateRefreshTokenCommandHandler`,
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
					`UpdateRefreshTokenCommandHandler`,
					`UserSignInGenerateJwtAndRefreshTokenService`,
					`User Sign In Generate Jwt And Refresh Token Success`
				)
			);

			// Map Entity
			const mapRefreshTokenUserEntityServiceResult =
				await this._mapRefreshTokenUserEntityService.handleAsync({
					users: users,
					refreshToken: userSignInGenerateJwtAndRefreshTokenResult.refreshToken,
				});
			if (mapRefreshTokenUserEntityServiceResult.isErr()) {
				logger.error(
					logConstruct(
						`UpdateRefreshTokenCommandHandler`,
						`MapRefreshTokenUserEntityService`,
						mapRefreshTokenUserEntityServiceResult.error.message
					)
				);
				return DataResponseFactory.error(
					mapRefreshTokenUserEntityServiceResult.error.status,
					mapRefreshTokenUserEntityServiceResult.error.message
				);
			}

			const mapRefreshTokenUserEntityResult: IMapRefreshTokenUserEntityServiceResults =
				mapRefreshTokenUserEntityServiceResult.value;
			logger.info(
				logConstruct(
					`UpdateRefreshTokenCommandHandler`,
					`MapRefreshTokenUserEntityService`,
					`Map Refresh Token User Entity Success`
				)
			);

			// Update Refresh Token
			await queryRunner.startTransaction();
			const updateRefreshTokenDbServiceResult =
				await this._updateRefreshTokenDbService.handleAsync({
					entity: {
						userEntity: mapRefreshTokenUserEntityResult.entity.userEntity,
						userKeys: mapRefreshTokenUserEntityResult.entity.keys,
					},
					queryRunner: queryRunner,
				});
			if (updateRefreshTokenDbServiceResult.isErr()) {
				logger.error(
					logConstruct(
						`UpdateRefreshTokenCommandHandler`,
						`UpdateRefreshTokenDbService`,
						updateRefreshTokenDbServiceResult.error.message
					)
				);

				await queryRunner.rollbackTransaction();
				logger.warn(
					logConstruct(
						`UpdateRefreshTokenCommandHandler`,
						`UpdateRefreshTokenDbService`,
						`Rollback Transaction`
					)
				);

				return DataResponseFactory.error(
					updateRefreshTokenDbServiceResult.error.status,
					updateRefreshTokenDbServiceResult.error.message
				);
			}
			logger.info(
				logConstruct(
					`UpdateRefreshTokenCommandHandler`,
					`UpdateRefreshTokenDbService`,
					`Update Refresh Token Success`
				)
			);

			// Update Cache
			const userSharedCacheServiceResult = await this._userSharedCacheService.handleAsync({
				identifier: mapRefreshTokenUserEntityResult.entity.userEntity.identifier,
				status: mapRefreshTokenUserEntityResult.entity.userEntity.status,
				queryRunner: queryRunner,
			});
			if (userSharedCacheServiceResult.isErr()) {
				logger.error(
					logConstruct(
						`UpdateRefreshTokenCommandHandler`,
						`UserSharedCacheService`,
						userSharedCacheServiceResult.error.message
					)
				);

				await queryRunner.rollbackTransaction();
				logger.warn(
					logConstruct(
						`UpdateRefreshTokenCommandHandler`,
						`UserSharedCacheService`,
						`Rollback Transaction`
					)
				);

				return DataResponseFactory.error(
					userSharedCacheServiceResult.error.status,
					userSharedCacheServiceResult.error.message
				);
			}
			users = userSharedCacheServiceResult.value.users;
			logger.info(
				logConstruct(
					`UpdateRefreshTokenCommandHandler`,
					`UserSharedCacheService`,
					`User Shared Cache Success`
				)
			);

			// Map Response
			const mapUpdateRefreshTokenResponseServiceResult =
				await this._mapUpdateRefreshTokenResponseService.handleAsync(
					userSignInGenerateJwtAndRefreshTokenResult
				);
			if (mapUpdateRefreshTokenResponseServiceResult.isErr()) {
				logger.error(
					logConstruct(
						`UpdateRefreshTokenCommandHandler`,
						`MapUpdateRefreshTokenResponseService`,
						mapUpdateRefreshTokenResponseServiceResult.error.message
					)
				);

				await queryRunner.rollbackTransaction();

				logger.warn(
					logConstruct(
						`UpdateRefreshTokenCommandHandler`,
						`MapUpdateRefreshTokenResponseService`,
						`Rollback Transaction`
					)
				);

				return DataResponseFactory.error(
					mapUpdateRefreshTokenResponseServiceResult.error.status,
					mapUpdateRefreshTokenResponseServiceResult.error.message
				);
			}

			const refreshTokenResponseDto: RefreshTokenResponseDto =
				mapUpdateRefreshTokenResponseServiceResult.value;
			logger.info(
				logConstruct(
					`UpdateRefreshTokenCommandHandler`,
					`MapUpdateRefreshTokenResponseService`,
					`Map Update Refresh Token Response Success`
				)
			);

			// Encrypt Response
			const updateRefreshTokenEncryptResponseServiceResult =
				await this._updateRefreshTokenEncryptResponseService.handleAsync({
					data: refreshTokenResponseDto,
					key: users.keys.aesSecretKey,
				});
			if (updateRefreshTokenEncryptResponseServiceResult.isErr()) {
				logger.error(
					logConstruct(
						`UpdateRefreshTokenCommandHandler`,
						`UpdateRefreshTokenEncryptResponseService`,
						updateRefreshTokenEncryptResponseServiceResult.error.message
					)
				);

				await queryRunner.rollbackTransaction();

				logger.warn(
					logConstruct(
						`UpdateRefreshTokenCommandHandler`,
						`UpdateRefreshTokenEncryptResponseService`,
						`Rollback Transaction`
					)
				);

				return DataResponseFactory.error(
					updateRefreshTokenEncryptResponseServiceResult.error.status,
					updateRefreshTokenEncryptResponseServiceResult.error.message
				);
			}

			const aesResponseDto: AesResponseDto =
				updateRefreshTokenEncryptResponseServiceResult.value.aesResponseDto;
			await queryRunner.commitTransaction();
			logger.info(
				logConstruct(
					`UpdateRefreshTokenCommandHandler`,
					`UpdateRefreshTokenEncryptResponseService`,
					`Commit Transaction`
				)
			);

			// Return Response
			return DataResponseFactory.success(StatusCodes.OK, aesResponseDto);
		} catch (ex) {
			const error = ex as Error;
			logger.error(
				logConstruct(`UpdateRefreshTokenCommandHandler`, `handle`, error.message, ex)
			);
			if (queryRunner.isTransactionActive) {
				await queryRunner.rollbackTransaction();
				logger.warn(
					logConstruct(
						`UpdateRefreshTokenCommandHandler`,
						`handle`,
						`Rollback Transaction`
					)
				);
			}
			return DataResponseFactory.error(StatusCodes.INTERNAL_SERVER_ERROR, error.message);
		} finally {
			await queryRunner.release();
			logger.info(
				logConstruct(`UpdateRefreshTokenCommandHandler`, `handle`, `Release Transaction`)
			);
		}
	}
}

// @endregion
