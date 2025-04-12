import { createClient, RedisClientType } from 'redis';
import {
	REDIS_DB,
	REDIS_HOST,
	REDIS_PASSWORD,
	REDIS_PORT,
	REDIS_USERNAME,
} from '../../../../config/env';

class RedisHelper {
	private client!: RedisClientType;

	constructor() {
		this.init();
	}

	async init() {
		const url: string = `redis://${REDIS_USERNAME}:${REDIS_PASSWORD}@${REDIS_HOST}:${REDIS_PORT}`;

		this.client = createClient({
			//url: 'redis://alice:foobared@awesome.redis.server:6380', // replace with your Redis server URL
			url: url,
			database: parseInt(REDIS_DB!),
		});

		this.client.on('error', (err) => console.log('Redis Client Error', err));

		await this.client.connect();
	}

	async get(key: string): Promise<string | null> {
		return await this.client.get(key);
	}

	async set(key: string, value: string): Promise<void> {
		await this.client.set(key, value);
	}

	async disconnect(): Promise<void> {
		await this.client.disconnect();
	}
}

export default new RedisHelper();
