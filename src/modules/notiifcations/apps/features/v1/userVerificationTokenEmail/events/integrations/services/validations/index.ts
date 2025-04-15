import { sealed } from '@/shared/utils/decorators/sealed';
import { DtoValidation } from '@/shared/utils/validations/dto';
import { Service } from 'typedi';
import { UserVerificationTokenEmailIntegrationEventRequestDto } from '../../../../contracts';

@sealed
@Service()
export class UserVerificationTokenEmailIntegrationEventRequestValidationService extends DtoValidation<UserVerificationTokenEmailIntegrationEventRequestDto> {
	public constructor() {
		super();
	}
}
