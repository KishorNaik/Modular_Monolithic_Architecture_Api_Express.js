import { IUsers } from '@/modules/users/shared/types';
import { sealed } from '@/shared/utils/decorators/sealed';
import { IServiceHandlerAsync } from '@/shared/utils/helpers/services';
import { Service } from 'typedi';
import { UserSignInResponseDto } from '../../../contracts';
import { ResultError, ResultExceptionFactory } from '@/shared/utils/exceptions/results';
import { Ok, Result } from 'neverthrow';
import { StatusCodes } from 'http-status-codes';

export interface IMapUserSignInResponseServiceParameters {
	users: IUsers;
	token: {
		accessToken: string;
		refreshToken: string;
	};
}

export interface IMapUserSignInResponseService
	extends IServiceHandlerAsync<IMapUserSignInResponseServiceParameters, UserSignInResponseDto> {}

@sealed
@Service()
export class MapUserSignInResponseService implements IMapUserSignInResponseService {
	public async handleAsync(
		params: IMapUserSignInResponseServiceParameters
	): Promise<Result<UserSignInResponseDto, ResultError>> {
		try {
			// @Guard
			if (!params)
				return ResultExceptionFactory.error(StatusCodes.BAD_REQUEST, 'Invalid params');

			if (!params.users)
				return ResultExceptionFactory.error(StatusCodes.BAD_REQUEST, 'Invalid users');

			const { users, token } = params;

			// Map
			const userSignInResponseDto: UserSignInResponseDto = new UserSignInResponseDto();
			userSignInResponseDto.identifier = users.identifier;
			userSignInResponseDto.clientId = users.clientId;
			userSignInResponseDto.email = users.communication.email;
			userSignInResponseDto.firstName = users.firstName;
			userSignInResponseDto.lastName = users.lastName;
			userSignInResponseDto.fullName = `${users.firstName} ${users.lastName}`;
			userSignInResponseDto.userName = users.credentials.username;
			userSignInResponseDto.keys = {
				aes: users.keys.aesSecretKey,
				hmac: users.keys.hmacSecretKey,
			};
			userSignInResponseDto.tokens = {
				accessToken: token.accessToken,
				refreshToken: token.refreshToken,
			};

			return new Ok(userSignInResponseDto);
		} catch (ex) {
			const error = ex as Error;
			return ResultExceptionFactory.error(StatusCodes.INTERNAL_SERVER_ERROR, error.message);
		}
	}
}
