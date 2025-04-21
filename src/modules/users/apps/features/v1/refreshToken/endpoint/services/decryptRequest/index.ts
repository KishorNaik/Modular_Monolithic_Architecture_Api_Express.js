import { sealed } from '@/shared/utils/decorators/sealed';
import { AesDecryptWrapper } from '@/shared/utils/helpers/aes';
import { Service } from 'typedi';
import { RefreshTokenRequestDto } from '../../../contracts';

@sealed
@Service()
export class RefreshTokenDecryptRequestService extends AesDecryptWrapper<RefreshTokenRequestDto> {
	public constructor() {
		super();
	}
}
