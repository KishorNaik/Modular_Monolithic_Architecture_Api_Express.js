import { App } from '@/app';
import { ValidateEnv } from '@/shared/utils/validations/env';
import { runNodeCluster } from './shared/utils/miscellaneous/clusters';
import { pubSubConsumerRegistry } from './shared/utils/helpers/rabbitmq/pubsub/consumers';
import { requestReplyConsumerRegister } from './shared/utils/helpers/rabbitmq/requestReply/consumers';
import {
	modulesFederation,
	modulesFederationPubSubConsumers,
	modulesFederationRequestReplyConsumers,
} from './modules';
import { initializeDatabase } from '@kishornaik/mma_db';

ValidateEnv();

const mmaDb = async (): Promise<void> => {
	await initializeDatabase;
};

const runServer = () => {
	const app = new App([...modulesFederation]);
	app.initializeDatabase(mmaDb);
	app.initializeAndRunPubSubRabbitMqConsumer(
		[...modulesFederationPubSubConsumers],
		pubSubConsumerRegistry.execute
	);
	app.initializeAndRunRequestReplyRabbitMqConsumer(
		[...modulesFederationRequestReplyConsumers],
		requestReplyConsumerRegister.execute
	);
	app.listen();
};

const env = process.env.NODE_ENV || 'development';
if (env === 'development') {
	// For Single Core Server : Development Server Only
	runServer();
} else {
	// For Multi Core Server : Production Server Only
	runNodeCluster(() => {
		runServer();
	});
}
