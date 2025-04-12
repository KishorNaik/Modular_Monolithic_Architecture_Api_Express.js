import { connect, ChannelWrapper, AmqpConnectionManager } from 'amqp-connection-manager';
import { ConfirmChannel, ConsumeMessage } from 'amqplib';

class RabbitMqProducer {
	private connection: AmqpConnectionManager;
	private channel: ChannelWrapper;

	constructor() {
		this.connection = connect(['amqp://localhost']);
		this.channel = this.connection.createChannel({
			json: true,
			setup: (channel: ConfirmChannel) => {
				// Setup any necessary exchanges, queues, etc. here
			},
		});
	}

	public async sendAsync<T>(queue: string, message: T): Promise<void> {
		await this.channel.sendToQueue(queue, JSON.stringify(message));
	}

	public async close(): Promise<void> {
		await this.channel.close();
		await this.connection.close();
	}
}

const rabbitMqProducer = new RabbitMqProducer();
export { rabbitMqProducer };
