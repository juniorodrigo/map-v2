import { OwnerCluster, PropertyData, PropertyFilters } from '@/types/property';
import { hardconstants } from './constants';
import { operationTypeCodesToLabels, propertyTypeCodesToLabels } from '@/lib/property-type-mappings';
import { OwnerSettings } from '@/service/firebase/owner';
import { SearchSubtype, SearchType } from '@/contexts/SessionProvider';
import { firebaseClient } from '@/service/firebase/client';
import { getDbMaxPrice } from '@/config/price-filter';
export function divideIntoSubClusters(cluster: OwnerCluster): OwnerCluster[] {
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

export async function buildPropertyFilter(
	filters: PropertyFilters,
	ownerSettings: OwnerSettings,
	searchType: SearchType,
	searchSubtype: SearchSubtype
): Promise<Record<string, unknown>> {
	// Para búsqueda de propiedades similares, usamos un filtro simplificado basado en IDs
	if (searchSubtype === 'similar-properties' && filters.similarPropertyIds && filters.similarPropertyIds.length > 0) {
		const filter: Record<string, unknown> = {
			firebase_id: { $in: filters.similarPropertyIds },
		};

		// Filtro de gga y ad_status
		filter.$or = [{ gga: false }, { gga: { $exists: false } }];
		filter.ad_status = 'Publicado';

		return filter;
	}

	let userOwnerFilter: Record<string, unknown> | undefined;

	if (searchType === 'end-user') {
		const effectiveIncludedProperties =
			searchSubtype === 'shared-comission' ? 'own_properties' : ownerSettings.included_properties;

		// console.log(effectiveIncludedProperties, '_XXXXXXXXXXXXX__________AAAAAAAAAAA');

		switch (effectiveIncludedProperties) {
			case 'own_properties':
				userOwnerFilter = {
					$eq: ownerSettings.owner_firebase_id,
					$nin: hardconstants.BLOCKED_USERS,
				};
				break;
			case 'own_and_associations':
				const ownerAssociations = ownerSettings.associations_to_include_in_search || [];
				if (ownerAssociations.length === 0) {
					userOwnerFilter = {
						$eq: ownerSettings.owner_firebase_id,
						$nin: hardconstants.BLOCKED_USERS,
					};
					break;
				}

				const matchingUserIds = await firebaseClient.findUserIdsByAssociations(ownerAssociations);

				const allOwnerIds = [ownerSettings.owner_firebase_id, ...matchingUserIds];

				console.log('__________-Owner associations included in search:', allOwnerIds);

				const uniqueOwnerIds = [...new Set(allOwnerIds)].filter((id) => !hardconstants.BLOCKED_USERS.includes(id));
				userOwnerFilter = { $in: uniqueOwnerIds };

				break;
			case 'all_properties':
			default:
				userOwnerFilter = { $nin: hardconstants.BLOCKED_USERS };
				break;
		}
	}

	const filter: Record<string, unknown> = {
		...(userOwnerFilter && { user_owner: userOwnerFilter }),
	};

	// Filtro de gga y ad_status según el tipo de búsqueda
	if (searchType === 'marketmeet') {
		// Para marketmeet: solo propiedades gga con status Borrador o Publicado
		filter.gga = true;
		filter.ad_status = { $in: ['Borrador', 'Publicado'] };
	} else {
		// Para end-user: solo propiedades NO gga con status Publicado
		filter.$or = [{ gga: false }, { gga: { $exists: false } }];
		filter.ad_status = 'Publicado';
	}

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

	// Aplicar filtro de precio SOLO si el usuario lo estableció (priceRange presente y valores válidos)
	// Ignorar si priceRange es [0, 0] que indica "sin filtro de precio"
	if (
		filters.priceRange &&
		!(filters.priceRange[0] === 0 && filters.priceRange[1] === 0) &&
		filters.operationType &&
		filters.operationType.length > 0
	) {
		const [minPrice, uiMaxPrice] = filters.priceRange;
		const maxPrice = getDbMaxPrice(uiMaxPrice);
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
					$gte: minPrice / hardconstants.USD_TO_MXN_RATE,
					$lte: maxPrice / hardconstants.USD_TO_MXN_RATE,
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
					$gte: minPrice * hardconstants.USD_TO_MXN_RATE,
					$lte: maxPrice * hardconstants.USD_TO_MXN_RATE,
				},
			});
		}

		filter.prop_monetizations = {
			$elemMatch: {
				monetization_type: { $in: operationTypes },
				$or: priceConditions,
				...(searchSubtype === 'shared-comission' && { share_commission: true }),
			},
		};
	}

	if (searchType === 'end-user' && searchSubtype === 'shared-comission') {
		filter.commission_display = {
			$nin: [0, '0', ''],
			$exists: true,
		};
	}

	return filter;
}

export function groupPropertiesByOwner(properties: PropertyData[]): OwnerCluster[] {
	const ownerMap = new Map<string, OwnerCluster>();

	// Filtrar propiedades sin coordenadas válidas
	const validProperties = properties.filter(
		(property) =>
			property.location?.coordinates &&
			Array.isArray(property.location.coordinates) &&
			property.location.coordinates.length >= 2
	);

	for (const property of validProperties) {
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
