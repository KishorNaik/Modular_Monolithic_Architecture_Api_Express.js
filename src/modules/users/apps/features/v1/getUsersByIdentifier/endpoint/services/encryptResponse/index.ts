import { sealed } from '@/shared/utils/decorators/sealed';
import { AesEncryptWrapper } from '@/shared/utils/helpers/aes';
import { Service } from 'typedi';
import { GetUserByIdentifierResponseDto } from '../../../contracts/Index';

@sealed
@Service()
export class GetUsersByIdentifierResponseEncryptService extends AesEncryptWrapper<GetUserByIdentifierResponseDto> {
	public constructor() {
		super();
	}
}
