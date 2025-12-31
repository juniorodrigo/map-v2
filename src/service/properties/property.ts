import { mongoClient } from '../mongo/client';
import type { PropertyFilters, PropertyData } from '@/types/property';
import { buildPropertyFilter } from '@/utils/properties';
import { env } from '@/config/env';
import { SearchSubtype, SearchType } from '@/contexts/SessionProvider';

export async function searchProperties(
	filters: PropertyFilters,
	dbName: string,
	ownerSettings: any,
	searchType: string,
	searchSubtype: string
): Promise<{ total: number; properties: PropertyData[] }> {
	const filter = await buildPropertyFilter(
		filters,
		ownerSettings,
		searchType as SearchType,
		searchSubtype as SearchSubtype
	);

	//TODO: ajustar para diferentes colecciones según tipo de búsqueda. Falta marketmeet o end-user y según las settings del owner
	const collection =
		searchType === 'marketmeet' ? env.mongo.collections.properties.gga : env.mongo.collections.properties.gu;

	// console.log(
	// 	'🔍 Filtros construidos para la búsqueda de propiedades:',
	// 	collection,
	// 	'_____',
	// 	JSON.stringify(filter),
	// 	'_____',
	// 	dbName
	// );

	const total = await mongoClient.count(collection, filter, dbName);

	const properties = (await mongoClient.find(collection, filter, dbName)) as PropertyData[];

	return { total, properties };
}
