import { DataResponse } from '@/shared/models/response/data.Response';
import { sealed } from '@/shared/utils/decorators/sealed';
import { IServiceHandlerAsync } from '@/shared/utils/helpers/services';
import { UserEntity } from '@kishornaik/mma_db';
import { Service } from 'typedi';
import { ResultError, ResultExceptionFactory } from '@/shared/utils/exceptions/results';
import { Ok, Result } from 'neverthrow';
import { StatusCodes } from 'http-status-codes';
import { GetUserByIdentifierDomainEventResponseDto } from '../../../../../contracts/Index';

export interface IGetUserByIdentifierDomainEventMapService
	extends IServiceHandlerAsync<UserEntity, GetUserByIdentifierDomainEventResponseDto> {}

@sealed
@Service()
export class GetUserByIdentifiersDomainEventMapResponseService
	implements IGetUserByIdentifierDomainEventMapService
{
	public async handleAsync(
		params: UserEntity
	): Promise<Result<GetUserByIdentifierDomainEventResponseDto, ResultError>> {
		try {
			// @Guard
			if (!params)
				return ResultExceptionFactory.error(StatusCodes.BAD_REQUEST, 'Invalid params');

			const result: GetUserByIdentifierDomainEventResponseDto =
				new GetUserByIdentifierDomainEventResponseDto();
			result.user = {
				identifier: params.identifier,
				clientId: params.clientId,
				firstName: params.firstName,
				lastName: params.lastName,
				version: params.version,
				created_date: params.created_date,
				modified_date: params.modified_date,
				communication: {
					identifier: params.userCommunication.identifier,
					email: params.userCommunication.email,
					mobileNo: params.userCommunication.mobileNo,
					userId: params.userCommunication.userId,
				},
				credentials: {
					identifier: params.userCredentials.identifier,
					username: params.userCredentials.username,
					salt: params.userCredentials.salt,
					hash: params.userCredentials.hash,
					userId: params.userCredentials.userId,
				},
				keys: {
					identifier: params.userKeys.identifier,
					aesSecretKey: params.userKeys.aesSecretKey,
					hmacSecretKey: params.userKeys.hmacSecretKey,
					refresh_token: params.userKeys.refresh_token,
					refresh_Token_expires_at: params.userKeys.refresh_Token_expires_at,
					userId: params.userKeys.userId,
				},
			};

			return new Ok(result);
		} catch (ex) {
			const error = ex as Error;
			return ResultExceptionFactory.error(StatusCodes.INTERNAL_SERVER_ERROR, error.message);
		}
	}
}
