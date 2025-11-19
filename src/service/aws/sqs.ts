import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { env } from '@/config/env';
import { AppError } from '@/lib/errors';

interface SendMessageParams {
	topicName: string;
	message: {
		messageInfo: {
			content: string;
			location?: string;
			media_id?: string;
		};
		userPhoneNumber: string;
		botPhoneNumber: string;
		id: string;
		context?: Record<string, unknown>;
	};
}

class SQSClientService {
	private client: SQSClient;
	private queueUrl: string;

	constructor() {
		const { region, accessKeyId, secretAccessKey, queueUrl } = env.aws;

		if (!region || !accessKeyId || !secretAccessKey || !queueUrl) {
			throw new AppError('AWS credentials not configured', 500);
		}

		this.client = new SQSClient({
			region,
			credentials: {
				accessKeyId,
				secretAccessKey,
			},
		});
		this.queueUrl = queueUrl;
	}

	private generateRandomId(): string {
		return Math.floor(Math.random() * 1e9).toString();
	}

	async sendMessage(params: SendMessageParams): Promise<void> {
		try {
			const command = new SendMessageCommand({
				QueueUrl: this.queueUrl,
				MessageBody: JSON.stringify(params),
				MessageGroupId: params.topicName,
				MessageDeduplicationId: params.message.id || this.generateRandomId(),
			});

			await this.client.send(command);
		} catch (error) {
			throw new AppError('Error al enviar mensaje a WhatsApp', 500, { error });
		}
	}

	async sendUbicationConfirmation(userPhoneNumber: string, botPhoneNumber: string): Promise<void> {
		const params: SendMessageParams = {
			topicName: 'gga-topic',
			message: {
				messageInfo: {
					content: 'Ya confirme la ubicacion y se cargó el ofrecimiento, muchas gracias.',
					location: '',
					media_id: '',
				},
				userPhoneNumber,
				botPhoneNumber,
				id: this.generateRandomId(),
				context: {},
			},
		};

		await this.sendMessage(params);
	}

	async sendTechnicalSheetRequest(userPhoneNumber: string, message: string): Promise<void> {
		const botNumber = env.whatsapp.botNumber;

		if (!botNumber) {
			throw new AppError('Bot number not configured', 500);
		}

		const params: SendMessageParams = {
			topicName: 'gga-topic',
			message: {
				messageInfo: {
					content: message,
					location: '',
					media_id: '',
				},
				userPhoneNumber,
				botPhoneNumber: botNumber,
				id: this.generateRandomId(),
				context: {},
			},
		};

		await this.sendMessage(params);
	}
}

export const sqsClient = new SQSClientService();
