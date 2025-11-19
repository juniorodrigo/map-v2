export const PROPERTY_TYPE_MAPPINGS = {
	casa: 'Casa',
	departamento: 'Departamento',
	terreno: 'Terreno',
	local: 'Local comercial',
	bodega: 'Bodega / Nave industrial',
	oficina: 'Oficina',
	rancho: 'Rancho / Quinta',
	edificio: 'Edificio',
	hotel: 'Hotel',
	consultorio: 'Consultorio',
	hacienda: 'Hacienda',
	otro: 'Otro',
} as const;

export const OPERATION_TYPE_MAPPINGS = {
	venta: 'Venta',
	renta: 'Renta',
	preventa: 'Preventa',
	'renta-temporal': 'Renta Temporal',
} as const;

// Tipos derivados
export type PropertyTypeCode = keyof typeof PROPERTY_TYPE_MAPPINGS;
export type PropertyTypeLabel = (typeof PROPERTY_TYPE_MAPPINGS)[PropertyTypeCode];

export type OperationTypeCode = keyof typeof OPERATION_TYPE_MAPPINGS;
export type OperationTypeLabel = (typeof OPERATION_TYPE_MAPPINGS)[OperationTypeCode];

// Mapeos inversos (label -> code)
export const PROPERTY_TYPE_REVERSE = Object.fromEntries(
	Object.entries(PROPERTY_TYPE_MAPPINGS).map(([key, value]) => [value, key])
) as Record<PropertyTypeLabel, PropertyTypeCode>;

export const OPERATION_TYPE_REVERSE = Object.fromEntries(
	Object.entries(OPERATION_TYPE_MAPPINGS).map(([key, value]) => [value, key])
) as Record<OperationTypeLabel, OperationTypeCode>;

/**
 * Convierte códigos de tipo de propiedad a labels de DB
 */
export function propertyTypeCodesToLabels(codes: string[]): string[] {
	return codes.map((code) => PROPERTY_TYPE_MAPPINGS[code as PropertyTypeCode] || code);
}

/**
 * Convierte labels de DB a códigos de tipo de propiedad
 */
export function propertyTypeLabelsToCode(labels: string[]): string[] {
	if (!Array.isArray(labels) || labels.length === 0) {
		return [];
	}
	const result = labels.map((label) => {
		const code = PROPERTY_TYPE_REVERSE[label as PropertyTypeLabel];
		if (!code) {
			console.warn(`⚠️ Property type label no encontrado: "${label}"`);
			return label;
		}
		return code;
	});
	return result;
}

/**
 * Convierte códigos de tipo de operación a labels de DB
 */
export function operationTypeCodesToLabels(codes: string[]): string[] {
	return codes.map((code) => OPERATION_TYPE_MAPPINGS[code as OperationTypeCode] || code);
}

/**
 * Convierte labels de DB a códigos de tipo de operación
 */
export function operationTypeLabelsToCode(labels: string[]): string[] {
	if (!Array.isArray(labels) || labels.length === 0) {
		return [];
	}
	const result = labels.map((label) => {
		const code = OPERATION_TYPE_REVERSE[label as OperationTypeLabel];
		if (!code) {
			console.warn(`⚠️ Operation type label no encontrado: "${label}"`);
			return label;
		}
		return code;
	});
	return result;
}

/**
 * Convierte un solo código de tipo de propiedad a label de DB
 */
export function propertyTypeCodeToLabel(code: string): string {
	return PROPERTY_TYPE_MAPPINGS[code as PropertyTypeCode] || code;
}

/**
 * Convierte un solo label de DB a código de tipo de propiedad
 */
export function propertyTypeLabelToCode(label: string): string {
	return PROPERTY_TYPE_REVERSE[label as PropertyTypeLabel] || label;
}

/**
 * Convierte un solo código de tipo de operación a label de DB
 */
export function operationTypeCodeToLabel(code: string): string {
	return OPERATION_TYPE_MAPPINGS[code as OperationTypeCode] || code;
}

/**
 * Convierte un solo label de DB a código de tipo de operación
 */
export function operationTypeLabelToCode(label: string): string {
	return OPERATION_TYPE_REVERSE[label as OperationTypeLabel] || label;
}
