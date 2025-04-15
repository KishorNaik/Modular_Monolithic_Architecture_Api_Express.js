import Container from 'typedi';
import { CreateUserController } from './apps/features/v1/createUsers';
import { UpdateUserSettingsService, UpdateUserVersionService } from '@kishornaik/mma_db';

Container.set<UpdateUserSettingsService>(
	UpdateUserSettingsService,
	new UpdateUserSettingsService()
);
Container.set<UpdateUserVersionService>(UpdateUserVersionService, new UpdateUserVersionService());

export const userModule: Function[] = [CreateUserController];
