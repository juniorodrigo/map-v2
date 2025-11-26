import { mongoClient } from './client';
import { propertyTypeLabelsToCode, operationTypeLabelsToCode } from '@/lib/property-type-mappings';

export type PropertyStatus = 'viewed' | 'discarded';

export interface RequirementInfo {
	currency: string;
	operation: string[];
	property_type: string[];
	location_geometry: any;
	minimum_price?: number;
	maximum_price?: number;
	coordinates?: { lat: number | null; lng: number | null };
}

export interface UserInfo {
	_id: string;
	lead_id: string;
	phone_number: string;
	owner_phone_number: string;
	owner_firebase_id: string;
	is_agent: boolean;
	requirement_info: RequirementInfo | null;
	interacted_properties?: {
		viewed: string[];
		discarded: string[];
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
		},
		requirement_info: payload.last_requirement
			? {
					currency: payload.last_requirement.currency || 'MXN',
					operation: operationTypeLabelsToCode(operationTypeLabels),
					property_type: propertyTypeLabelsToCode(propertyTypeLabels),
					location_geometry: payload.last_requirement.geometry || null,
					minimum_price: Number(payload.last_requirement.price_start ?? 0) || undefined,
					maximum_price: Number(payload.last_requirement.price_end ?? 0) || undefined,
					coordinates: payload.last_requirement?.geometry?.coordinates
						? {
								lat: payload.last_requirement.geometry.coordinates[1] ?? null,
								lng: payload.last_requirement.geometry.coordinates[0] ?? null,
							}
						: undefined,
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
	const fieldToUpdate = status === 'viewed' ? 'interacted_properties.viewed' : 'interacted_properties.discarded';
	await mongoClient.updateOne(
		'users',
		{ lead_id: viewerId },
		{ $addToSet: { [fieldToUpdate]: propertyId } },
		dbName,
		true
	);
}
