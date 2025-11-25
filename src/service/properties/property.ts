import { mongoClient } from '../mongo/client';
import type { PropertyFilters, PropertyData } from '@/types/property';
import { buildPropertyFilter } from '@/utils/properties';

export async function searchProperties(
	filters: PropertyFilters,
	dbName: string = 'gu'
): Promise<{ total: number; properties: PropertyData[] }> {
	const filter = buildPropertyFilter(filters);
	const collection = 'property_data';

	const total = await mongoClient.count(collection, filter, dbName);

	const properties = (await mongoClient.find(collection, filter, dbName)) as PropertyData[];

	return { total, properties };
}

export async function markPropertyAsViewed(propertyId: string, viewerId: string, dbName: string = 'gu'): Promise<void> {
	await mongoClient.updateOne(
		'property_data',
		{ _id: propertyId },
		{ $addToSet: { viewed_by: viewerId } },
		dbName,
		true
	);
}
