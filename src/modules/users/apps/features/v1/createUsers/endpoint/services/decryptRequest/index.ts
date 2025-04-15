import { sealed } from '@/shared/utils/decorators/sealed';
import { AesDecryptWrapper } from '@/shared/utils/helpers/aes';
import { Service } from 'typedi';
import { CreateUserRequestDto } from '../../../contracts';

@sealed
@Service()
export class CreateUserDecryptRequestService extends AesDecryptWrapper<CreateUserRequestDto> {
	public constructor() {
		super();
	}
}
