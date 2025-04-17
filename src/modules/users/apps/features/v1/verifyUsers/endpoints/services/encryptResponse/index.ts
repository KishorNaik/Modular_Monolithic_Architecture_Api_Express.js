import { sealed } from '@/shared/utils/decorators/sealed';
import { AesEncryptWrapper } from '@/shared/utils/helpers/aes';
import { Service } from 'typedi';
import { VerifyUserResponseDto } from '../../../contracts';

@sealed
@Service()
export class VerifyUserEncryptResponseService extends AesEncryptWrapper<VerifyUserResponseDto> {
	public constructor() {
		super();
	}
}
