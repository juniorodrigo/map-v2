import { NextRequest, NextResponse } from 'next/server';
import { whatsappService } from '@/service/whatsapp/templates';
import { logger } from '@/lib/logger';
import { ValidationError, AppError } from '@/lib/errors';

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { action, ...params } = body;

		if (!action) {
			throw new ValidationError('Parámetro "action" es requerido');
		}

		logger.info(`API WhatsApp: ${action}`, params);

		let result;

		switch (action) {
			case 'sendRequirementNotification':
				if (!params.vars || !params.to || !params.leadId) {
					throw new ValidationError('Parámetros "vars", "to" y "leadId" son requeridos');
				}
				await whatsappService.sendRequirementNotification(params.vars, params.from || '', params.to, params.leadId);
				result = { message: 'Notificación de requerimiento enviada' };
				break;

			case 'sendOfferNotification':
				if (!params.link || !params.to) {
					throw new ValidationError('Parámetros "link" y "to" son requeridos');
				}
				await whatsappService.sendOfferNotification(params.link, params.from || '', params.to);
				result = { message: 'Notificación de oferta enviada' };
				break;

			case 'sendGenericTemplate':
				if (!params.templateName || !params.to || !params.language) {
					throw new ValidationError('Parámetros "templateName", "to" y "language" son requeridos');
				}
				await whatsappService.sendGenericTemplate(params.templateName, params.from || '', params.to, params.language);
				result = { message: 'Template genérico enviado' };
				break;

			case 'generateWhatsAppUrl':
				if (!params.ownerNumber || !params.propertyId || !params.deviceType) {
					throw new ValidationError('Parámetros "ownerNumber", "propertyId" y "deviceType" son requeridos');
				}
				result = {
					url: whatsappService.generateWhatsAppUrl(params.ownerNumber, params.propertyId, params.deviceType),
				};
				break;

			default:
				throw new ValidationError(`Acción no válida: ${action}`);
		}

		return NextResponse.json({ success: true, data: result });
	} catch (error) {
		logger.error('Error en API WhatsApp', error);

		if (error instanceof ValidationError) {
			return NextResponse.json({ success: false, error: error.message }, { status: 400 });
		}

		if (error instanceof AppError) {
			return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
		}

		return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 });
	}
}
