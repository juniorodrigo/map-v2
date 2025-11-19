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
	house_type: string; // "Casa", "Departamento", etc.
	prop_monetizations: PropertyMonetization[];
	ad_status: string; // "Borrador", "Publicado"
	gga?: boolean;
	user_owner: string;

	// Campos reales del MongoDB
	title?: string;
	address?: string;
	bedroom?: number; // Nota: es "bedroom" no "bedrooms"
	bathroom?: number; // Nota: es "bathroom" no "bathrooms"
	construction_area?: number; // Área de construcción
	land_area?: number; // Área de terreno
	pictures?: string[]; // Nota: es "pictures" no "images"
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
