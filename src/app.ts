import 'reflect-metadata';
import { defaultMetadataStorage } from 'class-transformer/cjs/storage';
import { validationMetadatasToSchemas } from 'class-validator-jsonschema';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import express from 'express';
import helmet from 'helmet';
import hpp from 'hpp';
import morgan from 'morgan';
import { useExpressServer, getMetadataArgsStorage } from 'routing-controllers';
import { routingControllersToSpec } from 'routing-controllers-openapi';
import swaggerUi from 'swagger-ui-express';
import { NODE_ENV, PORT, LOG_FORMAT, ORIGIN, CREDENTIALS } from '@config';
import { ErrorMiddleware } from '@middlewares/error.middleware';
import { logger, stream } from '@/shared/utils/helpers/loggers';
import actuator from 'express-actuator';
import { rateLimitMiddleware } from './middlewares/rateLimit.middleware';
import traceMiddleware from './middlewares/trace.middleware';
import httpLoggerMiddleware from './middlewares/httpLogger.middleware';
import { pubSubConsumerRegistry } from './shared/utils/helpers/rabbitmq/pubsub/consumers';
import { requestReplyConsumerRegister } from './shared/utils/helpers/rabbitmq/requestReply/consumers';
//import { initializeDatabase } from '@kishornaik/todo-db-library';

export class App {
	public app: express.Application;
	public env: string;
	public port: string | number;
	private _initializeDatabase: Function;
	private _initializePubSubRabbitMqConsumers: Function[];
	private _runPubSubRabbitMqConsumers: Function;
	private _initializeRequestReplyRabbitMqConsumers: Function[];
	private _runRequestReplyRabbitMqConsumers: Function;

	constructor(Controllers: Function[]) {
		this.app = express();
		this.env = NODE_ENV || 'development';
		this.port = PORT || 3000;

		this.initializeMiddlewares();
		this.initializeRoutes(Controllers);
		this.initializeSwagger(Controllers);
		this.initializeErrorHandling();
	}

	public initializeDatabase(init?: Function | undefined) {
		console.log('testDB Function init');
		this._initializeDatabase = init;
		return this;
	}

	public initializeAndRunPubSubRabbitMqConsumer(init: Function[], run: Function | undefined) {
		this._initializePubSubRabbitMqConsumers = init;
		this._runPubSubRabbitMqConsumers = run.bind(pubSubConsumerRegistry);
		return this;
	}

	public initializeAndRunRequestReplyRabbitMqConsumer(
		init: Function[],
		run: Function | undefined
	) {
		this._initializeRequestReplyRabbitMqConsumers = init;
		this._runRequestReplyRabbitMqConsumers = run.bind(requestReplyConsumerRegister);
		return this;
	}

	public listen() {
		this.app.listen(this.port, async () => {
			logger.info(`=================================`);
			logger.info(`======= ENV: ${this.env} =======`);
			logger.info(`🚀 App listening on the port ${this.port}`);
			logger.info(`=================================`);

			await this.executeDatabase();
			await this.executePubSubRabbitMqConsumers();
			await this.executeRequestReplyRabbitMqConsumers();
		});
	}

	public getServer() {
		return this.app;
	}

	private initializeMiddlewares() {
		this.app.use(httpLoggerMiddleware);
		this.app.use(hpp());
		this.app.use(helmet());
		this.app.use(compression());
		this.app.use(express.json({ limit: '50mb' }));
		this.app.use(express.urlencoded({ extended: true }));
		this.app.use(cookieParser());
		this.app.use(actuator());
		this.app.use(rateLimitMiddleware);
		this.app.use(traceMiddleware);
	}

	private initializeRoutes(controllers: Function[]) {
		useExpressServer(this.app, {
			cors: {
				origin: ORIGIN,
				credentials: CREDENTIALS,
			},
			controllers: controllers,
			defaultErrorHandler: false,
		});
	}

	private initializeSwagger(controllers: Function[]) {
		const schemas = validationMetadatasToSchemas({
			classTransformerMetadataStorage: defaultMetadataStorage,
			refPointerPrefix: '#/components/schemas/',
		});

		const routingControllersOptions = {
			controllers: controllers,
		};

		const storage = getMetadataArgsStorage();
		const spec = routingControllersToSpec(storage, routingControllersOptions, {
			components: {
				schemas: schemas as { [schema: string]: any },
				securitySchemes: {
					// basicAuth: {
					//   scheme: 'basic',
					//   type: 'http',
					// },
					BearerAuth: {
						type: 'http',
						scheme: 'bearer',
						bearerFormat: 'JWT',
						in: 'header',
					},
				},
			},
			security: [
				{
					BearerAuth: [],
				},
			],
			info: {
				description: 'Generated with `routing-controllers-openapi`',
				title: 'A sample API',
				version: '1.0.0',
			},
		});
		//console.log(JSON.stringify(spec));
		this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(spec));
	}

	private initializeErrorHandling() {
		this.app.use(ErrorMiddleware);
	}

	private async executeDatabase(): Promise<void> {
		if (this._initializeDatabase) {
			await this._initializeDatabase();
			logger.info(`[app-init]: Database initialized`);
		}
	}

	private async executePubSubRabbitMqConsumers(): Promise<void> {
		if (
			this._initializePubSubRabbitMqConsumers &&
			this._runPubSubRabbitMqConsumers &&
			this._runRequestReplyRabbitMqConsumers.length > 0
		) {
			logger.info(
				`[app-init-Consumers]: Consumers initialize started:${this._initializePubSubRabbitMqConsumers.length}`
			);
			await Promise.all(
				this._initializePubSubRabbitMqConsumers.map((consumer) => consumer())
			);
			logger.info(
				`[app-init-Consumers]: Consumers initialized:${this._initializePubSubRabbitMqConsumers.length}`
			);

			logger.info(`[app-run-Consumers]: Consumers run started.`);
			await this._runPubSubRabbitMqConsumers();
			logger.info(`[app-run-Consumers]: Consumers run completed.`);
		}
	}

	private async executeRequestReplyRabbitMqConsumers(): Promise<void> {
		if (
			this._initializeRequestReplyRabbitMqConsumers &&
			this._runRequestReplyRabbitMqConsumers &&
			this._runRequestReplyRabbitMqConsumers.length > 0
		) {
			logger.info(
				`[app-init-Consumers]: Consumers initialize started:${this._initializeRequestReplyRabbitMqConsumers.length}`
			);
			await Promise.all(
				this._initializeRequestReplyRabbitMqConsumers.map((consumer) => consumer())
			);
			logger.info(
				`[app-init-Consumers]: Consumers initialized:${this._initializeRequestReplyRabbitMqConsumers.length}`
			);

			logger.info(`[app-run-Consumers]: Consumers run started.`);
			await this._runRequestReplyRabbitMqConsumers();
			logger.info(`[app-run-Consumers]: Consumers run completed.`);
		}
	}
}
