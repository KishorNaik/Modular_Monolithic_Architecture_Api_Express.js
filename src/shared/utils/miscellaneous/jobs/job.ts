import { logger } from '../../helpers/loggers';

export const jobPromise = (callBack: Function) => {
	Promise.resolve(callBack()).catch((error) => {
		logger.error(`Error in fire and forget job: ${error}`);
	});
};

export const backgroundJob = (callBack: () => void) => {
	setImmediate(callBack);
};

export const backgroundJobAsync = (callBack: () => Promise<void>) => {
	setImmediate(callBack);
};
