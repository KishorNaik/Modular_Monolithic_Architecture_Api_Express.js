import { DataResponse, DataResponseFactory } from '@/shared/models/response/data.Response';
import { sealed } from '@/shared/utils/decorators/sealed';
import { RequestData, requestHandler, RequestHandler } from 'mediatr-ts';
import {
	GetUserByIdentifierDomainEventRequestDto,
	GetUserByIdentifierDomainEventResponseDto,
} from '../../../contracts/Index';
import { StatusCodes } from 'http-status-codes';
import Container, { Service } from 'typedi';
import { GetUserByIdentifierMapEntityService } from './services/mapEntity';
import { GetUserByIdentifierDbService } from './services/db';
import { QueryRunner, UserEntity } from '@kishornaik/mma_db';
import { IServiceHandlerAsync } from '@/shared/utils/helpers/services';
import { ResultError, ResultExceptionFactory } from '@/shared/utils/exceptions/results';
import { Ok, Result } from 'neverthrow';
import { GetUserByIdentifiersDomainEventMapResponseService } from './services/mapResponse';
import { GetUserByIdentifierDomainEventValidationService } from './services/validations';

export interface IGetUserByIdentifierDomainEventServiceParameters {
	request: GetUserByIdentifierDomainEventRequestDto;
	queryRunner?: QueryRunner;
}

export interface IGetUserByIdentifierDomainEventService
	extends IServiceHandlerAsync<
		IGetUserByIdentifierDomainEventServiceParameters,
		GetUserByIdentifierDomainEventResponseDto
	> {}

@sealed
@Service()
export class GetUserByIdentifierDomainEventService
	implements IGetUserByIdentifierDomainEventService
{
	private readonly _getUserByIdentifierDomainEventValidationService: GetUserByIdentifierDomainEventValidationService;
	private readonly _getUserByIdentifierMapEntityService: GetUserByIdentifierMapEntityService;
	private readonly _getUserByIdentifierDbService: GetUserByIdentifierDbService;
	private readonly _getUserByIdentifiersDomainEventMapResponseService: GetUserByIdentifiersDomainEventMapResponseService;

	public constructor() {
		this._getUserByIdentifierDomainEventValidationService = Container.get(
			GetUserByIdentifierDomainEventValidationService
		);
		this._getUserByIdentifierMapEntityService = Container.get(
			GetUserByIdentifierMapEntityService
		);
		this._getUserByIdentifierDbService = Container.get(GetUserByIdentifierDbService);
		this._getUserByIdentifiersDomainEventMapResponseService = Container.get(
			GetUserByIdentifiersDomainEventMapResponseService
		);
	}

	public async handleAsync(
		params: IGetUserByIdentifierDomainEventServiceParameters
	): Promise<Result<GetUserByIdentifierDomainEventResponseDto, ResultError>> {
		try {
			// Guard
			if (!params)
				return ResultExceptionFactory.error(StatusCodes.BAD_REQUEST, 'InValid Request');

			// Validation
			const getUserByIdentifierDomainEventValidationServiceResult =
				await this._getUserByIdentifierDomainEventValidationService.handleAsync({
					dto: params.request,
					dtoClass: GetUserByIdentifierDomainEventRequestDto,
				});
			if (getUserByIdentifierDomainEventValidationServiceResult.isErr())
				return ResultExceptionFactory.error(
					getUserByIdentifierDomainEventValidationServiceResult.error.status,
					getUserByIdentifierDomainEventValidationServiceResult.error.message
				);

			// Map Entity Service
			const getUserByIdentifierMapEntityServiceResult =
				await this._getUserByIdentifierMapEntityService.handleAsync({
					dto: params.request,
				});
			if (getUserByIdentifierMapEntityServiceResult.isErr())
				return ResultExceptionFactory.error(
					getUserByIdentifierMapEntityServiceResult.error.status,
					getUserByIdentifierMapEntityServiceResult.error.message
				);

			let userEntity: UserEntity = getUserByIdentifierMapEntityServiceResult.value;

			// Db Service
			const getUserByIdentifierDbServiceResult =
				await this._getUserByIdentifierDbService.handleAsync({
					userEntity: userEntity,
					queryRunner: params.queryRunner,
				});
			if (getUserByIdentifierDbServiceResult.isErr())
				return ResultExceptionFactory.error(
					getUserByIdentifierDbServiceResult.error.status,
					getUserByIdentifierDbServiceResult.error.message
				);

			userEntity = getUserByIdentifierDbServiceResult.value;

			// Response Map
			const getUserByIdentifiersDomainEventMapResponseServiceResult =
				await this._getUserByIdentifiersDomainEventMapResponseService.handleAsync(
					userEntity
				);
			if (getUserByIdentifiersDomainEventMapResponseServiceResult.isErr())
				return ResultExceptionFactory.error(
					getUserByIdentifiersDomainEventMapResponseServiceResult.error.status,
					getUserByIdentifiersDomainEventMapResponseServiceResult.error.message
				);

			const response: GetUserByIdentifierDomainEventResponseDto =
				getUserByIdentifiersDomainEventMapResponseServiceResult.value;

			return new Ok(response);
		} catch (ex) {
			const error = ex as Error;
			return ResultExceptionFactory.error(StatusCodes.INTERNAL_SERVER_ERROR, error.message);
		}
	}
}
