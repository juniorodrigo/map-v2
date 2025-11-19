import { mongoClient } from './client';
import type { PropertyFilters, PropertyData, OwnerCluster } from '@/types/property';
import { propertyTypeCodesToLabels, operationTypeCodesToLabels } from '@/lib/property-type-mappings';

const BLOCKED_USERS = [
	'OqkLCzbW5cSU04PTMD8ZeutfPn92',
	'ntF4AdS3olRn4RcwLxR1WX2Frzk2',
	'qxAy6R8j3BOz4XvRrGC4MDLSe163',
	'foMpZUSrXIWcwDANEbb4P1kuyuA2',
	'BvcLPMX8Q1Z2w1Q5OaJKVX6JmMt2',
	'pRtfiHYCvnU7Wnhk9hNDFQwQgXW2',
	'iNtCkHZaQWgvAFH4wqmwiWrz4Kj1',
	'gjKoxhawuTawCEX9DWA4kEybo6g1',
	'knB0AKoChta4IvHEhexYB9HXIbq2',
	'QHiH5c02UOaURQ525k7UyxYNZQY2',
	'ojycsZOt9FSWZSCeI9KeHHRwEjj2',
	'Obi7peAZqjPwI6vnp4VWrT6tj253',
	'stbasNSsKbeOTjdDZCxiM3TNx762',
];

const USD_TO_MXN_RATE = 19.3;

export function buildPropertyFilter(filters: PropertyFilters): Record<string, unknown> {
	const filter: Record<string, unknown> = {
		user_owner: { $nin: BLOCKED_USERS },

		$or: [
			{ gga: true, ad_status: { $in: ['Borrador', 'Publicado'] } },
			{
				$or: [{ gga: false }, { gga: { $exists: false } }],
				ad_status: 'Publicado',
			},
		],
	};

	if (filters.bounds) {
		const { north, south, east, west } = filters.bounds;
		filter.location = {
			$geoWithin: {
				$geometry: {
					type: 'Polygon',
					coordinates: [
						[
							[west, south],
							[east, south],
							[east, north],
							[west, north],
							[west, south],
						],
					],
				},
			},
		};
	} else if (filters.searchLocation) {
		const searchLocAny = filters.searchLocation as unknown as {
			polygon?: unknown;
			lat?: number;
			lng?: number;
			radius?: number;
		};

		if (searchLocAny.polygon && Array.isArray(searchLocAny.polygon)) {
			filter.location = {
				$geoWithin: {
					$geometry: {
						type: 'Polygon',
						coordinates: searchLocAny.polygon,
					},
				},
			};
		} else {
			const { lat, lng, radius = 15000 } = filters.searchLocation as { lat: number; lng: number; radius?: number };

			const latDegrees = radius / 111000;
			const lngDegrees = radius / (111000 * Math.cos((lat * Math.PI) / 180));

			const north = lat + latDegrees;
			const south = lat - latDegrees;
			const east = lng + lngDegrees;
			const west = lng - lngDegrees;

			filter.location = {
				$geoWithin: {
					$geometry: {
						type: 'Polygon',
						coordinates: [
							[
								[west, south],
								[east, south],
								[east, north],
								[west, north],
								[west, south],
							],
						],
					},
				},
			};
		}
	}

	if (filters.propertyType && filters.propertyType.length > 0) {
		const dbPropertyTypes = propertyTypeCodesToLabels(filters.propertyType);
		filter.house_type = { $in: dbPropertyTypes };
	}

	const [minPrice, maxPrice] = filters.priceRange;

	// Solo aplicar filtro de monetización si hay tipos de operación seleccionados
	if (filters.operationType && filters.operationType.length > 0) {
		const operationTypes = operationTypeCodesToLabels(filters.operationType);

		const priceConditions = [];

		if (filters.currency === 'MXN') {
			priceConditions.push({
				currency: 'MXN',
				price: { $gte: minPrice, $lte: maxPrice },
			});
			priceConditions.push({
				currency: 'USD',
				price: {
					$gte: minPrice / USD_TO_MXN_RATE,
					$lte: maxPrice / USD_TO_MXN_RATE,
				},
			});
		} else {
			priceConditions.push({
				currency: 'USD',
				price: { $gte: minPrice, $lte: maxPrice },
			});
			priceConditions.push({
				currency: 'MXN',
				price: {
					$gte: minPrice * USD_TO_MXN_RATE,
					$lte: maxPrice * USD_TO_MXN_RATE,
				},
			});
		}

		filter.prop_monetizations = {
			$elemMatch: {
				monetization_type: { $in: operationTypes },
				$or: priceConditions,
				share_commission: true,
			},
		};
	}

	return filter;
}

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

export function groupPropertiesByOwner(properties: PropertyData[]): OwnerCluster[] {
	const ownerMap = new Map<string, OwnerCluster>();

	for (const property of properties) {
		const ownerId = property.user_owner;

		if (!ownerMap.has(ownerId)) {
			const [lng, lat] = property.location.coordinates;
			ownerMap.set(ownerId, {
				ownerId,
				position: { lat, lng },
				propertyCount: 0,
				properties: [],
			});
		}

		const cluster = ownerMap.get(ownerId)!;
		cluster.propertyCount++;
		cluster.properties.push(property);
	}

	const finalClusters: OwnerCluster[] = [];

	for (const cluster of ownerMap.values()) {
		if (cluster.properties.length <= 10) {
			if (cluster.properties.length > 1) {
				const avgLat =
					cluster.properties.reduce((sum, p) => sum + p.location.coordinates[1], 0) / cluster.properties.length;
				const avgLng =
					cluster.properties.reduce((sum, p) => sum + p.location.coordinates[0], 0) / cluster.properties.length;
				cluster.position = { lat: avgLat, lng: avgLng };
			}
			finalClusters.push(cluster);
		} else {
			const subClusters = divideIntoSubClusters(cluster);
			finalClusters.push(...subClusters);
		}
	}

	return finalClusters;
}

function divideIntoSubClusters(cluster: OwnerCluster): OwnerCluster[] {
	const maxClusterSize = 10;
	const properties = cluster.properties;

	const sortedProperties = [...properties].sort((a, b) => a.location.coordinates[1] - b.location.coordinates[1]);

	const subClusters: OwnerCluster[] = [];

	for (let i = 0; i < sortedProperties.length; i += maxClusterSize) {
		const subProperties = sortedProperties.slice(i, i + maxClusterSize);

		const avgLat = subProperties.reduce((sum, p) => sum + p.location.coordinates[1], 0) / subProperties.length;
		const avgLng = subProperties.reduce((sum, p) => sum + p.location.coordinates[0], 0) / subProperties.length;

		const subClusterIndex = Math.floor(i / maxClusterSize);
		const uniqueOwnerId = `${cluster.ownerId}_sub${subClusterIndex}`;

		subClusters.push({
			ownerId: uniqueOwnerId,
			ownerName: cluster.ownerName,
			position: { lat: avgLat, lng: avgLng },
			propertyCount: subProperties.length,
			properties: subProperties,
		});
	}

	return subClusters;
}

export async function getPropertiesByOwner(ownerId: string, dbName: string = 'gu'): Promise<PropertyData[]> {
	const filter = {
		user_owner: ownerId,
		$or: [
			{ gga: true, ad_status: { $in: ['Borrador', 'Publicado'] } },
			{
				$or: [{ gga: false }, { gga: { $exists: false } }],
				ad_status: 'Publicado',
			},
		],
	};

	const properties = (await mongoClient.find('property_data', filter, dbName)) as PropertyData[];

	return properties;
}
