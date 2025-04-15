import { sealed } from '@/shared/utils/decorators/sealed';
import { AesEncryptWrapper } from '@/shared/utils/helpers/aes';
import { Service } from 'typedi';
import { CreateUserResponseDto } from '../../../contracts';

@sealed
@Service()
export class CreateUserEncryptResponseService extends AesEncryptWrapper<CreateUserResponseDto> {
	public constructor() {
		super();
	}
}
