import { Err, Ok, Result } from 'neverthrow';
import { DataSource, QueryRunner, SelectQueryBuilder } from 'typeorm';
import { PagedList } from '../../../utils/miscellaneous/pageList';
import { ResultError } from '../../../utils/exceptions/results';
import { ObjectLiteral } from 'typeorm';
import { DtoValidation, IDtoValidation } from '../../../utils/validations/dto';
import { dbDataSource } from '../../../../config/dbSource';
import Container, { Service } from 'typedi';
import { StatusCodes } from 'http-status-codes';
import { IPagination } from '../../../models/types/pagination';
import { ISort, Order } from '../../../models/types/order';

export interface IGetService<TInput extends ObjectLiteral, TOutput extends object> {
	handleAsync(
		params: TInput,
		pagination?: IPagination | null,
		//addWhereClauses?: (queryBuilder: SelectQueryBuilder<TInput>) => void | null,
		sort?: ISort | null,
		queryRunner?: QueryRunner
	): Promise<Result<PagedList<TOutput>, ResultError>>;
}

@Service()
export class GetService<T extends object> implements IGetService<T, T> {
	private readonly dtoValidation: IDtoValidation<T>;

	public constructor(entity: new () => T) {
		this.entity = entity;
		this.dtoValidation = Container.get(DtoValidation<T>);
	}

	private entity: new () => T;

	public async handleAsync(
		params: T,
		pagination: IPagination | null,
		//addWhereClauses?: ((queryBuilder: SelectQueryBuilder<T>) => void) | null,
		sort?: ISort | null,
		queryRunner?: QueryRunner
	): Promise<Result<PagedList<T>, ResultError>> {
		try {
			if ('status' in (params as any) === false)
				return new Err(new ResultError(StatusCodes.BAD_REQUEST, 'Status is required'));

			// Validate Entity
			const validationResult = await this.dtoValidation.handleAsync({
				dto: params,
				dtoClass: (params as any).constructor,
			});
			if (validationResult.isErr()) return new Err(validationResult.error);

			// Run Query Runner
			const entityManager = queryRunner ? queryRunner.manager : dbDataSource.manager;

			// Create Query Builder
			let queryBuilder: SelectQueryBuilder<T> = entityManager
				.createQueryBuilder(this.entity, 'entity')
				.where('entity.status = :status', {
					status: (params as any).status,
				});

			// Add dynamic where clauses via callback
			// if (addWhereClauses) {
			// 	addWhereClauses(queryBuilder);
			// }

			// Apply sorting
			if (sort && sort.by.length > 0) {
				sort.by.forEach((column) => {
					queryBuilder = queryBuilder.addOrderBy(
						`entity.${column}`,
						sort.direction === Order.ASC ? 'ASC' : 'DESC'
					);
				});
			}

			// Get Paged List
			let pagedList: PagedList<T>;
			if (pagination) {
				pagedList = await PagedList.toPagedListAsync(
					queryBuilder,
					pagination.pageNumber,
					pagination.pageSize
				);
			} else {
				const allResults = await queryBuilder.getMany();
				pagedList = new PagedList(queryBuilder, allResults.length, 1, allResults.length);
			}

			// Return Paged List
			return new Ok(pagedList);
		} catch (ex) {
			const error = ex as Error;
			return new Err(new ResultError(StatusCodes.INTERNAL_SERVER_ERROR, error.message));
		}
	}
}
