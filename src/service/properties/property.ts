import { mongoClient } from '../mongo/client';
import type { PropertyFilters, PropertyData } from '@/types/property';
import { buildPropertyFilter } from '@/utils/properties';

export async function searchProperties(
	filters: PropertyFilters,
	dbName: string
): Promise<{ total: number; properties: PropertyData[] }> {
	const filter = buildPropertyFilter(filters);

	const collection = 'property_data';

	const total = await mongoClient.count(collection, filter, dbName);

	const properties = (await mongoClient.find(collection, filter, dbName)) as PropertyData[];

	return { total, properties };
}
