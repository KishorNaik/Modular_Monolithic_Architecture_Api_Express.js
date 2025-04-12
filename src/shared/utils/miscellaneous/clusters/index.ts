import cluster from 'node:cluster';
import { availableParallelism } from 'node:os';
import { Action } from '../../helpers/delegates';

const numCPUs = availableParallelism();
console.log(`[NODE_ENV: ${process.env.NODE_ENV}] Forking ${numCPUs} workers.`);

export const runNodeCluster = (runServer: Action<[undefined]>) => {
	if (cluster.isPrimary) {
		console.log(`Primary ${process.pid} is running`);

		// Fork workers.
		for (let i = 0; i < numCPUs; i++) {
			cluster.fork();
		}

		cluster.on('exit', (worker, code, signal) => {
			console.log(`worker ${worker.process.pid} died`);
		});
	} else {
		console.log(`Worker ${process.pid} started`);
		runServer(undefined);
	}
};
