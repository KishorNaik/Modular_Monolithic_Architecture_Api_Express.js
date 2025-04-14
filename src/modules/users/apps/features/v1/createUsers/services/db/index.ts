import { sealed } from '@/shared/utils/decorators/sealed';
import Container, { Service } from 'typedi';
import { ICreateUserMapEntityServiceResult } from '../mapEntity';
import { IServiceHandlerAsync, IServiceHandlerVoidAsync } from '@/shared/utils/helpers/services';
import { ResultError, ResultExceptionFactory } from '@/shared/utils/exceptions/results';
import { Ok, Result } from 'neverthrow';
import {
	AddUserCommunicationService,
	AddUserCredentialsService,
	AddUserKeyService,
	AddUserService,
	AddUserSettingsService,
	QueryRunner,
} from '@kishornaik/mma_db';
import { StatusCodes } from 'http-status-codes';

Container.set<AddUserService>(AddUserService, new AddUserService());
Container.set<AddUserCommunicationService>(
	AddUserCommunicationService,
	new AddUserCommunicationService()
);
Container.set<AddUserKeyService>(AddUserKeyService, new AddUserKeyService());
Container.set<AddUserSettingsService>(AddUserSettingsService, new AddUserSettingsService());
Container.set<AddUserCredentialsService>(
	AddUserCredentialsService,
	new AddUserCredentialsService()
);

export class CreateUserDbServiceParameters {
	entity: ICreateUserMapEntityServiceResult;
	queryRunner: QueryRunner;
}

export interface ICreateUserDbService
	extends IServiceHandlerVoidAsync<CreateUserDbServiceParameters> {}

@sealed
@Service()
export class CreateUserDbService implements ICreateUserDbService {
	private readonly _addUserService: AddUserService;
	private readonly _addUserCredentialsService: AddUserCredentialsService;
	private readonly _addUserKeyService: AddUserKeyService;
	private readonly _addUserSettingsService: AddUserSettingsService;
	private readonly _addUserCommunicationService: AddUserCommunicationService;

	public constructor() {
		this._addUserService = Container.get(AddUserService);
		this._addUserCredentialsService = Container.get(AddUserCredentialsService);
		this._addUserKeyService = Container.get(AddUserKeyService);
		this._addUserSettingsService = Container.get(AddUserSettingsService);
		this._addUserCommunicationService = Container.get(AddUserCommunicationService);
	}

	public async handleAsync(
		params: CreateUserDbServiceParameters
	): Promise<Result<undefined, ResultError>> {
		try {
			// Guard
			if (!params)
				return ResultExceptionFactory.error(StatusCodes.BAD_REQUEST, 'invalid params');

			if (!params.entity)
				return ResultExceptionFactory.error(StatusCodes.BAD_REQUEST, 'invalid entity');

			if (!params.queryRunner)
				return ResultExceptionFactory.error(StatusCodes.BAD_REQUEST, 'invalid queryRunner');

			// Add User Service
			const addUserServiceResult = await this._addUserService.handleAsync(
				params.entity.entity.users,
				params.queryRunner
			);
			if (addUserServiceResult.isErr())
				return ResultExceptionFactory.error(
					addUserServiceResult.error.statusCode,
					addUserServiceResult.error.message
				);

			// Add User Key Service
			const addUserKeyServiceResult = await this._addUserKeyService.handleAsync(
				params.entity.entity.keys,
				params.queryRunner
			);
			if (addUserKeyServiceResult.isErr())
				return ResultExceptionFactory.error(
					addUserKeyServiceResult.error.statusCode,
					addUserKeyServiceResult.error.message
				);

			// Add User Settings Service
			const addUserSettingsServiceResult = await this._addUserSettingsService.handleAsync(
				params.entity.entity.settings,
				params.queryRunner
			);
			if (addUserSettingsServiceResult.isErr())
				return ResultExceptionFactory.error(
					addUserSettingsServiceResult.error.statusCode,
					addUserSettingsServiceResult.error.message
				);

			// Add User Communication Service
			const addUserCommunicationServiceResult =
				await this._addUserCommunicationService.handleAsync(
					params.entity.entity.communication,
					params.queryRunner
				);
			if (addUserCommunicationServiceResult.isErr())
				return ResultExceptionFactory.error(
					addUserCommunicationServiceResult.error.statusCode,
					addUserCommunicationServiceResult.error.message
				);

      console.log(`cred: ${params.entity.entity.credentials}`);

			// Add User Credentials Service
			const addUserCredentialsServiceResult =
				await this._addUserCredentialsService.handleAsync(
					params.entity.entity.credentials,
					params.queryRunner
				);
			if (addUserCredentialsServiceResult.isErr())
				return ResultExceptionFactory.error(
					addUserCredentialsServiceResult.error.statusCode,
					addUserCredentialsServiceResult.error.message
				);

			return new Ok(undefined);
		} catch (ex) {
			const error = ex as Error;
			return ResultExceptionFactory.error(StatusCodes.INTERNAL_SERVER_ERROR, error.message);
		}
	}
}
