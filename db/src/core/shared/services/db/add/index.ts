import { Err, Ok, Result } from 'neverthrow';
import Container, { Service } from 'typedi';
import { DataSource, QueryRunner } from 'typeorm';
import { StatusCodes } from 'http-status-codes';
import { ResultError } from '../../../utils/exceptions/results';
import { DtoValidation, IDtoValidation } from '../../../utils/validations/dto';
import { dbDataSource } from '../../../../config/dbSource';
import { logger } from '../../../utils/helpers/loggers';

export interface IAddService<TInput, TOutput> {
	handleAsync(
		params: TInput,
		queryRunner?: QueryRunner
	): Promise<Result<TOutput | null, ResultError>>;
}

@Service()
export class AddService<T extends object> implements IAddService<T, T> {
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
			//logger.info(`identifier: ${(params as any).identifier}`);

			if ('status' in (params as any) === false)
				return new Err(new ResultError(StatusCodes.BAD_REQUEST, 'Status is required'));
			//logger.info(`status: ${(params as any).status}`);

			//logger.info(`Params: ${JSON.stringify(params)}`);

			// Validate Entity
			const validationResult = await this.dtoValidation.handleAsync({
				dto: params,
				dtoClass: (params as any).constructor,
			});
			if (validationResult.isErr()) return new Err(validationResult.error);
			logger.info(`validationResult passed`);

			// Run Query Runner
			const entityManager = queryRunner ? queryRunner.manager : dbDataSource.manager;
			logger.info(`entityManager passed`);
			logger.info(`entity manager:${entityManager.hasId}`);

			// Insert Query
			const result = await entityManager
				.createQueryBuilder()
				.insert()
				.into(this.entity)
				.values(params!)
				.execute();
			logger.info(`Insert Query Executed`);

			// Check if insert is successfully
			if (!result.identifiers[0].id)
				return new Err(
					new ResultError(StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to insert entity')
				);
			logger.info(`Insert passed`);
			logger.info(`id: ${result.identifiers[0].id}`);

			// Get Entity
			return new Ok(params);
		} catch (ex) {
			const error = ex as Error;
			console.log(`Error: ${error}`);
			logger.error(`Error message: ${error.message}`);
			return new Err(new ResultError(StatusCodes.INTERNAL_SERVER_ERROR, error.message));
		}
	}
}
