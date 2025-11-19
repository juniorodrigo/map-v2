import { env } from '@/config/env';
import { logger } from '@/lib/logger';
import { AppError } from '@/lib/errors';

interface GooglePlaceResult {
	formatted_address?: string;
	address_components?: Array<{
		long_name: string;
		short_name: string;
		types: string[];
	}>;
	[key: string]: unknown;
}

interface SearchPlacesResult {
	places?: Array<{
		displayName?: { text: string };
		formattedAddress?: string;
		id?: string;
		[key: string]: unknown;
	}>;
}

class GooglePlacesClient {
	private apiKey: string;

	constructor(product: 'gga' | 'gu') {
		this.apiKey = product === 'gga' ? env.googleMaps.apiKeyGGA : env.googleMaps.apiKeyGU;
	}

	async getPlaceFromCoordinates(lat: number, lng: number): Promise<GooglePlaceResult | null> {
		try {
			logger.debug('Geocodificación reversa', { lat, lng });

			const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${this.apiKey}`;
			const response = await fetch(url);

			if (!response.ok) {
				throw new AppError('Error en Google Geocoding API', response.status);
			}

			const data = await response.json();

			if (data.status !== 'OK' || !data.results?.[0]) {
				return null;
			}

			return data.results[0];
		} catch (error) {
			return null;
		}
	}

	async searchPlaces(query: string): Promise<SearchPlacesResult | null> {
		try {
			const url = `https://places.googleapis.com/v1/places:searchText`;
			const response = await fetch(url, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'X-Goog-Api-Key': this.apiKey,
					'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.id',
				},
				body: JSON.stringify({ textQuery: query }),
			});

			if (!response.ok) {
				throw new AppError('Error en Google Places Text Search', response.status);
			}

			const data = await response.json();
			return data;
		} catch (error) {
			return null;
		}
	}
	async getPlaceDetails(placeId: string): Promise<GooglePlaceResult | null> {
		try {
			const url = `https://places.googleapis.com/v1/places/${placeId}`;
			const response = await fetch(url, {
				headers: {
					'X-Goog-Api-Key': this.apiKey,
					'X-Goog-FieldMask': 'displayName,formattedAddress,addressComponents',
				},
			});

			if (!response.ok) {
				throw new AppError('Error en Google Place Details', response.status);
			}

			const data = await response.json();
			return data;
		} catch (error) {
			return null;
		}
	}
}

export const googlePlacesGGA = new GooglePlacesClient('gga');
export const googlePlacesGU = new GooglePlacesClient('gu');
