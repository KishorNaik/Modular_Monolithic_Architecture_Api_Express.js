import { UserSharedCacheService } from '@/modules/users/shared/cache';
import { UpdateRowVersionService } from '@/modules/users/shared/services/updateRowVersion';
import { IUsers } from '@/modules/users/shared/types';
import { sealed } from '@/shared/utils/decorators/sealed';
import { ResultError, ResultExceptionFactory } from '@/shared/utils/exceptions/results';
import {
	IServiceHandlerAsync,
	IServiceHandlerVoid,
	IServiceHandlerVoidAsync,
} from '@/shared/utils/helpers/services';
import {
	QueryRunner,
	StatusEnum,
	UpdateUserSettingsService,
	UserEntity,
	UserSettingsEntity,
} from '@kishornaik/mma_db';
import { Guid } from 'guid-typescript';
import { StatusCodes } from 'http-status-codes';
import { Ok, Result } from 'neverthrow';
import Container, { Service } from 'typedi';

export interface IIfTokenIsNotValidServiceParameters {
	userId: string;
	queryRunner: QueryRunner;
}

export interface IIfTokenIsNotValidServiceResult {
	message: string;
	users: IUsers;
}

export interface IIfTokenIsNotValidService
	extends IServiceHandlerAsync<
		IIfTokenIsNotValidServiceParameters,
		IIfTokenIsNotValidServiceResult
	> {}

@sealed
@Service()
export class IfTokenIsNotValidService implements IIfTokenIsNotValidService {
	private readonly _userSharedCacheService: UserSharedCacheService;
	private readonly _mapIUsersToEntityService: MapIUsersToEntityService;
	private readonly _updateEmailTokenService: UpdateEmailTokenService;
	private readonly _updateUserRowVersionService: UpdateRowVersionService;

	public constructor() {
		this._userSharedCacheService = Container.get(UserSharedCacheService);
		this._mapIUsersToEntityService = Container.get(MapIUsersToEntityService);
		this._updateEmailTokenService = Container.get(UpdateEmailTokenService);
		this._updateUserRowVersionService = Container.get(UpdateRowVersionService);
	}

	public async handleAsync(
		params: IIfTokenIsNotValidServiceParameters
	): Promise<Result<IIfTokenIsNotValidServiceResult, ResultError>> {
		try {
			// @guard
			if (!params)
				return ResultExceptionFactory.error(StatusCodes.BAD_REQUEST, 'Invalid params');

			const { userId, queryRunner } = params;

			// Get User Data from Cache
			const userSharedCacheServiceResult = await this._userSharedCacheService.handleAsync({
				identifier: userId,
				queryRunner: queryRunner,
				status: StatusEnum.INACTIVE,
			});
			if (userSharedCacheServiceResult.isErr())
				return ResultExceptionFactory.error(
					userSharedCacheServiceResult.error.status,
					userSharedCacheServiceResult.error.message
				);

			const users: IUsers = userSharedCacheServiceResult.value.users;

			// Map Entity
			const mapIUsersToEntityServiceResult = await this._mapIUsersToEntityService.handleAsync(
				{
					users: users,
				}
			);
			if (mapIUsersToEntityServiceResult.isErr())
				return ResultExceptionFactory.error(
					mapIUsersToEntityServiceResult.error.status,
					mapIUsersToEntityServiceResult.error.message
				);

			const userEntity: UserEntity = mapIUsersToEntityServiceResult.value.userEntity;
			const userSettingsEntity: UserSettingsEntity =
				mapIUsersToEntityServiceResult.value.userSettingsEntity;

			// Update Email Token Entity
			const updateEmailTokenServiceResult = await this._updateEmailTokenService.handleAsync({
				userSettingEntity: userSettingsEntity,
				queryRunner: queryRunner,
			});
			if (updateEmailTokenServiceResult.isErr())
				return ResultExceptionFactory.error(
					updateEmailTokenServiceResult.error.status,
					updateEmailTokenServiceResult.error.message
				);

			//Update Row Version
			const updateUserRowVersionServiceResult =
				await this._updateUserRowVersionService.handleAsync({
					userId: userEntity.identifier,
					status: StatusEnum.INACTIVE,
					queryRunner: queryRunner,
				});
			if (updateUserRowVersionServiceResult.isErr())
				return ResultExceptionFactory.error(
					updateUserRowVersionServiceResult.error.status,
					updateUserRowVersionServiceResult.error.message
				);

			// Update Cache result
			const updateUserSharedCacheServiceResult =
				await this._userSharedCacheService.handleAsync({
					identifier: userId,
					queryRunner: queryRunner,
					status: StatusEnum.INACTIVE,
				});
			if (updateUserSharedCacheServiceResult.isErr())
				return ResultExceptionFactory.error(
					updateUserSharedCacheServiceResult.error.status,
					updateUserSharedCacheServiceResult.error.message
				);

			const updatedUsers: IUsers = updateUserSharedCacheServiceResult.value.users;

			const result: IIfTokenIsNotValidServiceResult = {
				users: updatedUsers,
				message: `new email token sent to ${updatedUsers.communication.email}`,
			};

			return new Ok(result);
		} catch (ex) {
			const error = ex as Error;
			return ResultExceptionFactory.error(StatusCodes.INTERNAL_SERVER_ERROR, error.message);
		}
	}
}

interface IMapIUsersToEntityServiceParameters {
	users: IUsers;
}

interface IMapIUsersToEntityServiceResult {
	userEntity: UserEntity;
	userSettingsEntity: UserSettingsEntity;
}

interface IMapIUsersToEntityService
	extends IServiceHandlerAsync<
		IMapIUsersToEntityServiceParameters,
		IMapIUsersToEntityServiceResult
	> {}

@sealed
@Service()
class MapIUsersToEntityService implements IMapIUsersToEntityService {
	public async handleAsync(
		params: IMapIUsersToEntityServiceParameters
	): Promise<Result<IMapIUsersToEntityServiceResult, ResultError>> {
		try {
			// @guard
			if (!params)
				return ResultExceptionFactory.error(StatusCodes.BAD_REQUEST, 'Invalid params');

			if (!params.users)
				return ResultExceptionFactory.error(StatusCodes.BAD_REQUEST, 'Invalid users');

			const users: IUsers = params.users;

			const userSettingsEntity: UserSettingsEntity = new UserSettingsEntity();
			userSettingsEntity.identifier = users.settings.identifier;
			userSettingsEntity.emailVerificationToken = Guid.create().toString();
			userSettingsEntity.email_Verification_Token_expires_at = new Date(
				new Date().getTime() + 24 * 60 * 60 * 1000
			);
			userSettingsEntity.status = StatusEnum.INACTIVE;

			const userEntity: UserEntity = new UserEntity();
			userEntity.identifier = users.identifier;
			userEntity.status = StatusEnum.INACTIVE;
			userEntity.modified_date = new Date();

			const result: IMapIUsersToEntityServiceResult = {
				userEntity: userEntity,
				userSettingsEntity: userSettingsEntity,
			};

			return new Ok(result);
		} catch (ex) {
			const error = ex as Error;
			return ResultExceptionFactory.error(StatusCodes.INTERNAL_SERVER_ERROR, error.message);
		}
	}
}

interface IUpdateEmailTokenServiceParameters {
	userSettingEntity: UserSettingsEntity;
	queryRunner: QueryRunner;
}

interface IUpdateEmailTokenService
	extends IServiceHandlerVoidAsync<IUpdateEmailTokenServiceParameters> {}

@sealed
@Service()
class UpdateEmailTokenService implements IUpdateEmailTokenService {
	private readonly _updateUserSettingEntity: UpdateUserSettingsService;

	public constructor() {
		this._updateUserSettingEntity = Container.get(UpdateUserSettingsService);
	}
	public async handleAsync(
		params: IUpdateEmailTokenServiceParameters
	): Promise<Result<undefined, ResultError>> {
		try {
			if (!params)
				return ResultExceptionFactory.error(StatusCodes.BAD_REQUEST, 'Invalid params');

			if (!params.userSettingEntity)
				return ResultExceptionFactory.error(
					StatusCodes.BAD_REQUEST,
					'Invalid userSettingEntity'
				);

			if (!params.queryRunner)
				return ResultExceptionFactory.error(StatusCodes.BAD_REQUEST, 'Invalid queryRunner');

			const { userSettingEntity, queryRunner } = params;

			const updateUserSettingEntityResult = await this._updateUserSettingEntity.handleAsync(
				userSettingEntity,
				queryRunner
			);
			if (updateUserSettingEntityResult.isErr())
				return ResultExceptionFactory.error(
					updateUserSettingEntityResult.error.statusCode,
					updateUserSettingEntityResult.error.message
				);

			return new Ok(undefined);
		} catch (ex) {
			const error = ex as Error;
			return ResultExceptionFactory.error(StatusCodes.INTERNAL_SERVER_ERROR, error.message);
		}
	}
}
