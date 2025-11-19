import { NextRequest, NextResponse } from 'next/server';
import { sqsClient } from '@/service/aws/sqs';
import { logger } from '@/lib/logger';
import { ValidationError, AppError } from '@/lib/errors';

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { action, ...params } = body;

		if (!action) {
			throw new ValidationError('Parámetro "action" es requerido');
		}

		let result;

		switch (action) {
			case 'sendMessage':
				if (!params.topicName || !params.message) {
					throw new ValidationError('Parámetros "topicName" y "message" son requeridos');
				}
				await sqsClient.sendMessage({
					topicName: params.topicName,
					message: params.message,
				});
				result = { message: 'Mensaje enviado a SQS exitosamente' };
				break;

			case 'sendUbicationConfirmation':
				if (!params.userPhoneNumber || !params.botPhoneNumber) {
					throw new ValidationError('Parámetros "userPhoneNumber" y "botPhoneNumber" son requeridos');
				}
				await sqsClient.sendUbicationConfirmation(params.userPhoneNumber, params.botPhoneNumber);
				result = { message: 'Confirmación de ubicación enviada' };
				break;

			case 'sendTechnicalSheetRequest':
				if (!params.userPhoneNumber || !params.message) {
					throw new ValidationError('Parámetros "userPhoneNumber" y "message" son requeridos');
				}
				await sqsClient.sendTechnicalSheetRequest(params.userPhoneNumber, params.message);
				result = { message: 'Solicitud de ficha técnica enviada' };
				break;

			default:
				throw new ValidationError(`Acción no válida: ${action}`);
		}

		return NextResponse.json({ success: true, data: result });
	} catch (error) {
		if (error instanceof ValidationError) {
			return NextResponse.json({ success: false, error: error.message }, { status: 400 });
		}

		if (error instanceof AppError) {
			return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
		}

		return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 });
	}
}
