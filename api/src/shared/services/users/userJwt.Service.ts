import { REFRESH_SECRET_KEY, SECRET_KEY } from '@/config';
import { StatusCodes } from 'http-status-codes';
import jwt from 'jsonwebtoken';
import { Err, Ok, Result } from 'neverthrow';
import Container, { Service } from 'typedi';
import { ResultError } from '../../utils/exceptions/results';

export type tokenTuples = [accessToken: string, refreshToken: string];

export interface IClaims {
	id: string;
	role?: string;
}

export interface IJwtService {
	generateTokenAsync(claims: IClaims): Promise<string>;
	generateRefreshTokenAsync(claims: IClaims): Promise<string>;
	getClaimsFromRefreshTokenAsync(refreshToken: string): Promise<IClaims>;
	getClaimsFromAccessTokenAsync(accessToken: string): Promise<IClaims>;
}

@Service()
export class JwtService implements IJwtService {
	public generateTokenAsync(claims: IClaims): Promise<string> {
		return new Promise((resolve, reject) => {
			try {
				const token: string = jwt.sign(claims, SECRET_KEY, {
					expiresIn: '1h',
					algorithm: 'HS256',
				});
				resolve(token);
			} catch (ex) {
				reject(ex);
			}
		});
	}

	public generateRefreshTokenAsync(claims: IClaims): Promise<string> {
		return new Promise((resolve, reject) => {
			try {
				const token: string = jwt.sign(claims, REFRESH_SECRET_KEY, {
					expiresIn: '7d',
					algorithm: 'HS256',
				});
				resolve(token);
			} catch (ex) {
				reject(ex);
			}
		});
	}

	public getClaimsFromRefreshTokenAsync(refreshToken: string): Promise<IClaims> {
		return new Promise((resolve, reject) => {
			try {
				const decoded: IClaims = jwt.verify(refreshToken, REFRESH_SECRET_KEY) as IClaims;
				resolve(decoded);
			} catch (ex) {
				reject(ex);
			}
		});
	}

	public getClaimsFromAccessTokenAsync(accessToken: string): Promise<IClaims> {
		return new Promise((resolve, reject) => {
			try {
				const decoded: IClaims = jwt.verify(accessToken, SECRET_KEY) as IClaims;
				resolve(decoded);
			} catch (ex) {
				reject(ex);
			}
		});
	}
}

export interface IJwtExtendedService {
	generateJwtTokenAsync(claims: IClaims): Promise<Result<tokenTuples, ResultError>>;
}

@Service()
export class JwtExtendedService implements IJwtExtendedService {
	private readonly jwtService: IJwtService;

	public constructor() {
		this.jwtService = Container.get(JwtService);
	}

	public async generateJwtTokenAsync(claims: IClaims): Promise<Result<tokenTuples, ResultError>> {
		try {
			const generateJwtTokenPromise = this.jwtService.generateTokenAsync(claims);

			const generateRefreshTokenPromise = this.jwtService.generateRefreshTokenAsync(claims);

			const [generateJwtTokenResult, generateRefreshTokenResult] = await Promise.all([
				generateJwtTokenPromise,
				generateRefreshTokenPromise,
			]);

			if (!generateJwtTokenResult)
				return new Err(
					new ResultError(StatusCodes.INTERNAL_SERVER_ERROR, 'jwt token generation error')
				);

			if (!generateRefreshTokenResult)
				return new Err(
					new ResultError(
						StatusCodes.INTERNAL_SERVER_ERROR,
						'refresh token generation error'
					)
				);

			const tokensValue: tokenTuples = [generateJwtTokenResult, generateRefreshTokenResult];
			return new Ok(tokensValue);
		} catch (ex) {
			return new Err(new ResultError(StatusCodes.INTERNAL_SERVER_ERROR, ex.message));
		}
	}
}
