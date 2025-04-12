import amqp from 'amqplib';
import { Guid } from 'guid-typescript';
import { RABBITMQ_URL } from '../../../../config/env';

class RabbitMQ_PubSub_Helper {
	private readonly url: string;

	public constructor() {
		this.url = RABBITMQ_URL!;
	}

	async sendAsync<T>(queue: string, message: T): Promise<void> {
		const connection = await amqp.connect(this.url);
		const channel = await connection.createChannel();

		await channel.assertQueue(queue, { durable: false });
		await channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)));

		setTimeout(() => {
			connection.close();
		}, 500);
	}

	async receiveAsync<T>(queue: string): Promise<T> {
		const connection = await amqp.connect(this.url);
		const channel = await connection.createChannel();

		await channel.assertQueue(queue, { durable: false });

		return new Promise((resolve, reject) => {
			try {
				channel.consume(
					queue,
					(msg) => {
						console.log(' [x] Received %s', msg?.content.toString());
						resolve(JSON.parse(msg?.content.toString()!) as T);
					},
					{
						noAck: true,
					}
				);
			} catch (ex) {
				reject(ex);
			}
		});
	}
}

class RabbitMQ_RPC_Helper {
	private readonly url: string;

	public constructor() {
		this.url = RABBITMQ_URL!;
	}

	async requestAsync<TRequest, TResponse>(queue: string, message: TRequest): Promise<TResponse> {
		const connection = await amqp.connect(this.url);
		const channel = await connection.createChannel();

		const replyQueue = await channel.assertQueue('', { exclusive: true });

		const correlationId = Guid.create().toString();

		await channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)), {
			correlationId: correlationId,
			replyTo: replyQueue.queue,
		});

		return new Promise((resolve, reject) => {
			try {
				channel.consume(
					replyQueue.queue,
					(msg) => {
						if (msg?.properties.correlationId === correlationId) {
							resolve(JSON.parse(msg.content.toString()!) as TResponse);
						}
					},
					{
						noAck: true,
					}
				);
			} catch (ex) {
				reject(ex);
			}
		});
	}

	async receiveAsync<TRequest>(
		queue: string
	): Promise<{ request: TRequest; replyTo: string; correlationId: string }> {
		const connection = await amqp.connect(this.url);
		const channel = await connection.createChannel();

		await channel.assertQueue(queue, { durable: false });

		return new Promise((resolve, reject) => {
			try {
				channel.consume(
					queue,
					(msg) => {
						const replyTo = msg?.properties.replyTo;
						const correlationId = msg?.properties.correlationId;

						let request: TRequest = JSON.parse(msg?.content.toString()!);

						resolve({ request, replyTo, correlationId });
					},
					{
						noAck: true,
					}
				);
			} catch (ex) {
				reject(ex);
			}
		});
	}

	async replyAsync<TReply>(replyTo: string, correlationId: string, reply: TReply): Promise<void> {
		const connection = await amqp.connect(this.url);
		const channel = await connection.createChannel();

		channel.sendToQueue(replyTo, Buffer.from(JSON.stringify(reply)), {
			correlationId: correlationId,
		});
	}
}

const rabbitMQ_PubSub_Helper = new RabbitMQ_PubSub_Helper();
const rabbitMQ_RPC_Helper = new RabbitMQ_RPC_Helper();
export { rabbitMQ_PubSub_Helper, rabbitMQ_RPC_Helper };
