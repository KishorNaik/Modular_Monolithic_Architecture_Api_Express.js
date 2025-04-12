import { expressjwt } from 'express-jwt';
import { DataResponseFactory } from '@/shared/models/response/data.Response';
import { SECRET_KEY } from '@/config';
import Container from 'typedi';
import {
	IUserTokenProviderService,
	UserTokenProviderService,
} from '@/shared/services/users/userTokenProvider.service';

export const authenticateJwt = expressjwt({ secret: SECRET_KEY, algorithms: ['HS256'] });

export function authorizeRole(role: string) {
	return function (req: any, res: any, next: any) {
		const userProviderService: IUserTokenProviderService =
			Container.get(UserTokenProviderService);

		const roleFromToken = userProviderService.getUserRole(req);

		if (roleFromToken !== role) {
			const response = DataResponseFactory.Response<undefined>(
				false,
				403,
				undefined,
				'Forbidden - You do not have permission to access this resource'
			);
			return res.status(403).json(response);
		}
		next();
	};
}
