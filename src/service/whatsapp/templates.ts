import { env } from '@/config/env';
import { logger } from '@/lib/logger';

type DeviceType = 'desktop' | 'mobile' | 'ios';

/**
 * Detecta el tipo de dispositivo del usuario
 */
export function detectDevice(): DeviceType {
	if (typeof window === 'undefined') {
		return 'desktop';
	}

	const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;

	if (/iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream) return 'ios';
	if (/android/i.test(userAgent)) return 'mobile';
	if (/Mobi|Android/i.test(userAgent)) return 'mobile';

	return 'desktop';
}

export type WhatsAppMessageType = 'contact' | 'schedule';

const MESSAGE_TEMPLATES: Record<WhatsAppMessageType, (basePublicLink: string, propertyId: string) => string> = {
	contact: (basePublicLink, propertyId) =>
		`Hola, vengo desde el mapa de *Ungga*, estoy interesado en la propiedad que tienes publicada con el ID: ${basePublicLink}${propertyId}`,
	schedule: (basePublicLink, propertyId) =>
		`Hola, vengo desde el mapa de *Ungga*, me gustaría agendar una cita para visitar la propiedad con el ID: ${basePublicLink}${propertyId}`,
};

/**
 * Genera la URL de WhatsApp con el mensaje precargado
 */
export function generateWhatsAppUrl(
	ownerNumber: string,
	propertyId: string,
	messageType: WhatsAppMessageType = 'contact'
): string {
	const basePublicLink = env.properties.publicLink || '';
	const message = MESSAGE_TEMPLATES[messageType](basePublicLink, propertyId);
	const encodedMessage = encodeURIComponent(message);

	const deviceType = detectDevice();
	// return deviceType !== 'desktop'
	// 	? `https://wa.me/${ownerNumber}?text=${encodedMessage}`
	// 	: `https://web.whatsapp.com/send?phone=${ownerNumber}&text=${encodedMessage}`;
	return `https://wa.me/${ownerNumber}?text=${encodedMessage}`;
}

/**
 * Abre WhatsApp con un mensaje precargado para contactar al agente
 */
export function openWhatsAppChat(
	ownerNumber: string,
	propertyId: string,
	messageType: WhatsAppMessageType = 'contact'
): void {
	if (typeof window === 'undefined') {
		logger.warn('openWhatsAppChat solo funciona en el navegador');
		return;
	}

	const url = generateWhatsAppUrl(ownerNumber, propertyId, messageType);
	const deviceType = detectDevice();

	if (deviceType === 'ios') {
		window.open(url);
	} else {
		window.open(url, '_blank');
	}
}

/**
 * Solicita ficha técnica de una propiedad via AWS SQS
 */
export async function requestTechnicalSheet(
	userPhoneNumber: string,
	propertyId: string,
	withData: boolean = false
): Promise<{ success: boolean; error?: string }> {
	try {
		const basePublicLink = env.properties.publicLink || '';
		const message = withData
			? `Solicito la ficha técnica de la propiedad: ${basePublicLink}${propertyId} (con datos de contacto)`
			: `Solicito la ficha técnica de la propiedad: ${basePublicLink}${propertyId}`;

		const response = await fetch('/api/aws/technical-sheet', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				userPhoneNumber,
				message,
			}),
		});

		if (!response.ok) {
			throw new Error('Error al solicitar ficha técnica');
		}

		return { success: true };
	} catch (error) {
		logger.error('Error al solicitar ficha técnica', error);
		return { success: false, error: 'No se pudo enviar la solicitud' };
	}
}
