import { sealed } from '@/shared/utils/decorators/sealed';
import { AesDecryptWrapper } from '@/shared/utils/helpers/aes';
import { Service } from 'typedi';
import { UpdateUserRequestDto } from '../../../contracts';

@sealed
@Service()
export class UpdateUserDecryptRequestService extends AesDecryptWrapper<UpdateUserRequestDto> {
	public constructor() {
		super();
	}
}
