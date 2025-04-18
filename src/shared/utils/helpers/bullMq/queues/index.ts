import { REDIS_HOST, REDIS_PORT } from '@/config';
import { Processor, Queue, Worker } from 'bullmq';
import { getIORedisConnection } from '../../redis';

const connection = getIORedisConnection();

export const setQueues = (name: string) => {
	return new Queue(name, {
		connection: connection,
	});
};

export const runWorkers = (
	queueName: string,
	queueJob: string | URL | Processor<any, any, string>
) => {
	return new Worker(queueName, queueJob, { connection: connection });
};
