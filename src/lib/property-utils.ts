import type { PropertyData } from '@/types/property';
import type { Property } from '@/components/layout/PropertySheet';

/**
 * @param data
 * @param operationTypeFilter
 */
export function propertyDataToProperty(data: PropertyData, operationTypeFilter?: string): Property {
	const filterToDbTypeMap: Record<string, string> = {
		venta: 'Venta',
		renta: 'Renta',
		preventa: 'Preventa',
		'renta-temporal': 'Renta Temporal',
	};

	let selectedMonetization = data.prop_monetizations?.[0];
	if (operationTypeFilter && filterToDbTypeMap[operationTypeFilter]) {
		const dbType = filterToDbTypeMap[operationTypeFilter];
		const found = data.prop_monetizations?.find((m) => m.monetization_type === dbType);
		if (found) {
			selectedMonetization = found;
		}
	}

	const price = selectedMonetization?.price || 0;
	const priceFormatted = new Intl.NumberFormat('es-MX').format(price);
	const currency = selectedMonetization?.currency === 'USD' ? '$' : '$';

	const operationMap: Record<string, string> = {
		Venta: 'venta',
		Renta: 'mes',
		Preventa: 'preventa',
		'Renta Temporal': 'noche',
	};
	const operation = operationMap[selectedMonetization?.monetization_type || ''] || 'mes';

	const addressParts = [data.address, data.suburb, data.city, data.state].filter(Boolean);
	const fullAddress = addressParts.join(', ') || 'Dirección no disponible';

	const property: Property = {
		id: data._id,
		title: data.title || 'Propiedad sin título',
		address: fullAddress,
		price: priceFormatted,
		currency,
		type: data.house_type || 'Propiedad',
		operation,
		bedrooms: data.bedroom || data.bedrooms || 0,
		bathrooms: data.bathroom || data.bathrooms || 0,
		area: data.construction_area || data.land_area || data.area || 0,
		images: data.pictures || data.images || [],
		rating: data.rating,
		description: data.description,
	};

	return property;
}

export function propertyDataArrayToPropertyArray(dataArray: PropertyData[], operationTypeFilter?: string): Property[] {
	return dataArray.map((data) => propertyDataToProperty(data, operationTypeFilter));
}
