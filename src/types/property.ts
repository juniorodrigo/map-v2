export interface PropertyLocation {
	type: 'Point';
	coordinates: [number, number]; // [lng, lat]
}

export interface PropertyMonetization {
	monetization_type: string; // "Venta", "Renta", "Preventa", "Renta Temporal"
	currency: string; // "MXN", "USD"
	price: number;
	mxn_price?: number; // Precio convertido a MXN
	share_commission?: boolean;
}

export interface PropertyData {
	_id: string;
	location: PropertyLocation;
	house_type: string;
	prop_monetizations: PropertyMonetization[];
	ad_status: string; // TODO: CONFIGURAR PARA FILTRAR ESTO
	gga?: boolean;
	user_owner: string;

	title?: string;
	address?: string;
	bedroom?: number;
	bathroom?: number;
	construction_area?: number;
	land_area?: number;
	pictures?: string[];
	description?: string;

	// Ubicación
	lat?: number;
	lng?: number;
	city?: string;
	state?: string;
	suburb?: string;
	zip_code?: string;

	// Otros
	parking_lot?: number;
	antiquity?: string;
	floor?: string;

	// Por compatibilidad con código existente
	bedrooms?: number;
	bathrooms?: number;
	area?: number;
	images?: string[];
	rating?: number;

	// Marketemeet
	commission_display: string;
	shared_commission_display: string;

	firebase_id?: string;

	[key: string]: unknown;
}

export interface PropertyFilters {
	propertyType: string[]; // Array de tipos: ["casa", "departamento", etc.]
	priceRange: [number, number];
	currency: string; // "MXN" | "USD"
	operationType: string[]; // Array de tipos: ["venta", "renta", "preventa", "renta-temporal"]
	bounds?: {
		north: number;
		south: number;
		east: number;
		west: number;
	};
	searchLocation?: {
		lat: number;
		lng: number;
		radius?: number; // en metros
	};
	// ownerFirebaseId: string;
}

export interface OwnerCluster {
	ownerId: string;
	ownerName?: string;
	position: { lat: number; lng: number };
	propertyCount: number;
	properties: PropertyData[];
}

export interface PropertySearchParams {
	filters: PropertyFilters;
	limit?: number;
	skip?: number;
}

export interface PropertySearchResponse {
	success: boolean;
	data: {
		total: number;
		properties: PropertyData[];
		owners?: OwnerCluster[];
	};
	error?: string;
}
