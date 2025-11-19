import { mongoClient } from './client';
import { propertyTypeLabelsToCode, operationTypeLabelsToCode } from '@/lib/property-type-mappings';

export interface RequirementInfo {
	currency: string;
	operation: string[];
	property_type: string[];
	location_geometry: any;
	minimum_price?: number;
	maximum_price?: number;
}

export interface UserInfo {
	_id: string;
	lead_id: string;
	phone_number: string;
	owner_phone_number: string;
	owner_firebase_id: string;
	is_agent: boolean;
	requirement_info: RequirementInfo | null;
}

/*
	El token debe validarse distintamente de acuerdo al entorno marketmeet o gu.
	En este caso, temporalmente se está dejando en gu, pero debe corregirse luego.
*/
export async function getUserInfoByToken(token: string): Promise<UserInfo | null> {
	const payload: any = await mongoClient.findOne('users', { lead_id: token }, 'gu2');

	if (!payload) {
		return null;
	}

	// Convertir los datos de la DB (labels) a códigos para la UI
	const operationTypeLabels = payload?.last_requirement?.operation_type
		? [payload.last_requirement.operation_type]
		: [];
	const propertyTypeLabels = payload?.last_requirement?.property_type || [];

	const userInfo: UserInfo = {
		_id: payload._id,
		lead_id: payload.lead_id,
		phone_number: payload.phone_number,
		owner_phone_number: payload.owner_phone_number,
		owner_firebase_id: payload.owner_firebase_id,
		is_agent: payload.is_agent ?? false,
		requirement_info: payload.last_requirement
			? {
					currency: payload.last_requirement.currency || 'MXN',
					operation: operationTypeLabelsToCode(operationTypeLabels),
					property_type: propertyTypeLabelsToCode(propertyTypeLabels),
					location_geometry: payload.last_requirement.geometry || null,
					minimum_price: Number(payload.last_requirement.price_start ?? 0) || undefined,
					maximum_price: Number(payload.last_requirement.price_end ?? 0) || undefined,
				}
			: null,
	};

	return userInfo;
}
