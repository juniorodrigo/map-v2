import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { mongoClient } from '@/service/mongo/client';
import { env } from '@/config/env';

export async function GET(request: NextRequest) {
	try {
		const searchParams = request.nextUrl.searchParams;
		const token = searchParams.get('token');

		if (!token) {
			return NextResponse.json({ error: 'Token es requerido' }, { status: 400 });
		}

		logger.info('Obteniendo información de oferta', { token });

		const dbName = env.mongo.gga.users || 'gu2';

		// 1. Buscar usuario por lead_id (token)
		const users = (await mongoClient.find('users', { lead_id: token }, dbName)) as any[];

		if (!users || users.length === 0) {
			return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
		}

		const user = users[0];

		if (!user.current_offer_id) {
			return NextResponse.json(
				{
					error: 'No hay oferta activa',
					hasActiveOffer: false,
					user: {
						phone_number: user.phone_number,
						lead_id: user.lead_id,
					},
				},
				{ status: 200 }
			);
		}

		// 2. Buscar la oferta en MongoDB
		const offers = (await mongoClient.find('offers', { offer_id: user.current_offer_id }, dbName)) as any[];

		if (!offers || offers.length === 0) {
			return NextResponse.json({ error: 'Oferta no encontrada' }, { status: 404 });
		}

		const offer = offers[0];

		return NextResponse.json({
			success: true,
			hasActiveOffer: true,
			user: {
				phone_number: user.phone_number,
				lead_id: user.lead_id,
				bot_phone_number: user.bot_phone_number,
			},
			offer: {
				offer_id: offer.offer_id,
				type_property: offer.type_property,
				type_operation: offer.type_operation,
				price: offer.price,
				currency: offer.currency,
				title: offer.title_of_offer,
				description: offer.description,
				bedroom: offer.bedroom,
				bathroom: offer.bathroom,
				half_bathroom: offer.half_bathroom,
				parking_lot: offer.parking_lot,
				construction_area: offer.construction_area,
				land_area: offer.land_area,
				images: offer.images,
				percentage: offer.percentage,
				months: offer.months,
			},
		});
	} catch (error) {
		logger.error('Error obteniendo información de oferta', error);
		return NextResponse.json({ error: 'Error al procesar la solicitud' }, { status: 500 });
	}
}
