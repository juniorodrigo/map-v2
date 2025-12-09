import { OwnerCluster, PropertyData, PropertyFilters } from '@/types/property';
import { hardconstants } from './constants';
import { operationTypeCodesToLabels, propertyTypeCodesToLabels } from '@/lib/property-type-mappings';
import { OwnerSettings } from '@/service/firebase/owner';
import { SearchSubtype, SearchType } from '@/contexts/SessionProvider';
import { firebaseClient } from '@/service/firebase/client';
import { getDbMaxPrice } from '@/config/price-filter';
import { UserInfo } from '@/service/mongo/user';

// Margen de precio para búsqueda de similares (±10%)
const SIMILAR_PRICE_MARGIN = 0.1;
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

	const [minPrice, uiMaxPrice] = filters.priceRange;
	const maxPrice = getDbMaxPrice(uiMaxPrice);

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

/**
 * Construye el filtro para búsqueda de propiedades similares
 *
 * La lógica de propiedades similares funciona así:
 * 1. Filtra por ubicación geográfica (bounds del mapa visible)
 * 2. Filtra por tipo de propiedad seleccionado
 * 3. Filtra por tipo de operación (Venta, Renta, etc.)
 * 4. Aplica rango de precios con un margen de ±10%
 * 5. Visibilidad según rol:
 *    - Si es AGENTE (is_agent: true): Solo ve propiedades de su propio portafolio
 *    - Si NO es agente: Ve propiedades propias del owner + propiedades de otros con share_commission: true
 */
export function buildSimilarPropertiesFilter(
	filters: PropertyFilters,
	ownerSettings: OwnerSettings | null,
	userInfo: UserInfo | null | undefined
): Record<string, unknown> {
	const filter: Record<string, unknown> = {};
	const ownerId = ownerSettings?.owner_firebase_id || userInfo?.owner_firebase_id;
	const isAgent = userInfo?.is_agent ?? false;

	// ========================
	// 1. Filtro base: Solo propiedades publicadas y no-GGA
	// ========================
	filter.$or = [{ gga: false }, { gga: { $exists: false } }];
	filter.ad_status = 'Publicado';

	// ========================
	// 2. Filtro geográfico (bounds del mapa)
	// ========================
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

	// ========================
	// 3. Filtro de tipo de propiedad
	// ========================
	if (filters.propertyType && filters.propertyType.length > 0) {
		const dbPropertyTypes = propertyTypeCodesToLabels(filters.propertyType);
		filter.house_type = { $in: dbPropertyTypes };
	}

	// ========================
	// 4. Filtro de monetización (operación + precio)
	// ========================
	const [minPrice, uiMaxPrice] = filters.priceRange;
	const maxPrice = getDbMaxPrice(uiMaxPrice);

	// Aplicar margen de ±10% para similares
	const priceWithMarginMin = minPrice * (1 - SIMILAR_PRICE_MARGIN);
	const priceWithMarginMax = maxPrice * (1 + SIMILAR_PRICE_MARGIN);

	if (filters.operationType && filters.operationType.length > 0) {
		let operationTypes = operationTypeCodesToLabels(filters.operationType);

		// Si incluye "Venta" y no "Preventa", agregar "Preventa" automáticamente
		if (operationTypes.includes('Venta') && !operationTypes.includes('Preventa')) {
			operationTypes = [...operationTypes, 'Preventa'];
		}

		const priceConditions: Record<string, unknown>[] = [];

		if (filters.currency === 'MXN') {
			priceConditions.push({
				currency: 'MXN',
				price: { $gte: priceWithMarginMin, $lte: priceWithMarginMax },
			});
			priceConditions.push({
				currency: 'USD',
				price: {
					$gte: priceWithMarginMin / hardconstants.USD_TO_MXN_RATE,
					$lte: priceWithMarginMax / hardconstants.USD_TO_MXN_RATE,
				},
			});
		} else {
			priceConditions.push({
				currency: 'USD',
				price: { $gte: priceWithMarginMin, $lte: priceWithMarginMax },
			});
			priceConditions.push({
				currency: 'MXN',
				price: {
					$gte: priceWithMarginMin * hardconstants.USD_TO_MXN_RATE,
					$lte: priceWithMarginMax * hardconstants.USD_TO_MXN_RATE,
				},
			});
		}

		// ========================
		// 5. Condiciones de visibilidad según rol (agente vs no-agente)
		// ========================
		const visibilityConditions: Record<string, unknown>[] = [];

		if (isAgent && ownerId) {
			// AGENTE: Solo ve propiedades de su propio portafolio
			visibilityConditions.push({
				user_owner: ownerId,
				prop_monetizations: {
					$elemMatch: {
						monetization_type: { $in: operationTypes },
						$or: priceConditions,
					},
				},
			});
		} else if (ownerId) {
			// NO AGENTE: Ve propiedades propias + propiedades de otros con share_commission
			// Condición 1: Propiedades del owner (sin restricción de share_commission)
			visibilityConditions.push({
				user_owner: ownerId,
				prop_monetizations: {
					$elemMatch: {
						monetization_type: { $in: operationTypes },
						$or: priceConditions,
					},
				},
			});

			// Condición 2: Propiedades de otros owners CON share_commission: true
			visibilityConditions.push({
				user_owner: { $ne: ownerId, $nin: hardconstants.BLOCKED_USERS },
				prop_monetizations: {
					$elemMatch: {
						monetization_type: { $in: operationTypes },
						share_commission: true,
						$or: priceConditions,
					},
				},
			});
		} else {
			// Sin owner definido: Solo propiedades con share_commission
			visibilityConditions.push({
				user_owner: { $nin: hardconstants.BLOCKED_USERS },
				prop_monetizations: {
					$elemMatch: {
						monetization_type: { $in: operationTypes },
						share_commission: true,
						$or: priceConditions,
					},
				},
			});
		}

		// Si hay condiciones de visibilidad, usar $or para combinarlas
		if (visibilityConditions.length > 0) {
			// Necesitamos reestructurar el filtro para incluir las condiciones de visibilidad
			const baseConditions: Record<string, unknown> = {
				$or: filter.$or,
				ad_status: filter.ad_status,
			};

			if (filter.location) {
				baseConditions.location = filter.location;
			}

			if (filter.house_type) {
				baseConditions.house_type = filter.house_type;
			}

			// Combinar condiciones base con condiciones de visibilidad usando $and
			return {
				$and: [baseConditions, { $or: visibilityConditions }],
			};
		}
	}

	return filter;
}
