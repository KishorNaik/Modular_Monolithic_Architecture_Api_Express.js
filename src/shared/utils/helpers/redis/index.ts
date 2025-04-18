import { REDIS_DB, REDIS_HOST, REDIS_PASSWORD, REDIS_PORT, REDIS_USERNAME } from '@/config';
import { createClient, RedisClientType, RedisFunctions, RedisModules, RedisScripts } from 'redis';
import { logger } from '../loggers';
import { Ok, Result } from 'neverthrow';
import { ResultError, ResultExceptionFactory } from '../../exceptions/results';
import { StatusCodes } from 'http-status-codes';
import { Service } from 'typedi';
import CircuitBreaker from 'opossum';
import IORedis from 'ioredis';
import { ConnectionOptions } from 'bullmq';

const circuitBreakerOptions = {
	timeout: 5000, // If Redis takes longer than 5 seconds, trigger a failure
	errorThresholdPercentage: 50, // If 50% of requests fail, open the circuit
	resetTimeout: 10000, // After 10 seconds, attempt to close the circuit
	maxFailures: 3, // Number of failures before the circuit opens
};

async function redisOperation(redisHelper: RedisHelper, cacheKey: string) {
	//Testing:
	//throw new Error(`Redis error: ${cacheKey}`);
	//return 'test';
	const cacheValueResult = await redisHelper.get(cacheKey);
	if (cacheValueResult.isErr()) {
		throw new Error(`Redis error: ${cacheValueResult.error.message}`);
	}
	return cacheValueResult.value;
}

export const redisCacheCircuitBreaker = new CircuitBreaker(redisOperation, circuitBreakerOptions);

@Service()
export class RedisHelper {
	//private client: RedisClientType;
	private client: RedisClientType<RedisModules, RedisFunctions, RedisScripts>;
	private isConnected: boolean = false;

	async init(isLocal: boolean = false) {
		if (isLocal) {
			logger.info(`$Host:${REDIS_HOST}:Port:${REDIS_PORT}`);

			this.client = await createClient()
				.on('error', (err) => {
					this.isConnected = false;
					console.log('Redis Client Error', err);
					logger.error(`Redis Client Error: ${err}`);
				})
				.on('ready', () => {
					this.isConnected = true;
					console.log('Redis Client Ready');
					logger.info('Redis Client Ready');
				})
				.on('end', () => {
					this.isConnected = false;
					console.log('Redis Client End');
					logger.info('Redis Client End');
				})
				.connect();
		} else {
			const url: string = `redis://${REDIS_USERNAME}:${REDIS_PASSWORD}@${REDIS_HOST}:${REDIS_PORT}`;

			this.client = await createClient({
				url: url,
			})
				.on('error', (err) => {
					this.isConnected = false;
					console.log('Redis Client Error', err);
					logger.error(`Redis Client Error: ${err}`);
				})
				.on('ready', () => {
					this.isConnected = true;
					console.log('Redis Client Ready');
					logger.info('Redis Client Ready');
				})
				.on('end', () => {
					this.isConnected = false;
					console.log('Redis Client End');
					logger.info('Redis Client End');
				})
				.connect();
		}
	}

	async get(key: string): Promise<Result<string | null | undefined, ResultError>> {
		if (!this.isConnected)
			return ResultExceptionFactory.error(
				StatusCodes.SERVICE_UNAVAILABLE,
				'Redis Client Not Connected'
			);

		if (!key) return ResultExceptionFactory.error(StatusCodes.BAD_REQUEST, 'Key is required');
		const data = await this.client.get(key);
		return new Ok(data);
	}

	async set(key: string, value: string): Promise<Result<undefined, ResultError>> {
		if (!this.isConnected)
			return ResultExceptionFactory.error(
				StatusCodes.SERVICE_UNAVAILABLE,
				'Redis Client Not Connected'
			);
		if (!key) return ResultExceptionFactory.error(StatusCodes.BAD_REQUEST, 'Key is required');
		if (!value)
			return ResultExceptionFactory.error(StatusCodes.BAD_REQUEST, 'Value is required');

		await this.client.set(key, value);
		return new Ok(undefined);
	}

	async disconnect(): Promise<void> {
		if (this.isConnected) {
			await this.client.disconnect();
			this.isConnected = false;
		}
	}
}

export const getIORedisConnection=(): ConnectionOptions=>{
  const env=process.env.NODE_ENV;
  const isLocal=env=='development';

  let connectionOptions: ConnectionOptions;

  if(isLocal){
    connectionOptions={
      host:REDIS_HOST,
      port:parseInt(REDIS_PORT),
    }
  }
  else
  {
    connectionOptions={
      host:REDIS_HOST,
      port:parseInt(REDIS_PORT),
      username:REDIS_USERNAME,
      password:REDIS_PASSWORD
    }
  }

  return connectionOptions;
}
