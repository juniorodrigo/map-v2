import { NextRequest, NextResponse } from 'next/server';
import { sqsClient } from '@/service/aws/sqs';
import { logger } from '@/lib/logger';
import { ValidationError, AppError } from '@/lib/errors';

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { userPhoneNumber, message } = body;

		if (!userPhoneNumber || !message) {
			throw new ValidationError('Parámetros "userPhoneNumber" y "message" son requeridos');
		}

		await sqsClient.sendTechnicalSheetRequest(userPhoneNumber, message);

		logger.info('Solicitud de ficha técnica enviada', { userPhoneNumber });

		return NextResponse.json({
			success: true,
			data: { message: 'Solicitud de ficha técnica enviada' },
		});
	} catch (error) {
		logger.error('Error al procesar solicitud de ficha técnica', error);

		if (error instanceof ValidationError) {
			return NextResponse.json({ success: false, error: error.message }, { status: 400 });
		}

		if (error instanceof AppError) {
			return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
		}

		return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 });
	}
}
