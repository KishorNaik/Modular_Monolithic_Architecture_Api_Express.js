import { Service } from 'typedi';
import { connect, ChannelWrapper, AmqpConnectionManager } from 'amqp-connection-manager';
import { ConfirmChannel, ConsumeMessage } from 'amqplib';
import { RABBITMQ_URL } from '@/config';
import { logger } from '../../../loggers';

class RabbitMqConsumer {
	private channel: ChannelWrapper;
	private consumerEvent: ConsumerEvent;
	private connection: AmqpConnectionManager;

	constructor(consumerEvent: ConsumerEvent) {
		this.connection = connect([RABBITMQ_URL]);
		this.channel = this.connection.createChannel({
			json: true,
			setup: (channel: ConfirmChannel) => {
				// Setup any necessary exchanges, queues, etc. here
			},
		});
		this.consumerEvent = consumerEvent;
	}

	public async startConsumerAsync(queue: string): Promise<void> {
		await this.channel.addSetup(async (channel: ConfirmChannel) => {
			await channel.assertQueue(queue, { durable: true });
			await channel.consume(queue, async (msg: ConsumeMessage | null) => {
				if (msg !== null) {
					const messageContent = msg.content.toString();
					console.log('Received message:', messageContent);
					// Trigger the corresponding event
					await this.consumerEvent.trigger(queue, JSON.parse(messageContent) as any);
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

export interface IConsumer<T> {
	handleAsync(queueName: string, message: T): Promise<void>;
}

export class ConsumerEvent {
	private consumers: Map<string, IConsumer<any | unknown>> = new Map();

	public register(queueName: string, consumer: IConsumer<any>): void {
		this.consumers.set(queueName, consumer);
	}

	public async trigger(queueName: string, message: any | unknown): Promise<void> {
		const consumer = this.consumers.get(queueName);
		if (consumer) {
			await consumer.handleAsync(queueName, JSON.parse(message) as any);
			logger.info(`[consumer-event-trigger]: Message received: ${queueName}`);
		} else {
			logger.warn(
				`[consumer-event-trigger]: No consumer registered for channel: ${queueName}`
			);
		}
	}
}

class PubSubConsumersRegistry {
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
			logger.info(`[consumer-registry-execute]: All consumers executed.`);
		}
	}
}

// Initialize ConsumerRegistry and register consumers
const consumerEvent = new ConsumerEvent();

// Initialize RabbitMQ helper
const rabbitMQConsumer = new RabbitMqConsumer(consumerEvent);

const pubSubConsumerRegistry = new PubSubConsumersRegistry();

export { consumerEvent, rabbitMQConsumer, pubSubConsumerRegistry };
