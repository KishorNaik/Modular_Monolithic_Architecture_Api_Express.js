import { Request } from 'express';
import { Service } from 'typedi';
import jwt from 'jsonwebtoken';
import { HttpException } from '@/shared/utils/exceptions/http';
import { Result } from 'neverthrow';
import { ParamsDictionary } from 'express-serve-static-core';
import { ParsedQs } from 'qs';
import { SECRET_KEY } from '@/config';

export interface IClaims {
	id: string;
	role?: string;
}

export interface IUserTokenProviderService {
	getUserId(request: Request): string;
	getUserIdByJwtToken(accessOrRefreshToken: string): string;
	getUserRole(request: Request): string;
	getUserRoleByJwtToken(accessOrRefreshToken: string): string;
}

@Service()
export class UserTokenProviderService implements IUserTokenProviderService {
	getUserIdByJwtToken(accessOrRefreshToken: string): string {
		const decoded: IClaims = jwt.decode(accessOrRefreshToken) as IClaims;
		return decoded.id;
	}
	getUserRoleByJwtToken(accessOrRefreshToken: string): string {
		const decoded: IClaims = jwt.decode(accessOrRefreshToken) as IClaims;
		return decoded.role;
	}
	public getUserId(request: Request): string {
		const decoded: IClaims = jwt.decode(request.headers.authorization.split(' ')[1]) as IClaims;
		return decoded.id;
	}

	public getUserRole(request: Request): string {
		const decoded: IClaims = jwt.decode(request.headers.authorization.split(' ')[1]) as IClaims;
		return decoded.role;
	}
}
