import { connect, ChannelWrapper, AmqpConnectionManager } from 'amqp-connection-manager';
import { ConfirmChannel, ConsumeMessage } from 'amqplib';
import { logger } from '../../../loggers';

class RabbitMqRequestReplyConsumer {
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

	public async startConsumerAsync(queue: string): Promise<void> {
		const replyQueue = 'reply_queue';
		console.log('Starting consumer for queue:', queue);
		await this.channel.assertQueue(replyQueue, { durable: true });
		await this.channel.addSetup(async (channel: ConfirmChannel) => {
			await channel.assertQueue(queue, { durable: true });
			await channel.assertQueue(replyQueue, { durable: true });
			await channel.consume(queue, async (msg: ConsumeMessage | null) => {
				if (msg !== null) {
					const messageContent = msg.content.toString();
					console.log('Received message:', messageContent);
					console.log(
						`Received message with correlationId: ${msg.properties.correlationId}`
					);
					console.log(`Received message with replyTo: ${msg.properties.replyTo}`);

					// Trigger the corresponding request-reply handler
					try {
						const response = await requestReplyEvent.trigger(
							queue,
							JSON.parse(messageContent) as any
						);
						console.log('Response:', response);

						// Send the response back to the reply queue
						channel.sendToQueue(
							//msg.properties.replyTo,
							replyQueue,
							Buffer.from(JSON.stringify(response)),
							{
								correlationId: msg.properties.correlationId,
								replyTo: replyQueue,
							}
						);
						console.log(
							`Sent response for correlationId: ${msg.properties.correlationId}`
						);
					} catch (error) {
						console.error('Error handling message:', error);
					}

					// Acknowledge the message
					channel.ack(msg);
				}
			});
		});
	}

	public async close(): Promise<void> {
		await this.channel.close();
		await this.connection.close();
	}
}

export interface IRequestReply<TRequest, TResponse> {
	handleAsync(queueName: string, message: TRequest): Promise<TResponse>;
}

export class RequestReplyEvent {
	private handlers: Map<string, IRequestReply<any, any>> = new Map();

	public register(queueName: string, handler: IRequestReply<any, any>): void {
		this.handlers.set(queueName, handler);
	}

	public async trigger(queueName: string, message: any): Promise<any> {
		const handler = this.handlers.get(queueName);
		if (handler) {
			return await handler.handleAsync(queueName, JSON.parse(message) as any);
		} else {
			console.warn(
				`[request-reply-event-trigger]: No handler registered for channel: ${queueName}`
			);
			//throw new Error(`No handler registered for channel: ${queueName}`);
		}
	}
}

class RequestReplyConsumersRegistry {
	// Array to store functions that return a Promise<void>
	private functionArray: Array<() => Promise<void>> = [];

	// Method to register a function
	public register(func: () => Promise<void>): void {
		this.functionArray.push(func);
	}

	// Method to execute all registered functions
	public async execute(): Promise<void> {
		console.log('execute');
		if (this.functionArray.length >= 0) {
			await Promise.all(this.functionArray.map((func) => func()));
			logger.info(`[request-reply-consumer-registry-execute]: All consumers executed.`);
		}
	}
}

const requestReplyEvent = new RequestReplyEvent();
const rabbitMQRequestReplyConsumer = new RabbitMqRequestReplyConsumer();
const requestReplyConsumerRegister = new RequestReplyConsumersRegistry();
export { rabbitMQRequestReplyConsumer, requestReplyEvent, requestReplyConsumerRegister };
