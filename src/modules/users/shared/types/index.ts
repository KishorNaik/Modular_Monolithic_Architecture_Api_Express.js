import { StatusEnum } from '@/shared/models/enums/status.enum';
import { BoolEnum } from '@kishornaik/mma_db/dist/core/shared/models/enums/bool.enum';

// @region Types
export interface IUsers {
	identifier?: string;
	firstName?: string;
	lastName?: string;
	clientId?: string;
	status?: StatusEnum;
	communication?: IUserCommunication;
	keys?: IUserKeys;
	credentials?: IUserCredentials;
	settings?: IUserSettings;
	version?: number;
	created_date?: Date;
	modified_date?: Date;
}

export interface IUserCommunication {
	identifier?: string;
	email?: string;
	mobileNo?: string;
	userId?: string;
	status?: StatusEnum;
}

export interface IUserKeys {
	identifier?: string;
	refresh_token?: string;
	refresh_Token_expires_at?: Date;
	aesSecretKey?: string;
	hmacSecretKey?: string;
	userId?: string;
	status?: StatusEnum;
}

export interface IUserCredentials {
	identifier?: string;
	username?: string;
	salt?: string;
	hash?: string;
	userId?: string;
	status?: StatusEnum;
}

export interface IUserSettings {
	identifier?: string;
	emailVerificationToken?: string;
	isEmailVerified?: BoolEnum;
	isVerificationEmailSent?: BoolEnum;
	isWelcomeEmailSent?: BoolEnum;
	userId?: string;
	status?: StatusEnum;
}
// @endregion
