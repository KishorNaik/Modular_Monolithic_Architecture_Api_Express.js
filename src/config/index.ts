import { config } from 'dotenv';
//config({ path: `.env.${process.env.NODE_ENV || 'development'}.local` });
config({ path: `.env` });

export const CREDENTIALS = process.env.CREDENTIALS === 'true';
export const {
	NODE_ENV,
	PORT,
	SECRET_KEY,
	REFRESH_SECRET_KEY,
	LOG_FORMAT,
	LOG_DIR,
	ORIGIN,
	DB_HOST,
	DB_PORT,
	DB_USERNAME,
	DB_PASSWORD,
	DB_DATABASE,
	REDIS_HOST,
	REDIS_PORT,
	REDIS_PASSWORD,
	REDIS_DB,
	REDIS_USERNAME,
	RABBITMQ_URL,
	ENCRYPTION_KEY,
	RATE_LIMITER,
} = process.env;
