import 'reflect-metadata';
import { Err, Ok, Result, err } from 'neverthrow';
import { NODE_ENV } from './config/env';
import { StatusCodes } from 'http-status-codes';
import Container, { Service } from 'typedi';
import { IsNumber, IsPositive } from 'class-validator';
import { Type } from 'class-transformer';
import { ResultError } from './shared/utils/exceptions/results';
import { RequestData, RequestHandler, requestHandler } from 'mediatr-ts';
import { logger } from './shared/utils/helpers/loggers';
import mediatR from './shared/medaitR/index';
import { DataResponse, DataResponseFactory } from './shared/models/response/data.Response';
import { DtoValidation, IDtoValidation } from './shared/utils/validations/dto';
export interface IAdd {
	add(a: number, b: number): Result<number, ResultError>;
}

@Service()
export class Add implements IAdd {
	public add(a: number, b: number): Result<number, ResultError> {
		console.log(`env: ${process.env.NODE_ENV}`);
		console.log(`env: ${NODE_ENV}`);

		if (a <= 0 || b <= 0)
			return new Err(new ResultError(StatusCodes.BAD_REQUEST, 'Invalid input'));

		return new Ok(a + b);
	}
}

export class AddRequestDTO {
	@IsNumber()
	@IsPositive()
	@Type(() => Number)
	a?: number;

	@IsNumber()
	@IsPositive()
	@Type(() => Number)
	b?: number;
}

export class AddResponseDTO {
	result?: number;
}

export class AddCommand extends RequestData<DataResponse<AddResponseDTO | null>> {
	public constructor(addRequest: AddRequestDTO) {
		super();
		this._addRequest = addRequest;
	}

	private _addRequest: AddRequestDTO;
	public get addRequest(): AddRequestDTO {
		return this._addRequest;
	}
}

@requestHandler(AddCommand)
export class AddCommandHandler
	implements RequestHandler<AddCommand, DataResponse<AddResponseDTO | null>>
{
	private readonly _add: IAdd;
	private readonly _dtoValidator: IDtoValidation<AddRequestDTO>;

	public constructor() {
		this._add = Container.get(Add);
		this._dtoValidator = Container.get(DtoValidation<AddRequestDTO>);
	}
	public async handle(value: AddCommand): Promise<DataResponse<AddResponseDTO | null>> {
		try {
			// Validate DTO.
			//var validateResult=await validateOrRejectAsync<AddRequestDTO>(value.addRequest);
			var validateResult = await this._dtoValidator.handleAsync({
				dto: value.addRequest,
				dtoClass: AddRequestDTO,
			});
			if (validateResult.isErr())
				return Promise.resolve(
					DataResponseFactory.Response(
						false,
						validateResult.error.statusCode,
						null,
						validateResult.error.message
					)
				);

			// Call Add Service
			var result = this._add.add(value?.addRequest?.a ?? 0, value.addRequest.b ?? 0);

			if (result.isErr())
				return Promise.resolve(
					DataResponseFactory.Response(
						false,
						result.error.statusCode,
						null,
						result.error.message
					)
				);

			return Promise.resolve(
				DataResponseFactory.Response(true, StatusCodes.OK, { result: result.value })
			);
		} catch (ex) {
			const error = ex as Error;
			return Promise.resolve(
				DataResponseFactory.Response(
					false,
					StatusCodes.INTERNAL_SERVER_ERROR,
					null,
					error.message
				)
			);
		}
	}
}

export class Main {
	public async addCall(a: number, b: number): Promise<DataResponse<AddResponseDTO | null>> {
		const addRequestDTO: AddRequestDTO = new AddRequestDTO();
		addRequestDTO.a = a;
		addRequestDTO.b = b;
		logger.info('Hello');
		return await mediatR.send(new AddCommand(addRequestDTO));
	}
}
