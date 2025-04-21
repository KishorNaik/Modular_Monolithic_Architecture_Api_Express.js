import { sealed } from '@/shared/utils/decorators/sealed';
import { AesEncryptWrapper } from '@/shared/utils/helpers/aes';
import { Service } from 'typedi';
import { RefreshTokenResponseDto } from '../../../contracts';

@sealed
@Service()
export class UpdateRefreshTokenEncryptResponseService extends AesEncryptWrapper<RefreshTokenResponseDto> {
	public constructor() {
		super();
	}
}
