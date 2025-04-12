import { DemoAesRequestDto } from '@/modules/demo/apps/contracts/v1/demoAes/index.Contract';
import { ResultError } from '@/shared/utils/exceptions/results';
import { IServiceHandlerVoidAsync } from '@/shared/utils/helpers/services';
import { DtoValidation, IDtoValidation } from '@/shared/utils/validations/dto';
import { HttpStatusCode } from 'axios';
import { StatusCodes } from 'http-status-codes';
import { Err, Ok, Result } from 'neverthrow';
import Container, { Service } from 'typedi';

export interface IAseDemoValidationServiceParameters {
	request: DemoAesRequestDto;
}

export interface IAseDemoValidationService
	extends IServiceHandlerVoidAsync<IAseDemoValidationServiceParameters> {}

@Service()
export class AesDemoValidationService implements IAseDemoValidationService {
	private readonly _dtoValidation: IDtoValidation<DemoAesRequestDto>;

	public constructor() {
		this._dtoValidation = Container.get(DtoValidation<DemoAesRequestDto>);
	}

	public async handleAsync(
		params: IAseDemoValidationServiceParameters
	): Promise<Result<undefined, ResultError>> {
		try {
			if (!params)
				return new Err(new ResultError(StatusCodes.BAD_REQUEST, 'parameter is null'));

			if (!params.request)
				return new Err(new ResultError(StatusCodes.BAD_REQUEST, 'request is null'));

			const result = await this._dtoValidation.handleAsync({
				dto: params.request,
				dtoClass: DemoAesRequestDto,
			});

			if (result.isErr()) return new Err(result.error);

			return new Ok(undefined);
		} catch (ex) {
			return new Err(new ResultError(StatusCodes.INTERNAL_SERVER_ERROR, ex.message));
		}
	}
}
