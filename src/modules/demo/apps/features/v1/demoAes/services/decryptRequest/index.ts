import { AesRequestDto } from '@/shared/models/request/aes.RequestDto';
import Container, { Service } from 'typedi';
import { ResultError } from '@/shared/utils/exceptions/results';
import { Err, Ok, Result } from 'neverthrow';
import { StatusCodes } from 'http-status-codes';
import { IServiceHandlerAsync } from '@/shared/utils/helpers/services';
import { AesDecryptWrapper, IAesDecryptWrapper } from '@/shared/utils/helpers/aes';
import { DemoAesRequestDto } from '@/modules/demo/apps/contracts/v1/demoAes/index.Contract';

export interface IAseDemoDecryptServiceParameters {
	request: AesRequestDto;
	key: string;
}

export interface IAseDemoDecryptService
	extends IServiceHandlerAsync<IAseDemoDecryptServiceParameters, DemoAesRequestDto> {}

@Service()
export class AesDemoDecryptService implements IAseDemoDecryptService {
	private readonly _decryptWrapper: IAesDecryptWrapper<DemoAesRequestDto>;

	public constructor() {
		this._decryptWrapper = Container.get(AesDecryptWrapper<DemoAesRequestDto>);
	}

	public async handleAsync(
		params: IAseDemoDecryptServiceParameters
	): Promise<Result<DemoAesRequestDto, ResultError>> {
		try {
			if (!params)
				return new Err(new ResultError(StatusCodes.BAD_REQUEST, 'parameter is null'));

			if (!params.request)
				return new Err(new ResultError(StatusCodes.BAD_REQUEST, 'request is null'));

			if (!params.key)
				return new Err(new ResultError(StatusCodes.BAD_REQUEST, 'key is null'));

			const decryptedBody = await this._decryptWrapper.handleAsync({
				data: params.request.body,
				key: params.key,
			});
			if (decryptedBody.isErr()) return new Err(decryptedBody.error);

			const demoAesRequestDto: DemoAesRequestDto = decryptedBody.value;

			return new Ok(demoAesRequestDto);
		} catch (ex) {
			return new Err(new ResultError(StatusCodes.INTERNAL_SERVER_ERROR, ex.message));
		}
	}
}
