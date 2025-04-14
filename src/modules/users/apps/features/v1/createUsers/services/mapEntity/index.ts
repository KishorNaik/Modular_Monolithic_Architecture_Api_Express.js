import { IHashPasswordResult } from '@/shared/services/users/user.HashPassword.Service';
import { sealed } from '@/shared/utils/decorators/sealed';
import { Service } from 'typedi';
import { ICreateUserKeyServiceResult } from '../keys';
import { CreateUserRequestDto } from '../../contracts';
import {
	StatusEnum,
	UserCommunicationEntity,
	UserCredentialsEntity,
	UserEntity,
	UserKeysEntity,
	UserSettingsEntity,
} from '@kishornaik/mma_db';
import { IServiceHandlerAsync } from '@/shared/utils/helpers/services';
import { ResultError, ResultExceptionFactory } from '@/shared/utils/exceptions/results';
import { Ok, Result } from 'neverthrow';
import { StatusCodes } from 'http-status-codes';
import { Guid } from 'guid-typescript';
import { BoolEnum } from '@kishornaik/mma_db/dist/core/shared/models/enums/bool.enum';

export interface ICreateUserMapEntityServiceParameters {
	hashPassword: IHashPasswordResult;
	keys: ICreateUserKeyServiceResult;
	createUserRequestDto: CreateUserRequestDto;
}

export interface ICreateUserMapEntityServiceResult {
	entity: {
		users: UserEntity;
		communication: UserCommunicationEntity;
		keys: UserKeysEntity;
		settings: UserSettingsEntity;
		credentials: UserCredentialsEntity;
	};
}

export interface ICreateUserMapEntityService
	extends IServiceHandlerAsync<
		ICreateUserMapEntityServiceParameters,
		ICreateUserMapEntityServiceResult
	> {}

@sealed
@Service()
export class CreateUserMapEntityService implements ICreateUserMapEntityService {
	public async handleAsync(
		params: ICreateUserMapEntityServiceParameters
	): Promise<Result<ICreateUserMapEntityServiceResult, ResultError>> {
		try {
			// Guard
			if (!params)
				return ResultExceptionFactory.error(StatusCodes.BAD_REQUEST, 'invalid params');

			if (!params.hashPassword)
				return ResultExceptionFactory.error(
					StatusCodes.BAD_REQUEST,
					'invalid hashPassword'
				);

			if (!params.keys)
				return ResultExceptionFactory.error(StatusCodes.BAD_REQUEST, 'invalid keys');

			if (!params.createUserRequestDto)
				return ResultExceptionFactory.error(
					StatusCodes.BAD_REQUEST,
					'invalid create user request dto'
				);

			// user Entity mapping
			const userEntity = new UserEntity();
			userEntity.identifier = Guid.create().toString();
			userEntity.clientId = Guid.create().toString();
			userEntity.firstName = params.createUserRequestDto.firstName;
			userEntity.lastName = params.createUserRequestDto.lastName;
			userEntity.status = StatusEnum.INACTIVE;

			// communication Entity mapping
			const userCommunication = new UserCommunicationEntity();
			userCommunication.identifier = Guid.create().toString();
			userCommunication.email = params.createUserRequestDto.email;
			userCommunication.mobileNo = params.createUserRequestDto.mobileNo;
			userCommunication.status = StatusEnum.INACTIVE;
			userCommunication.userId = userEntity.identifier;

			// keys Entity mapping
			const userKeys = new UserKeysEntity();
			userKeys.identifier = Guid.create().toString();
			userKeys.aesSecretKey = params.keys.aesSecretKey;
			userKeys.hmacSecretKey = params.keys.hmacSecretKey;
			userKeys.status = StatusEnum.INACTIVE;
			userKeys.userId = userEntity.identifier;
			userKeys.refresh_token = null;

			// settings Entity mapping
			const userSettings = new UserSettingsEntity();
			userSettings.identifier = Guid.create().toString();
			userSettings.emailVerificationToken = Guid.create().toString();
			userSettings.isEmailVerified = BoolEnum.NO;
			userSettings.status = StatusEnum.INACTIVE;
			userSettings.userId = userEntity.identifier;

			// credentials Entity mapping
			const userCredentials = new UserCredentialsEntity();
			userCredentials.identifier = Guid.create().toString();
			userCredentials.hash = params.hashPassword.hash;
			userCredentials.salt = params.hashPassword.salt;
			userCredentials.status = StatusEnum.INACTIVE;
			userCredentials.username = userCommunication.email
			userCredentials.userId = userEntity.identifier;

			const result: ICreateUserMapEntityServiceResult = {
				entity: {
					users: userEntity,
					communication: userCommunication,
					keys: userKeys,
					settings: userSettings,
					credentials: userCredentials,
				},
			};

			return new Ok(result);
		} catch (ex) {
			const error = ex as Error;
			return ResultExceptionFactory.error(StatusCodes.INTERNAL_SERVER_ERROR, error.message);
		}
	}
}
