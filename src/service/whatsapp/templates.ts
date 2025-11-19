import { env } from '@/config/env';
import { logger } from '@/lib/logger';
import { AppError } from '@/lib/errors';
import { findOne, updateOne } from '@/service/mongo/queries';
import axios from 'axios';

interface WhatsAppTemplateParams {
	name: string;
	language: 'es_MX' | 'en_US';
	components?: Array<{
		type: string;
		parameters: Array<{
			type: string;
			text: string;
		}>;
	}>;
}

interface RequirementNotificationVars {
	userName: string;
	date: string;
	propertyType: string;
	operationType: string;
	priceRange: string;
	zone: string;
	propertyLink: string;
}

class WhatsAppService {
	private async getGunumber(botPhoneNumber: string) {
		try {
			let gunumber = await findOne({
				collection: 'gunumbers',
				filter: { bot_number: botPhoneNumber },
				dbName: env.mongo.databases.gga,
			});

			if (!gunumber) {
				logger.debug('Buscando gunumber en gu2');
				gunumber = await findOne({
					collection: 'gunumbers',
					filter: { bot_number: botPhoneNumber },
					dbName: env.mongo.databases.gu2,
				});
			}

			return gunumber as { token: string; link: string } | null;
		} catch (error) {
			logger.error('Error al buscar gunumber', error);
			return null;
		}
	}

	private async sendTemplate(
		to: string,
		gunumber: { token: string; link: string },
		template: WhatsAppTemplateParams
	): Promise<void> {
		try {
			const headers = {
				Authorization: `Bearer ${gunumber.token}`,
			};

			const data = {
				messaging_product: 'whatsapp',
				to,
				type: 'template',
				template,
			};

			logger.debug('Enviando template WhatsApp', { to, templateName: template.name });

			const response = await axios.post(`${gunumber.link}messages`, data, { headers });

			logger.info('Template WhatsApp enviado exitosamente', {
				to,
				messageId: response.data?.messages?.[0]?.id,
			});
		} catch (error) {
			logger.error('Error al enviar template WhatsApp', error);
			throw new AppError('Error al enviar mensaje WhatsApp', 500, { error });
		}
	}

	async sendRequirementNotification(
		vars: RequirementNotificationVars,
		from: string,
		to: string,
		leadId: string
	): Promise<void> {
		const botPhoneNumber = from.length > 0 ? from : env.whatsapp.botNumber || '';

		if (!botPhoneNumber) {
			logger.error('BOT_NUMBER no está configurado en variables de entorno');
			throw new AppError('Configuración de WhatsApp incompleta', 500);
		}

		const gunumber = await this.getGunumber(botPhoneNumber);

		if (!gunumber || !to) {
			logger.warn('No se pudo enviar notificación: gunumber o destinatario no encontrado');
			return;
		}

		const template: WhatsAppTemplateParams = {
			name: 'gga_matcher_notificator_v2',
			language: 'es_MX',
			components: [
				{
					type: 'body',
					parameters: [
						{ type: 'text', text: vars.userName },
						{ type: 'text', text: vars.date },
						{ type: 'text', text: vars.propertyType },
						{ type: 'text', text: vars.operationType },
						{ type: 'text', text: vars.priceRange },
						{ type: 'text', text: vars.zone },
						{ type: 'text', text: vars.propertyLink },
					],
				},
			],
		};

		await this.sendTemplate(to, gunumber, template);

		const chatMessage = `👋 ¡Hola ${vars.userName}!, alguien cargó una propiedad para tu requerimiento:

Detalles de tu requerimiento:

📅 Fecha: ${vars.date}
🏠 Tipo Propiedad: ${vars.propertyType}
🖨️ Tipo Operacion: ${vars.operationType}
💰 Rango de Precios: ${vars.priceRange}
📍 Zona Consultada: ${vars.zone}

Puedes ver detalles de la propiedad en el siguiente link:
${vars.propertyLink}

No responder a este mensaje!`;

		const dbToUse = (await findOne({
			collection: 'gunumbers',
			filter: { bot_number: botPhoneNumber },
			dbName: env.mongo.databases.gu2,
		}))
			? env.mongo.databases.gu2
			: env.mongo.databases.gga;

		await updateOne({
			collection: 'chats',
			filter: { lead_id: leadId },
			update: {
				$push: {
					messages: {
						user: '',
						owner_assistant: chatMessage,
						timestamp: new Date().toISOString(),
					},
				},
			},
			dbName: dbToUse,
		});
	}

	async sendOfferNotification(link: string, from: string, to: string): Promise<void> {
		const botPhoneNumber = from.length > 0 ? from : env.whatsapp.botNumber || '';

		if (!botPhoneNumber) {
			logger.error('BOT_NUMBER no está configurado en variables de entorno');
			throw new AppError('Configuración de WhatsApp incompleta', 500);
		}

		const gunumber = await this.getGunumber(botPhoneNumber);

		if (!gunumber || !to) {
			logger.warn('No se pudo enviar notificación de oferta');
			return;
		}

		const template: WhatsAppTemplateParams = {
			name: 'gga_created_offer_notification_v1',
			language: 'es_MX',
			components: [
				{
					type: 'body',
					parameters: [{ type: 'text', text: link }],
				},
			],
		};

		await this.sendTemplate(to, gunumber, template);
	}

	async sendGenericTemplate(
		templateName: string,
		from: string,
		to: string,
		language: 'spanish' | 'english'
	): Promise<void> {
		const botPhoneNumber = from.length > 0 ? from : env.whatsapp.botNumber || '';

		if (!botPhoneNumber) {
			logger.error('BOT_NUMBER no está configurado en variables de entorno');
			throw new AppError('Configuración de WhatsApp incompleta', 500);
		}

		const gunumber = await this.getGunumber(botPhoneNumber);

		if (!gunumber || !to) {
			logger.warn('No se pudo enviar plantilla genérica');
			return;
		}

		const languageCode = language === 'spanish' ? 'es_MX' : 'en_US';

		const template: WhatsAppTemplateParams = {
			name: templateName,
			language: languageCode,
		};

		await this.sendTemplate(to, gunumber, template);
	}

	detectDevice(): 'desktop' | 'mobile' | 'ios' {
		if (typeof window === 'undefined') {
			return 'desktop'; // SSR fallback
		}

		const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;

		if (/iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream) {
			return 'ios';
		}

		if (/android/i.test(userAgent)) {
			return 'mobile';
		}

		if (/Mobi|Android/i.test(userAgent)) {
			return 'mobile';
		}

		return 'desktop';
	}

	generateWhatsAppUrl(ownerNumber: string, propertyId: string, deviceType: 'desktop' | 'mobile' | 'ios'): string {
		const basePublicLink = env.properties.publicLink || '';

		if (!basePublicLink) {
			logger.error('PROPERTY_PUBLIC_LINK no está configurado en variables de entorno');
			throw new AppError('Configuración de enlaces de propiedades incompleta', 500);
		}

		const message = `Hola, vengo desde *Market Meet*, estoy interesado en la propiedad que tienes publicada link: ${basePublicLink}${propertyId}`;

		const encodedMessage = encodeURIComponent(message);

		if (deviceType === 'desktop') {
			return `https://web.whatsapp.com/send?phone=${ownerNumber}&text=${encodedMessage}`;
		}

		return `https://wa.me/${ownerNumber}?text=${encodedMessage}`;
	}

	openWhatsAppChat(ownerNumber: string, propertyId: string): void {
		if (typeof window === 'undefined') {
			logger.warn('openWhatsAppChat solo funciona en el navegador');
			return;
		}

		const deviceType = this.detectDevice();
		const url = this.generateWhatsAppUrl(ownerNumber, propertyId, deviceType);

		if (deviceType === 'ios') {
			window.open(url);
		} else {
			window.open(url, '_blank');
		}
	}
}

export const whatsappService = new WhatsAppService();
