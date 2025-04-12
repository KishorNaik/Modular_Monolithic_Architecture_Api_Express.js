import { RABBITMQ_URL } from '@/config';
import { connect, ChannelWrapper, AmqpConnectionManager } from 'amqp-connection-manager';
import { ConfirmChannel, ConsumeMessage } from 'amqplib';
import { v4 as uuidv4 } from 'uuid';

class RabbitMQRequestReply {
	private connection: AmqpConnectionManager;
	private channel: ChannelWrapper;

	constructor() {
		this.connection = connect([RABBITMQ_URL]);
		this.channel = this.connection.createChannel({
			json: true,
			setup: (channel: ConfirmChannel) => {
				// Setup any necessary exchanges, queues, etc. here
			},
		});
	}

	public async sendAsync<TRequest, TResponse>(
		queue: string,
		message: TRequest
	): Promise<TResponse> {
		const correlationId = uuidv4();
		const replyQueue = 'reply_queue';

		//const replyQueue = await this.channel.assertQueue(queue, { durable: true });
		console.log(`Sending message with correlationId: ${correlationId}`);
		console.log(`Sending message to replyQueue: ${JSON.stringify(replyQueue)}`);

		return new Promise<TResponse>(async (resolve, reject) => {
			try {
				this.channel!.consume(
					replyQueue,
					(msg: ConsumeMessage | null) => {
						if (msg && msg.properties.correlationId === correlationId) {
							console.log(`message data: ${msg.content.toString()}`);
							resolve(JSON.parse(msg.content.toString()) as TResponse);
							this.channel!.ack(msg);
						}
					},
					{ noAck: false }
				);

				this.channel!.sendToQueue(queue, JSON.stringify(message), {
					correlationId: correlationId,
					replyTo: replyQueue,
				});
			} catch (ex) {
				reject(ex);
			}
		});
		//     //const correlationId = uuidv4();
		//     //const replyQueue = 'amq.rabbitmq.reply-to';

		//     //console.log(`Sending message with correlationId: ${correlationId}`);

		//     try {
		//         await this.channel.consume(
		//             replyQueue,
		//             (msg: ConsumeMessage | null) => {
		//                 if (msg && msg.properties.correlationId === correlationId) {
		//                     const response = JSON.parse(msg.content.toString()) as TResponse;
		//                     console.log(`Received response for correlationId: ${correlationId}`);
		//                     resolve(response);
		//                 }
		//             },
		//             { noAck: true }
		//         );

		//         // await this.channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)), {
		//         //     correlationId,
		//         //     replyTo: replyQueue,
		//         // });
		//     } catch (error) {
		//         console.error('Error in sendAsync:', error);
		//         reject(error);
		//     }
		// });
	}

	public async close(): Promise<void> {
		await this.channel.close();
		await this.connection.close();
	}
}

const rabbitMQRequestReply = new RabbitMQRequestReply();
export { rabbitMQRequestReply };
