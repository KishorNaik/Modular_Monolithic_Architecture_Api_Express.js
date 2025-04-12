import {
	DemoAesRequestDto,
	DemoAesResponseDto,
} from '@/modules/demo/apps/contracts/v1/demoAes/index.Contract';
import { AesResponseDto } from '@/shared/models/response/aes.ResponseDto';
import { ResultError } from '@/shared/utils/exceptions/results';
import { AesEncryptWrapper, IAesEncryptWrapper } from '@/shared/utils/helpers/aes';
import { IServiceHandlerAsync } from '@/shared/utils/helpers/services';
import { HttpStatusCode } from 'axios';
import { StatusCodes } from 'http-status-codes';
import { Err, Ok, Result } from 'neverthrow';
import Container, { Service } from 'typedi';

export interface IAesDemoEncryptResponseServiceParameters {
	response: DemoAesResponseDto;
	key: string;
}

export interface IAesDemoEncryptResponseService
	extends IServiceHandlerAsync<IAesDemoEncryptResponseServiceParameters, AesResponseDto> {}

@Service()
export class AesDemoEncryptResponseService implements IAesDemoEncryptResponseService {
	private readonly _encryptWrapper: IAesEncryptWrapper<DemoAesResponseDto>;

	public constructor() {
		this._encryptWrapper = Container.get(AesEncryptWrapper<DemoAesResponseDto>);
	}

	public async handleAsync(
		params: IAesDemoEncryptResponseServiceParameters
	): Promise<Result<AesResponseDto, ResultError>> {
		try {
			if (!params)
				return new Err(new ResultError(StatusCodes.BAD_REQUEST, 'parameter is null'));

			if (!params.response)
				return new Err(new ResultError(StatusCodes.BAD_REQUEST, 'response is null'));

			if (!params.key)
				return new Err(new ResultError(StatusCodes.BAD_REQUEST, 'key is null'));

			const encryptedBody = await this._encryptWrapper.handleAsync({
				data: params.response,
				key: params.key,
			});
			if (encryptedBody.isErr()) return new Err(encryptedBody.error);

			const demoAesResponseDto: AesResponseDto = encryptedBody.value.aesResponseDto;
			return new Ok(demoAesResponseDto);
		} catch (ex) {
			return new Err(new ResultError(StatusCodes.INTERNAL_SERVER_ERROR, ex.message));
		}
	}
}
