import { NextRequest, NextResponse } from 'next/server';
import { env } from '@/config/env';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
	try {
		const searchParams = request.nextUrl.searchParams;
		const input = searchParams.get('input');
		const product = searchParams.get('product') || 'gga';

		if (!input) {
			return NextResponse.json({ error: 'Input is required' }, { status: 400 });
		}

		const apiKey = product === 'gga' ? env.googleMaps.apiKeyGGA : env.googleMaps.apiKeyGU;

		logger.debug('Places Autocomplete request', { input, product });

		const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&types=geocode|establishment&key=${apiKey}`;

		const response = await fetch(url);

		if (!response.ok) {
			throw new Error(`Google Places API error: ${response.status}`);
		}

		const data = await response.json();

		return NextResponse.json(data);
	} catch (error) {
		logger.error('Error in places autocomplete', error);
		return NextResponse.json({ error: 'Failed to fetch place predictions' }, { status: 500 });
	}
}
