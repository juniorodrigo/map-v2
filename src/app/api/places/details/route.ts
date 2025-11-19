import { NextRequest, NextResponse } from 'next/server';
import { env } from '@/config/env';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
	try {
		const searchParams = request.nextUrl.searchParams;
		const placeId = searchParams.get('placeId');
		const product = searchParams.get('product') || 'gga';

		if (!placeId) {
			return NextResponse.json({ error: 'Place ID is required' }, { status: 400 });
		}

		const apiKey = product === 'gga' ? env.googleMaps.apiKeyGGA : env.googleMaps.apiKeyGU;

		logger.debug('Places Details request', { placeId, product });

		const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=geometry,formatted_address,name&key=${apiKey}`;

		const response = await fetch(url);

		if (!response.ok) {
			throw new Error(`Google Places API error: ${response.status}`);
		}

		const data = await response.json();

		return NextResponse.json(data);
	} catch (error) {
		logger.error('Error in places details', error);
		return NextResponse.json({ error: 'Failed to fetch place details' }, { status: 500 });
	}
}
