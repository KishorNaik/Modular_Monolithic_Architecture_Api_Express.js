import { Err, Ok, Result } from 'neverthrow';
import { DataSource, QueryRunner } from 'typeorm';
import { ResultError } from '../../../utils/exceptions/results';
import Container, { Service } from 'typedi';
import { DtoValidation, IDtoValidation } from '../../../utils/validations/dto';
import { dbDataSource } from '../../../../config/dbSource';
import { StatusCodes } from 'http-status-codes';

export interface IGetByIdentifierService<TInput, TOutput> {
	handleAsync(
		params: TInput,
		queryRunner?: QueryRunner
	): Promise<Result<TOutput | null, ResultError>>;
}

@Service()
export class GetByIdentifierService<T extends object> implements IGetByIdentifierService<T, T> {
	private readonly dtoValidation: IDtoValidation<T>;

	public constructor(entity: new () => T) {
		this.entity = entity;
		this.dtoValidation = Container.get(DtoValidation<T>);
	}

	private entity: new () => T;

	public async handleAsync(
		params: T,
		queryRunner?: QueryRunner
	): Promise<Result<T | null, ResultError>> {
		try {
			if ('identifier' in (params as any) === false)
				return new Err(new ResultError(StatusCodes.BAD_REQUEST, 'Identifier is required'));

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

			// Get Entity
			const result = await entityManager
				.createQueryBuilder(this.entity, 'entity')
				.where('entity.identifier = :identifier', {
					identifier: (params as any).identifier,
				})
				.andWhere('entity.status = :status', {
					status: (params as any).status,
				})
				.getOne();

			// Check if get is successfully
			if (!result) return new Err(new ResultError(StatusCodes.NOT_FOUND, 'entity not found'));

			// Get Entity
			return new Ok(result as T);
		} catch (ex) {
			const error = ex as Error;
			return new Err(new ResultError(StatusCodes.INTERNAL_SERVER_ERROR, error.message));
		}
	}
}
