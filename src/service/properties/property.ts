import { mongoClient } from '../mongo/client';
import type { PropertyFilters, PropertyData } from '@/types/property';
import { buildPropertyFilter, buildSimilarPropertiesFilter } from '@/utils/properties';
import { env } from '@/config/env';
import { SearchSubtype, SearchType } from '@/contexts/SessionProvider';
import { UserInfo } from '@/service/mongo/user';

export interface SimilarPropertiesConfig {
	ids: string[];
	house_types?: string[];
	monetization_types?: string[];
	min_price?: number;
	max_price?: number;
}

export async function searchProperties(
	filters: PropertyFilters,
	dbName: string,
	ownerSettings: any,
	searchType: string,
	searchSubtype: string,
	userInfo?: UserInfo | null
): Promise<{ total: number; properties: PropertyData[] }> {
	//TODO: ajustar para diferentes colecciones según tipo de búsqueda. Falta marketmeet o end-user y según las settings del owner
	const collection =
		searchType === 'marketmeet' ? env.mongo.collections.properties.gga : env.mongo.collections.properties.gu;

	// Para búsqueda de propiedades similares
	if (searchSubtype === 'similar-properties') {
		return searchSimilarProperties(filters, dbName, ownerSettings, userInfo, collection);
	}

	const filter = await buildPropertyFilter(
		filters,
		ownerSettings,
		searchType as SearchType,
		searchSubtype as SearchSubtype
	);

	console.log(
		'🔍 Filtros construidos para la búsqueda de propiedades:',
		collection,
		'_____',
		JSON.stringify(filter),
		'_____',
		dbName
	);

	const total = await mongoClient.count(collection, filter, dbName);

	const properties = (await mongoClient.find(collection, filter, dbName)) as PropertyData[];

	return { total, properties };
}

/**
 * Búsqueda de propiedades similares
 *
 * Esta función implementa la lógica para encontrar propiedades similares basándose en:
 * 1. IDs de propiedades similares previas (si existen en last_similaries)
 * 2. Filtros geográficos (bounds del mapa)
 * 3. Tipos de propiedad y operación
 * 4. Rango de precios con ±10% de margen
 * 5. Visibilidad según si es agente o no:
 *    - Agente: Solo ve propiedades propias
 *    - No agente: Ve propiedades propias + propiedades de otros con share_commission
 */
async function searchSimilarProperties(
	filters: PropertyFilters,
	dbName: string,
	ownerSettings: any,
	userInfo: UserInfo | null | undefined,
	collection: string
): Promise<{ total: number; properties: PropertyData[] }> {
	const filter = buildSimilarPropertiesFilter(filters, ownerSettings, userInfo);

	console.log(
		'🔍 [SIMILAR] Filtros construidos para propiedades similares:',
		collection,
		'_____',
		JSON.stringify(filter, null, 2),
		'_____',
		dbName
	);

	const total = await mongoClient.count(collection, filter, dbName);
	const properties = (await mongoClient.find(collection, filter, dbName)) as PropertyData[];

	return { total, properties };
}
