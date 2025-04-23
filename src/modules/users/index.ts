import Container from 'typedi';
import {
	UpdateUserCommunicationService,
	UpdateUserCredentialsService,
	UpdateUserKeysService,
	UpdateUserService,
	UpdateUserSettingsService,
	UpdateUserVersionService,
} from '@kishornaik/mma_db';
import { CreateUserController } from './apps/features/v1/createUsers';
import { VerifyUserController } from './apps/features/v1/verifyUsers';
import { UserSignInController } from './apps/features/v1/signIn';
import { GetUsersByIdentifierController } from './apps/features/v1/getUsersByIdentifier';
import { UpdateRefreshTokenController } from './apps/features/v1/refreshToken';
import { GetUsersController } from './apps/features/v1/getUsers/endpoint';

Container.set<UpdateUserSettingsService>(
	UpdateUserSettingsService,
	new UpdateUserSettingsService()
);
Container.set<UpdateUserService>(UpdateUserService, new UpdateUserService());
Container.set<UpdateUserCommunicationService>(
	UpdateUserCommunicationService,
	new UpdateUserCommunicationService()
);
Container.set<UpdateUserCredentialsService>(
	UpdateUserCredentialsService,
	new UpdateUserCredentialsService()
);
Container.set<UpdateUserKeysService>(UpdateUserKeysService, new UpdateUserKeysService());

Container.set<UpdateUserVersionService>(UpdateUserVersionService, new UpdateUserVersionService());

export const userModule: Function[] = [
	CreateUserController,
	VerifyUserController,
	UserSignInController,
	GetUsersByIdentifierController,
	UpdateRefreshTokenController,
  GetUsersController
];
