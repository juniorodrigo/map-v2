import { NextRequest, NextResponse } from 'next/server';
import { env } from '@/config/env';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
	try {
		const searchParams = request.nextUrl.searchParams;
		const lat = searchParams.get('lat');
		const lng = searchParams.get('lng');
		const product = searchParams.get('product') || 'gga';

		if (!lat || !lng) {
			return NextResponse.json({ error: 'Lat and lng are required' }, { status: 400 });
		}

		const apiKey = product === 'gga' ? env.googleMaps.apiKeyGGA : env.googleMaps.apiKeyGU;

		logger.debug('Reverse Geocoding request', { lat, lng, product });

		const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;

		const response = await fetch(url);

		if (!response.ok) {
			throw new Error(`Google Geocoding API error: ${response.status}`);
		}

		const data = await response.json();

		logger.debug('Google Geocoding response', { status: data.status, resultsCount: data.results?.length });

		// Si no hay resultados, devolver un objeto con la info básica de coordenadas
		if (data.status !== 'OK' || !data.results?.[0]) {
			return NextResponse.json({
				formatted_address: `${lat}, ${lng}`,
				address_components: [],
				geometry: {
					location: { lat: parseFloat(lat), lng: parseFloat(lng) },
				},
				partial: true,
			});
		}

		// Devolver el primer resultado con toda la información de dirección
		return NextResponse.json(data.results[0]);
	} catch (error) {
		logger.error('Error in reverse geocoding', error);
		return NextResponse.json({ error: 'Failed to geocode location' }, { status: 500 });
	}
}
