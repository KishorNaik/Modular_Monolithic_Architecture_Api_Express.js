import { sealed } from '@/shared/utils/decorators/sealed';
import { DtoValidation } from '@/shared/utils/validations/dto';
import { Service } from 'typedi';
import { DeactivateUserRequestDto } from '../../../contracts';

@sealed
@Service()
export class DeactivateUserRequestValidationService extends DtoValidation<DeactivateUserRequestDto> {
	public constructor() {
		super();
	}
}
