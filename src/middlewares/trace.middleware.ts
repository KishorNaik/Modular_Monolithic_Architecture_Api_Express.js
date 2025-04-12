import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import cls from 'cls-hooked';

export const namespace = cls.createNamespace('namespace_trace');

export default function traceMiddleware(req: Request, res: Response, next: NextFunction): void {
	if (req.method === 'OPTIONS') {
		next();
		return;
	}

	namespace.bind(req);
	namespace.bind(res);

	const traceId = req.query.traceId ? req.params.traceId : uuidv4();
	req['traceId'] = traceId;

	namespace.run(() => {
		namespace.set('traceId', traceId);
		res.header('x-request-id', traceId); // <-- return traceId in headers

		next();
	});
}
