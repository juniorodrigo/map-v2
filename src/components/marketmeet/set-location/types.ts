export interface LocationCoordinates {
	lat: number;
	lng: number;
}

export interface AddressComponents {
	streetNumber?: string;
	streetName?: string;
	sublocality?: string;
	city?: string;
	state?: string;
	country?: string;
	postalCode?: string;
}

export interface LocationData {
	coordinates: LocationCoordinates;
	formattedAddress: string;
	addressComponents: AddressComponents;
}

export interface PlacePrediction {
	place_id: string;
	description: string;
	structured_formatting: {
		main_text: string;
		secondary_text: string;
	};
}

export interface SetLocationProps {
	onLocationConfirmed?: (location: LocationData) => void;
	initialCoordinates?: LocationCoordinates;
	product?: 'gga' | 'gu';
	token?: string | null;
}
