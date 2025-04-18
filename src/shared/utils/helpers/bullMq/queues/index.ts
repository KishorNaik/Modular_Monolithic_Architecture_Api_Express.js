import { REDIS_HOST, REDIS_PORT } from '@/config';
import { Processor, Queue, Worker } from 'bullmq';
import { getIORedisConnection } from '../../redis';

const connection = getIORedisConnection();

export const setQueues = (name: string) => {
	return new Queue(name, {
		connection: connection,
	});
};

export const publishQueuesAsync = <T extends Object>(
	queue: Queue<any, any, string, any, any, string>,
	jobName: string,
	data: T
) => {
	return queue.add(jobName, data as T, {
		removeOnComplete: true,
		removeOnFail: true,
	});
};

export const runWorkers = (
	queueName: string,
	queueJob: string | URL | Processor<any, any, string>
) => {
	return new Worker(queueName, queueJob, { connection: connection, removeOnFail: { count: 0 } });
};
