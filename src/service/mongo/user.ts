import { mongoClient } from './client';
import { propertyTypeLabelsToCode, operationTypeLabelsToCode } from '@/lib/property-type-mappings';

export type PropertyStatus = 'viewed' | 'discarded' | 'scheduled';

export interface RequirementInfo {
	currency: string;
	operation: string[];
	property_type: string[];
	location_geometry: any;
	minimum_price?: number;
	maximum_price?: number;
	coordinates?: { lat: number | null; lng: number | null };
}

export interface SimilarInfo {
	ids: string[];
	min_price: number;
	max_price: number;
	monetization_types: string[];
	house_types?: string[];
}

export interface UserInfo {
	_id: string;
	lead_id: string;
	phone_number: string;
	owner_phone_number: string;
	owner_firebase_id: string;
	is_agent: boolean;
	requirement_info: RequirementInfo | null;
	similar_info: SimilarInfo | null;
	interacted_properties?: {
		viewed: string[];
		discarded: string[];
		scheduled: string[];
	};
}

export async function getUserInfoByToken(token: string, database: string): Promise<UserInfo | null> {
	const payload: any = await mongoClient.findOne('users', { lead_id: token }, database);

	if (!payload) {
		return null;
	}
	const rawOperationType = payload?.last_requirement?.operation_type;
	const operationTypeLabels = Array.isArray(rawOperationType)
		? rawOperationType
		: rawOperationType
			? [rawOperationType]
			: [];

	const rawPropertyType = payload?.last_requirement?.property_type;
	const propertyTypeLabels = Array.isArray(rawPropertyType)
		? rawPropertyType
		: rawPropertyType
			? [rawPropertyType]
			: [];

	// Extraer información de last_similaries
	const lastSimilaries = payload?.last_similaries;
	const similarMonetizationTypes = lastSimilaries?.monetization_types || [];
	const similarHouseTypes = lastSimilaries?.house_types || [];

	const userInfo: UserInfo = {
		_id: payload._id,
		lead_id: payload.lead_id,
		phone_number: payload.phone_number,
		owner_phone_number: payload.bot_phone_number,
		owner_firebase_id: payload.owner_firebase_id,
		is_agent: payload.is_agent ?? false,
		interacted_properties: {
			viewed: payload.interacted_properties?.viewed || [],
			discarded: payload.interacted_properties?.discarded || [],
			scheduled: payload.interacted_properties?.scheduled || [],
		},
		requirement_info: payload.last_requirement
			? {
					currency: payload.last_requirement.currency || 'MXN',
					operation: operationTypeLabelsToCode(operationTypeLabels),
					property_type: propertyTypeLabelsToCode(propertyTypeLabels),
					location_geometry: payload.last_requirement.geometry || null,
					minimum_price:
						payload.last_requirement.price_start != null ? Number(payload.last_requirement.price_start) : undefined,
					maximum_price:
						payload.last_requirement.price_end != null ? Number(payload.last_requirement.price_end) : undefined,
					coordinates: payload.last_requirement?.geometry?.coordinates
						? {
								lat: payload.last_requirement.geometry.coordinates[1] ?? null,
								lng: payload.last_requirement.geometry.coordinates[0] ?? null,
							}
						: undefined,
				}
			: null,
		similar_info: lastSimilaries
			? {
					ids: lastSimilaries.ids || [],
					min_price: Number(lastSimilaries.min_price ?? 0),
					max_price: Number(lastSimilaries.max_price ?? 0),
					monetization_types: operationTypeLabelsToCode(similarMonetizationTypes),
					house_types: propertyTypeLabelsToCode(similarHouseTypes),
				}
			: null,
	};

	return userInfo;
}

export async function updateClientPropertiesList(
	propertyId: string,
	viewerId: string,
	dbName: string,
	status: PropertyStatus
): Promise<void> {
	const fieldMap: Record<PropertyStatus, string> = {
		viewed: 'interacted_properties.viewed',
		discarded: 'interacted_properties.discarded',
		scheduled: 'interacted_properties.scheduled',
	};
	const fieldToUpdate = fieldMap[status];
	await mongoClient.updateOne(
		'users',
		{ lead_id: viewerId },
		{ $addToSet: { [fieldToUpdate]: propertyId } },
		dbName,
		true
	);
}
