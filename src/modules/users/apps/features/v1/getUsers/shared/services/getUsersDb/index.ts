import { sealed } from '@/shared/utils/decorators/sealed';
import { IServiceHandlerAsync } from '@/shared/utils/helpers/services';
import {
	GetUsersService,
	IGetUsersServiceParameters,
	IPageListResult,
	UserEntity,
} from '@kishornaik/mma_db';
import Container, { Service } from 'typedi';
import { IUsersForAdmin } from '../../../contracts';
import { ResultError, ResultExceptionFactory } from '@/shared/utils/exceptions/results';
import { Ok, Result } from 'neverthrow';
import { StatusCodes } from 'http-status-codes';
import { GetUsersFromEntityToTypeMapperService } from './services/map';

Container.set<GetUsersService>(GetUsersService, new GetUsersService());

export interface IGetUserDbServiceParameters extends IGetUsersServiceParameters {}

export interface IGetUserDbService
	extends IServiceHandlerAsync<IGetUserDbServiceParameters, IPageListResult<IUsersForAdmin>> {}

@sealed
@Service()
export class GetUsersDbService implements IGetUserDbService {
	private readonly _getUserService: GetUsersService;
	private readonly _getUsersFromEntityToTypeMapperService: GetUsersFromEntityToTypeMapperService;

	public constructor() {
		this._getUserService = Container.get(GetUsersService);
		this._getUsersFromEntityToTypeMapperService = Container.get(
			GetUsersFromEntityToTypeMapperService
		);
	}

	public async handleAsync(
		params: IGetUserDbServiceParameters
	): Promise<Result<IPageListResult<IUsersForAdmin>, ResultError>> {
		try {
			//@guard
			if (!params)
				return ResultExceptionFactory.error(StatusCodes.BAD_REQUEST, 'Invalid params');

			//Db Service
			const getUserServiceResult = await this._getUserService.handleAsync(params);
			if (getUserServiceResult.isErr())
				return ResultExceptionFactory.error(
					getUserServiceResult.error.statusCode,
					getUserServiceResult.error.message
				);

			const getUsersResult = getUserServiceResult.value;
			const users = getUsersResult.items;
			const page = getUsersResult.page;

			// Map Service
			const getUsersFromEntityToTypeMapperServiceResult =
				await this._getUsersFromEntityToTypeMapperService.handleAsync(users);
			if (getUsersFromEntityToTypeMapperServiceResult.isErr())
				return ResultExceptionFactory.error(
					getUsersFromEntityToTypeMapperServiceResult.error.status,
					getUsersFromEntityToTypeMapperServiceResult.error.message
				);

			const userMap = getUsersFromEntityToTypeMapperServiceResult.value;

			// Response
			const result: IPageListResult<IUsersForAdmin> = {
				items: userMap,
				page: page,
			};

			return new Ok(result);
		} catch (ex) {
			const error = ex as Error;
			return ResultExceptionFactory.error(StatusCodes.INTERNAL_SERVER_ERROR, error.message);
		}
	}
}
