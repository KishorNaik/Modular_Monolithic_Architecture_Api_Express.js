import morgan from 'morgan';
import { Request, Response } from 'express';
import { stream } from '@/shared/utils/helpers/loggers';

// Create the morgan middleware with custom format and stream
const httpLoggerMiddleware = morgan(
	'Method::method Url::url Status::status :res[content-length] - :response-time ms Request::body QueryString::query QueryPath::params',
	{ stream }
);

// Custom tokens to log request and response details
morgan.token('query', (req: Request) => JSON.stringify(req.query));
morgan.token('params', (req: Request) => JSON.stringify(req.params));
morgan.token('body', (req: Request) => JSON.stringify(req.body));

export default httpLoggerMiddleware;
