import { BoolEnum } from "@kishornaik/mma_db/dist/core/shared/models/enums/bool.enum";

// @region Types
export interface IUsers{
  identifier?:string;
  firstName?:string;
  lastName?:string;
  clientId?:string;
  communication?:IUserCommunication;
  keys?:IUserKeys;
  credentials?:IUserCredentials;
  settings?:IUserSettings;
  version?: number;
}

export interface IUserCommunication{
  identifier?:string;
  email?:string;
  mobileNo?:string;
}

export interface IUserKeys{
  identifier?:string;
  refresh_token?: string;
  refresh_Token_expires_at?: Date;
  aesSecretKey?: string;
  hmacSecretKey?: string;
}

export interface IUserCredentials{
  identifier?:string;
  username?: string;
	salt?: string;
	hash?: string;
}

export interface IUserSettings{
  identifier?:string;
	emailVerificationToken?: string;
	isEmailVerified?: BoolEnum;
	isVerificationEmailSent?: BoolEnum;
	isWelcomeEmailSent?: BoolEnum;
}
// @endregion




