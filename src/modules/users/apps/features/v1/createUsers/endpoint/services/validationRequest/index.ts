import { sealed } from '@/shared/utils/decorators/sealed';
import { DtoValidation } from '@/shared/utils/validations/dto';
import { Service } from 'typedi';
import { CreateUserRequestDto } from '../../../contracts';

@sealed
@Service()
export class CreateUserRequestValidationService extends DtoValidation<CreateUserRequestDto> {
	public constructor() {
		super();
	}
}
