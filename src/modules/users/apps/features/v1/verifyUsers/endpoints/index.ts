import { StatusCodes } from 'http-status-codes';
import { Get, HttpCode, JsonController, OnUndefined, Param, Res } from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';
import { Response } from 'express';
import {
	DataResponse as ApiDataResponse,
	DataResponse,
	DataResponseFactory,
} from '@/shared/models/response/data.Response';
import { VerifyUserRequestDto, VerifyUserResponseDto } from '../contracts';
import { RequestData, RequestHandler, requestHandler } from 'mediatr-ts';
import medaitR from '@/shared/medaitR';
import { sealed } from '@/shared/utils/decorators/sealed';
import { AesResponseDto } from '@/shared/models/response/aes.ResponseDto';
import { getQueryRunner, UserSettingsEntity } from '@kishornaik/mma_db';
import { VerifyUserValidationRequestService } from './services/validations';
import Container from 'typedi';
import { MapVerifyUserRequestDtoToEntityService } from './services/mapEntity';
import { GetEmailVerificationTokenServiceResult, IsEmailTokenValidService } from './services/db';
import { IfTokenValidService } from './services/IfTokenValid';
import {
	IfTokenIsNotValidService,
	IIfTokenIsNotValidServiceResult,
} from './services/IfTokenNotValid';
import { IUsers } from '@/modules/users/shared/types';
import {
	UserVerificationTokenEmailIntegrationEventRequestDto,
	UserVerificationTokenEmailIntegrationEventService,
} from '@/modules/notiifcations/apps/features/v1/userVerificationTokenEmail';
import { VerifyUserEncryptResponseService } from './services/encryptResponse';
import { ENCRYPTION_KEY } from '@/config';
import { logConstruct, logger } from '@/shared/utils/helpers/loggers';

// @region Controller
@JsonController('/api/v1/users')
@OpenAPI({ tags: ['users'] })
export class VerifyUserController {
	@Get('/verify/:token')
	@OpenAPI({ summary: 'Verify user by email verification token', tags: ['users'] })
	@HttpCode(StatusCodes.OK)
	@OnUndefined(StatusCodes.BAD_REQUEST)
	public async verifyAsync(@Param('token') token: string, @Res() res: Response) {
		const verifyUserRequestDto: VerifyUserRequestDto = new VerifyUserRequestDto();
		verifyUserRequestDto.emailToken = token;

		const response = await medaitR.send<ApiDataResponse<AesResponseDto>>(
			new VerifyUserQuery(verifyUserRequestDto)
		);
		return res.status(response.StatusCode).json(response);
	}
}

// @endregion

// @region Query
export class VerifyUserQuery extends RequestData<ApiDataResponse<AesResponseDto>> {
	private readonly _request: VerifyUserRequestDto;

	public constructor(request: VerifyUserRequestDto) {
		super();
		this._request = request;
	}

	public get request(): VerifyUserRequestDto {
		return this._request;
	}
}

// @endregion

// @region Query Handler
@sealed
@requestHandler(VerifyUserQuery)
export class VerifyUserQueryHandler
	implements RequestHandler<VerifyUserQuery, ApiDataResponse<AesResponseDto>>
{
	private readonly _verifyUserValidationRequestService: VerifyUserValidationRequestService;
	private readonly _mapVerifyUserRequestDtoToEntityService: MapVerifyUserRequestDtoToEntityService;
	private readonly _isEmailTokenValidService: IsEmailTokenValidService;
	private readonly _ifTokenValidService: IfTokenValidService;
	private readonly _ifTokenIsNotValidService: IfTokenIsNotValidService;
	private readonly _verifyUserEncryptResponseService: VerifyUserEncryptResponseService;

	public constructor() {
		this._verifyUserValidationRequestService = Container.get(
			VerifyUserValidationRequestService
		);
		this._mapVerifyUserRequestDtoToEntityService = Container.get(
			MapVerifyUserRequestDtoToEntityService
		);
		this._isEmailTokenValidService = Container.get(IsEmailTokenValidService);
		this._ifTokenValidService = Container.get(IfTokenValidService);
		this._ifTokenIsNotValidService = Container.get(IfTokenIsNotValidService);
		this._verifyUserEncryptResponseService = Container.get(VerifyUserEncryptResponseService);
	}

	public async handle(value: VerifyUserQuery): Promise<ApiDataResponse<AesResponseDto>> {
		const queryRunner = getQueryRunner();
		await queryRunner.connect();
		let message: string;
		try {
			// @Gaurd
			if (!value) return DataResponseFactory.error(StatusCodes.BAD_REQUEST, 'Invalid Query');

			if (!value.request)
				return DataResponseFactory.error(StatusCodes.BAD_REQUEST, 'Invalid request');

			const request: VerifyUserRequestDto = await value.request;

			// Validation Service
			const verifyUserRequestValidationServiceResult =
				await this._verifyUserValidationRequestService.handleAsync({
					dto: request,
					dtoClass: VerifyUserRequestDto,
				});
			if (verifyUserRequestValidationServiceResult.isErr())
      {
        logger.error(logConstruct(`VerifyUserQueryHandler`, `VerifyUserValidationRequestService`, verifyUserRequestValidationServiceResult.error.message));
				return DataResponseFactory.error(
					verifyUserRequestValidationServiceResult.error.status,
					verifyUserRequestValidationServiceResult.error.message
				);
      }

      logger.info(logConstruct(`VerifyUserQueryHandler`, `VerifyUserValidationRequestService`, `Validation Success`));

			// Map Entity Service
			const mapVerifyUserRequestDtoToEntityServiceResult =
				await this._mapVerifyUserRequestDtoToEntityService.handleAsync(request);
			if (mapVerifyUserRequestDtoToEntityServiceResult.isErr())
      {
        logger.error(logConstruct(`VerifyUserQueryHandler`, `MapVerifyUserRequestDtoToEntityService`, mapVerifyUserRequestDtoToEntityServiceResult.error.message));
				return DataResponseFactory.error(
					mapVerifyUserRequestDtoToEntityServiceResult.error.status,
					mapVerifyUserRequestDtoToEntityServiceResult.error.message
				);
      }

			const userSettingsEntity: UserSettingsEntity =
				mapVerifyUserRequestDtoToEntityServiceResult.value;

      logger.info(logConstruct(`VerifyUserQueryHandler`, `MapVerifyUserRequestDtoToEntityService`, `Mapping Success`));

			// Check if Token is expired or not
			const isValidTokenServiceResult =
				await this._isEmailTokenValidService.handleAsync(userSettingsEntity);
			if (isValidTokenServiceResult.isErr())
      {
        logger.error(logConstruct(`VerifyUserQueryHandler`, `IsEmailTokenValidService`, isValidTokenServiceResult.error.message));
				return DataResponseFactory.error(
					isValidTokenServiceResult.error.status,
					isValidTokenServiceResult.error.message
				);
      }
			const isValidTokenResult: GetEmailVerificationTokenServiceResult =
				isValidTokenServiceResult.value;
      logger.info(logConstruct(`VerifyUserQueryHandler`, `IsEmailTokenValidService`, `Email Token Validity Check Success: Result:${isValidTokenResult?.isValidToken}`));

			await queryRunner.startTransaction();
      logger.info(logConstruct(`VerifyUserQueryHandler`, `handle`, `Start Transaction`));

			if (isValidTokenResult.isValidToken) {
				// If Token not Expired and it's valid then update user status to active (In all User Tables) & Remove the email token and expiration data as Null
				const ifTokenValidServiceResult = await this._ifTokenValidService.handleAsync({
					userId: isValidTokenResult.userId,
					queryRunner: queryRunner,
				});
				if (ifTokenValidServiceResult.isErr())
        {
          logger.error(logConstruct(`VerifyUserQueryHandler`, `IfTokenValidService`, ifTokenValidServiceResult.error.message));
					return DataResponseFactory.error(
						ifTokenValidServiceResult.error.status,
						ifTokenValidServiceResult.error.message
					);
        }

				message = ifTokenValidServiceResult.value.message;
        logger.info(logConstruct(`VerifyUserQueryHandler`, `IfTokenValidService`, `Token Validity Check Success: Result:${message}`));

				await queryRunner.commitTransaction();
        logger.info(logConstruct(`VerifyUserQueryHandler`, `handle`, `Commit Transaction`));
			} else {
				// If token is expired then generate new Token (Db Service)
				const ifTokenIsNotValidServiceResult =
					await this._ifTokenIsNotValidService.handleAsync({
						userId: isValidTokenResult.userId,
						queryRunner: queryRunner,
					});
				if (ifTokenIsNotValidServiceResult.isErr())
        {
          logger.error(logConstruct(`VerifyUserQueryHandler`, `IfTokenIsNotValidService`, ifTokenIsNotValidServiceResult.error.message));
					return DataResponseFactory.error(
						ifTokenIsNotValidServiceResult.error.status,
						ifTokenIsNotValidServiceResult.error.message
					);
        }

				const result: IIfTokenIsNotValidServiceResult =
					ifTokenIsNotValidServiceResult.value;
				const users: IUsers = result.users;

        logger.info(logConstruct(`VerifyUserQueryHandler`, `IfTokenIsNotValidService`, `Token Validity Check Success: Result:${result?.message}`));

				await queryRunner.commitTransaction();
        logger.info(logConstruct(`VerifyUserQueryHandler`, `handle`, `Commit Transaction`));

				// Send Email to User Notification
				// User Verification Token Email Send Integration Event
				const userVerificationTokenEmailIntegrationEventRequestDto: UserVerificationTokenEmailIntegrationEventRequestDto =
					new UserVerificationTokenEmailIntegrationEventRequestDto();
				userVerificationTokenEmailIntegrationEventRequestDto.email =
					users.communication.email;
				userVerificationTokenEmailIntegrationEventRequestDto.fullName = `${users.firstName} ${users.lastName}`;
				userVerificationTokenEmailIntegrationEventRequestDto.userId = users.identifier;
				userVerificationTokenEmailIntegrationEventRequestDto.emailVerificationToken =
					users.settings.emailVerificationToken;
				const userVerificationTokenEmailIntegrationEventService: UserVerificationTokenEmailIntegrationEventService =
					new UserVerificationTokenEmailIntegrationEventService(
						userVerificationTokenEmailIntegrationEventRequestDto
					);
				await medaitR.publish(userVerificationTokenEmailIntegrationEventService);

        logger.info(logConstruct(`VerifyUserQueryHandler`, `UserVerificationTokenEmailIntegrationEventService`, `User Verification Token Email Send Integration Event Success`));

				message = result.message;
			}

			// Map Response
			const verifyUserResponseDto: VerifyUserResponseDto = new VerifyUserResponseDto();
			verifyUserResponseDto.message = message;

			// Encryption Response
			const verifyUserEncryptResponseServiceResult =
				await this._verifyUserEncryptResponseService.handleAsync({
					data: verifyUserResponseDto,
					key: ENCRYPTION_KEY,
				});
			if (verifyUserEncryptResponseServiceResult.isErr())
      {
        logger.error(logConstruct(`VerifyUserQueryHandler`, `VerifyUserEncryptResponseService`, verifyUserEncryptResponseServiceResult.error.message));
				return DataResponseFactory.error(
					verifyUserEncryptResponseServiceResult.error.status,
					verifyUserEncryptResponseServiceResult.error.message
				);
      }
      logger.info(logConstruct(`VerifyUserQueryHandler`, `VerifyUserEncryptResponseService`, `Encrypt Success`));

			return DataResponseFactory.Response(
				true,
				StatusCodes.OK,
				verifyUserEncryptResponseServiceResult.value.aesResponseDto
			);
		} catch (ex) {
			const error = ex as Error;
      logger.error(logConstruct(`VerifyUserQueryHandler`, `handle`, error.message,ex));
			if (queryRunner.isTransactionActive) {
				await queryRunner.rollbackTransaction();
        logger.warn(logConstruct(`VerifyUserQueryHandler`, `handle`, `Rollback Transaction`));
			}
			return DataResponseFactory.error(StatusCodes.INTERNAL_SERVER_ERROR, error.message);
		} finally {
			await queryRunner.release();
      logger.info(logConstruct(`VerifyUserQueryHandler`, `handle`, `Release Transaction`));
		}
	}
}

// @endregion
