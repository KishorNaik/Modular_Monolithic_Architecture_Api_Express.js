import { IUsers } from '@/modules/users/shared/types';
import { UserTokenProviderService } from '@/shared/services/users/userTokenProvider.service';
import { sealed } from '@/shared/utils/decorators/sealed';
import { ResultError, ResultExceptionFactory } from '@/shared/utils/exceptions/results';
import { IServiceHandlerVoidAsync } from '@/shared/utils/helpers/services';
import { StatusCodes } from 'http-status-codes';
import { Ok, Result } from 'neverthrow';
import Container, { Service } from 'typedi';

export interface IsValidJwtAndRefreshTokenServiceParameters {
	token: {
		accessToken: string;
		refreshToken: string;
	};
	users: IUsers;
}

export interface IsJwtAndRefreshTokenService
	extends IServiceHandlerVoidAsync<IsValidJwtAndRefreshTokenServiceParameters> {}

@sealed
@Service()
export class IsValidJwtAndRefreshTokenService implements IsJwtAndRefreshTokenService {
	private readonly _userTokenProviderService: UserTokenProviderService;

	public constructor() {
		this._userTokenProviderService = Container.get(UserTokenProviderService);
	}

	public async handleAsync(
		params: IsValidJwtAndRefreshTokenServiceParameters
	): Promise<Result<undefined, ResultError>> {
		try {
			//@Guard
			if (!params)
				return ResultExceptionFactory.error(StatusCodes.BAD_REQUEST, 'Invalid params');
			if (!params.token)
				return ResultExceptionFactory.error(StatusCodes.BAD_REQUEST, 'Invalid token');
			if (!params.users)
				return ResultExceptionFactory.error(StatusCodes.BAD_REQUEST, 'Invalid users');

			const { accessToken, refreshToken } = params.token;
			const { keys } = params.users;

			// Check if refresh token is matched or not
			const isRefreshTokenMatched = refreshToken === keys.refresh_token;
			if (!isRefreshTokenMatched)
				return ResultExceptionFactory.error(
					StatusCodes.UNAUTHORIZED,
					`unauthorized access`
				);

      // Get User Id by access token and refresh Token
			const getUserIdByAccessTokenResultPromise =this._userTokenProviderService.getUserIdByJwtToken(accessToken);
      const getUserIdByRefreshTokenResultPromise=this._userTokenProviderService.getUserIdByJwtToken(refreshToken);
      const [getUserIdAccessTokenResult, getUserIdRefreshTokenResult] = await Promise.all([getUserIdByAccessTokenResultPromise, getUserIdByRefreshTokenResultPromise])

			// Check if user id is matched or not by access token
			let isUserIdMatched = getUserIdAccessTokenResult === params.users.identifier;
			if (!isUserIdMatched)
				return ResultExceptionFactory.error(
					StatusCodes.UNAUTHORIZED,
					`unauthorized access`
				);

      // Check if user is matched or not by refresh token
      isUserIdMatched=getUserIdRefreshTokenResult===params.users.identifier;
      if (!isUserIdMatched)
        return ResultExceptionFactory.error(
          StatusCodes.UNAUTHORIZED,
          `unauthorized access`
        );

			return new Ok(undefined);
		} catch (ex) {
			const error = ex as Error;
			return ResultExceptionFactory.error(StatusCodes.INTERNAL_SERVER_ERROR, error.message);
		}
	}
}
