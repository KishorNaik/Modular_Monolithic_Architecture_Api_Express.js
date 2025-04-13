import { DataResponse, DataResponseFactory } from '@/shared/models/response/data.Response';
import { sealed } from '@/shared/utils/decorators/sealed';
import { RequestData, requestHandler, RequestHandler } from 'mediatr-ts';
import {
	GetUserByIdentifierDomainEventRequestDto,
	GetUserByIdentifierDomainEventResponseDto,
} from '../../../contracts/Index';
import { StatusCodes } from 'http-status-codes';
import { GetUserByIdentifierDomainEventValidationService } from '../../../services/validations/getUserByIdentifierDomainEvent';
import Container from 'typedi';
import { GetUserByIdentifierMapEntityService } from '../../../services/mapEntity';
import { GetUserByIdentifierDbService } from '../../../services/db';
import { UserEntity } from '@kishornaik/mma_db';
import { GetUserByIdentifiersDomainEventMapResponseService } from '../../../services/mapResponse/getUserByIdentifierDomainEvent';

@sealed
export class GetUserByIdentifierDomainEvent extends RequestData<
	DataResponse<GetUserByIdentifierDomainEventResponseDto>
> {
	private readonly _request: GetUserByIdentifierDomainEventRequestDto;

	public constructor(request: GetUserByIdentifierDomainEventRequestDto) {
		super();
		this._request = request;
	}

	public get request(): GetUserByIdentifierDomainEventRequestDto {
		return this.request;
	}
}

@sealed
@requestHandler(GetUserByIdentifierDomainEvent)
export class GetUserByIdentifierDomainEventHandler
	implements
		RequestHandler<
			GetUserByIdentifierDomainEvent,
			DataResponse<GetUserByIdentifierDomainEventResponseDto>
		>
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

	public async handle(
		value: GetUserByIdentifierDomainEvent
	): Promise<DataResponse<GetUserByIdentifierDomainEventResponseDto>> {
		try {
			// Guard
			if (!value)
				return DataResponseFactory.error(StatusCodes.BAD_REQUEST, 'Invalid command');

			if (!value.request)
				return DataResponseFactory.error(StatusCodes.BAD_REQUEST, 'Invalid request');

			// Validation
			const getUserByIdentifierDomainEventValidationServiceResult =
				await this._getUserByIdentifierDomainEventValidationService.handleAsync({
					dto: value.request,
					dtoClass: GetUserByIdentifierDomainEventRequestDto,
				});
			if (getUserByIdentifierDomainEventValidationServiceResult.isErr())
				return DataResponseFactory.error(
					getUserByIdentifierDomainEventValidationServiceResult.error.status,
					getUserByIdentifierDomainEventValidationServiceResult.error.message
				);

			// Map Entity Service
			const getUserByIdentifierMapEntityServiceResult =
				await this._getUserByIdentifierMapEntityService.handleAsync({
					dto: value.request,
				});
			if (getUserByIdentifierMapEntityServiceResult.isErr())
				return DataResponseFactory.error(
					getUserByIdentifierMapEntityServiceResult.error.status,
					getUserByIdentifierMapEntityServiceResult.error.message
				);

			// Db Service
			const getUserByIdentifierDbServiceResult =
				await this._getUserByIdentifierDbService.handleAsync(
					getUserByIdentifierMapEntityServiceResult.value
				);
			if (getUserByIdentifierDbServiceResult.isErr())
				return DataResponseFactory.error(
					getUserByIdentifierDbServiceResult.error.status,
					getUserByIdentifierDbServiceResult.error.message
				);

			const userEntity: UserEntity = getUserByIdentifierDbServiceResult.value;

			// Response Map
			const getUserByIdentifiersDomainEventMapResponseServiceResult =
				await this._getUserByIdentifiersDomainEventMapResponseService.handleAsync(
					userEntity
				);
			if (getUserByIdentifiersDomainEventMapResponseServiceResult.isErr())
				return DataResponseFactory.error(
					getUserByIdentifiersDomainEventMapResponseServiceResult.error.status,
					getUserByIdentifiersDomainEventMapResponseServiceResult.error.message
				);

			return DataResponseFactory.Response(
				true,
				StatusCodes.OK,
				getUserByIdentifiersDomainEventMapResponseServiceResult.value
			);
		} catch (ex) {
			const error = ex as Error;
			return DataResponseFactory.error(StatusCodes.INTERNAL_SERVER_ERROR, error.message);
		}
	}
}
