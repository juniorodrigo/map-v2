'use client';

import React from 'react';
import MapContainer from './MapContainer';
import SearchBar from './SearchBar';
import FloatingControls from './FloatingControls';
import { FloatingFilterBar } from './FloatingFilterBar';
import { FilterSidebar } from './FilterSidebar';
import { PropertyPreviewDialog } from './PropertyPreview';
import { useMap } from '../../contexts/MapContext';
import { ClusteredMarkers } from './ClusteredMarkers';
import { usePropertySearch } from '@/hooks/use-property-search';
import { propertyDataToProperty, propertyDataArrayToPropertyArray } from '@/lib/property-utils';
import { SearchType, useSession } from '@/contexts/SessionProvider';
import type { PropertyFilters, PropertyData } from '@/types/property';
import toast from 'react-hot-toast';
import { PRICE_FILTER } from '@/config/price-filter';

export interface MapContentConfig {
	searchType: SearchType;
	renderResultsBadges?: (data: any, total: number, ownersCount: number) => React.ReactNode;
	onMarkerClick?: (clusterId: string, ownerCluster: any) => void;
	markerProps?: (ownerId: string, selectedOwnerId: string | null) => Record<string, any>;
}

interface MapContentBaseProps {
	config: MapContentConfig;
}

export function MapContentBase({ config }: MapContentBaseProps) {
	const { map, searchLocation, setSearchLocation } = useMap();
	const { session } = useSession();

	const [filters, setFilters] = React.useState<{
		propertyType: string[];
		priceRange: [number, number];
		currency: string;
		operationType: string[];
	}>({
		propertyType: [] as string[],
		priceRange: PRICE_FILTER.DEFAULT_RANGE,
		currency: PRICE_FILTER.DEFAULT_CURRENCY,
		operationType: [] as string[],
	});

	const [filtersInitialized, setFiltersInitialized] = React.useState(false);
	const [locationInitialized, setLocationInitialized] = React.useState(false);
	const [mapCentered, setMapCentered] = React.useState(false);
	const [selectedOwnerId, setSelectedOwnerId] = React.useState<string | null>(null);
	const [selectedProperty, setSelectedProperty] = React.useState<PropertyData | null>(null);
	const [interactedProperties, setInteractedProperties] = React.useState({
		viewed: [] as string[],
		discarded: [] as string[],
	});
	const consecutiveEmptySearchesRef = React.useRef(0);
	const lastSearchKeyRef = React.useRef<string | null>(null);

	// Inicializar filtros desde requirement_info o similar_info según el searchSubtype
	React.useEffect(() => {
		if (!filtersInitialized && session.userInfo) {
			// Si es búsqueda de propiedades similares, usar similar_info
			if (session.searchSubtype === 'similar-properties' && session.userInfo.similar_info) {
				const similarInfo = session.userInfo.similar_info;

				const minPrice = similarInfo.min_price ?? PRICE_FILTER.MIN;
				const maxPrice = similarInfo.max_price ?? PRICE_FILTER.MAX;
				const userPropertyTypes = similarInfo.house_types || [];
				const userOperationTypes = similarInfo.monetization_types || [];

				// Para similares, usamos MXN por defecto ya que los precios vienen en esa moneda
				setFilters({
					propertyType: userPropertyTypes,
					priceRange: [minPrice, maxPrice],
					currency: PRICE_FILTER.DEFAULT_CURRENCY,
					operationType: userOperationTypes,
				});

				setFiltersInitialized(true);
			}
			// Para otros casos, usar requirement_info
			else if (session.userInfo.requirement_info) {
				const requirement = session.userInfo.requirement_info;

				const minPrice = requirement.minimum_price ?? PRICE_FILTER.MIN;
				const maxPrice = requirement.maximum_price ?? PRICE_FILTER.MAX;
				const userCurrency = requirement.currency || PRICE_FILTER.DEFAULT_CURRENCY;
				const userPropertyTypes = requirement.property_type || [];
				const userOperationTypes = requirement.operation || [];

				setFilters({
					propertyType: userPropertyTypes,
					priceRange: [minPrice, maxPrice],
					currency: userCurrency,
					operationType: userOperationTypes,
				});

				setFiltersInitialized(true);
			}
		}
	}, [session.userInfo, session.searchSubtype, filtersInitialized]);

	// Inicializar interacted_properties desde session
	React.useEffect(() => {
		if (session.userInfo?.interacted_properties) {
			setInteractedProperties({
				viewed: session.userInfo.interacted_properties.viewed || [],
				discarded: session.userInfo.interacted_properties.discarded || [],
			});
		}
	}, [session.userInfo?.interacted_properties]);

	// Solo inicializar searchLocation para la búsqueda, NO hacer panTo aquí
	React.useEffect(() => {
		if (!locationInitialized && session.userInfo?.requirement_info?.coordinates) {
			const { lat, lng } = session.userInfo.requirement_info.coordinates;

			if (lat !== null && lng !== null) {
				setSearchLocation({ lat, lng });
				setLocationInitialized(true);
			}
		}
	}, [session.userInfo, locationInitialized, setSearchLocation]);

	// Ref para rastrear si el usuario ha cambiado la ubicación manualmente
	const userChangedLocationRef = React.useRef(false);
	const previousSearchLocationRef = React.useRef<{ lat: number; lng: number } | null>(null);

	// Detectar cambios manuales de ubicación (después de la inicialización)
	React.useEffect(() => {
		if (!locationInitialized) return;

		// Si es la primera vez después de inicializar, solo guardar la referencia
		if (previousSearchLocationRef.current === null && searchLocation) {
			previousSearchLocationRef.current = searchLocation;
			return;
		}

		if (
			searchLocation &&
			previousSearchLocationRef.current &&
			(searchLocation.lat !== previousSearchLocationRef.current.lat ||
				searchLocation.lng !== previousSearchLocationRef.current.lng)
		) {
			userChangedLocationRef.current = true;
			previousSearchLocationRef.current = searchLocation;
		}
	}, [searchLocation, locationInitialized]);

	React.useEffect(() => {
		if (!userChangedLocationRef.current || !searchLocation) return;
		if (!session.token || !session.propertiesDb) return;

		const updateLocationInDb = async () => {
			try {
				await fetch('/api/mongo/update-requirement', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						token: session.token,
						database: session.usersDb,
						filters,
						location: { lat: searchLocation.lat, lng: searchLocation.lng },
					}),
				});
				userChangedLocationRef.current = false;
			} catch (error) {
				console.error('Error actualizando ubicación:', error);
			}
		};

		updateLocationInDb();
	}, [searchLocation, session.token, session.propertiesDb, session.usersDb, filters]);

	const searchFilters = React.useMemo<PropertyFilters>(() => {
		const baseFilters: PropertyFilters = {
			...filters,
			searchLocation: searchLocation || undefined,
		};

		// Si es búsqueda de propiedades similares, incluir los IDs
		if (session.searchSubtype === 'similar-properties' && session.userInfo?.similar_info?.ids) {
			baseFilters.similarPropertyIds = session.userInfo.similar_info.ids;
		}

		return baseFilters;
	}, [filters, searchLocation, session.searchSubtype, session.userInfo?.similar_info?.ids]);

	const canSearch = React.useMemo(() => {
		return true;
	}, []);

	const { data, isLoading, error, isFetched } = usePropertySearch({
		filters: searchFilters,
		enabled: canSearch,
	});

	const propertiesCenter = React.useMemo(() => {
		if (!data?.owners || data.owners.length === 0) return null;

		let totalLat = 0;
		let totalLng = 0;
		let count = 0;

		for (const owner of data.owners) {
			if (owner.position) {
				totalLat += owner.position.lat;
				totalLng += owner.position.lng;
				count++;
			}
		}

		if (count === 0) return null;

		return {
			lat: totalLat / count,
			lng: totalLng / count,
		};
	}, [data?.owners]);

	React.useEffect(() => {
		if (mapCentered || isLoading || !isFetched || !map) return;

		const userCoords = session.userInfo?.requirement_info?.coordinates;
		const hasUserCoords = userCoords && userCoords.lat !== null && userCoords.lng !== null;
		const hasResults = data && data.total > 0 && propertiesCenter;

		if (hasUserCoords) {
			if (hasResults) {
				map.panTo(propertiesCenter);
				map.setZoom(12);
			} else {
				map.panTo({ lat: userCoords.lat!, lng: userCoords.lng! });
				map.setZoom(12);
			}
		} else {
			if (hasResults) {
				map.panTo(propertiesCenter);
				map.setZoom(6);
			}
		}

		setMapCentered(true);
	}, [mapCentered, isLoading, isFetched, map, data, propertiesCenter, session.userInfo]);

	const updateInteractedProperty = React.useCallback(
		async (propertyId: string, status: 'viewed' | 'discarded') => {
			if (!session.token || !session.propertiesDb) return;

			try {
				await fetch('/api/mongo/client/interacted-properties', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						propertyId,
						viewerId: session.token,
						dbName: session.usersDb,
						status,
					}),
				});

				// Actualizar estado local
				setInteractedProperties((prev) => {
					const newState = { ...prev };
					const field = status === 'viewed' ? 'viewed' : 'discarded';
					const otherField = status === 'viewed' ? 'discarded' : 'viewed';

					// Si la propiedad está en discarded y se intenta marcar como viewed, no hacer nada en el frontend
					if (status === 'viewed' && prev.discarded.includes(propertyId)) {
						return prev;
					}

					// Remover de la otra lista si existe
					newState[otherField] = newState[otherField].filter((id) => id !== propertyId);

					// Agregar a la lista correspondiente si no existe
					if (!newState[field].includes(propertyId)) {
						newState[field] = [...newState[field], propertyId];
					}

					return newState;
				});
			} catch (error) {
				console.error('Error registrando interacción con propiedad:', error);
			}
		},
		[session.token, session.propertiesDb]
	);

	React.useEffect(() => {
		if (isFetched && canSearch && !isLoading && !error) {
			const searchKey = JSON.stringify(searchFilters);

			if (searchKey !== lastSearchKeyRef.current) {
				lastSearchKeyRef.current = searchKey;

				const hasResults = data && data.total > 0;

				if (hasResults) {
					toast.success(`${data.total} propiedades encontradas`, {
						duration: 3000,
					});
					consecutiveEmptySearchesRef.current = 0;
				} else {
					toast.error('No se encontraron propiedades. Verifica tus filtros o ubicación', {
						duration: 3000,
					});
					consecutiveEmptySearchesRef.current += 1;

					if (consecutiveEmptySearchesRef.current === 3) {
						console.log('⚠️ ALERTA: Se han realizado 3 búsquedas consecutivas sin encontrar ninguna propiedad');
					}
				}
			}
		}
	}, [data, isLoading, error, canSearch, isFetched, searchFilters]);

	const handleFiltersChange = React.useCallback(
		async (newFilters: {
			propertyType: string[];
			priceRange: [number, number];
			currency: string;
			operationType: string[];
		}) => {
			setFilters(newFilters);

			// Actualizar last_requirement en la DB si hay sesión válida
			if (session.token && session.propertiesDb) {
				try {
					const location = searchLocation ? { lat: searchLocation.lat, lng: searchLocation.lng } : null;
					await fetch('/api/mongo/update-requirement', {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
						},
						body: JSON.stringify({
							token: session.token,
							database: session.usersDb,
							filters: newFilters,
							location,
						}),
					});
				} catch (error) {
					console.error('Error actualizando requerimiento:', error);
				}
			}
		},
		[session.token, session.propertiesDb, searchLocation]
	);

	const handleMarkerClick = (clusterId: string) => {
		setSelectedOwnerId(clusterId);
		const ownerCluster = data?.owners?.find((o) => o.ownerId === clusterId);
		if (ownerCluster && ownerCluster.properties.length > 0) {
			// Hook personalizado para cada tipo
			config.onMarkerClick?.(clusterId, ownerCluster);
			setSelectedProperty(ownerCluster.properties[0]);
		}
	};

	const similarProperties = React.useMemo(() => {
		if (!selectedOwnerId || !data) return [];
		const ownerCluster = data.owners?.find((o) => o.ownerId === selectedOwnerId);
		const properties = ownerCluster?.properties.filter((p) => p._id !== selectedProperty?._id) || [];
		return propertyDataArrayToPropertyArray(properties, filters.operationType[0] || 'venta');
	}, [selectedOwnerId, data, filters.operationType, selectedProperty]);

	const displayProperty = selectedProperty
		? propertyDataToProperty(selectedProperty, filters.operationType[0] || 'venta')
		: null;

	console.log('___________________ Display Property:', displayProperty);

	const handleSimilarPropertyClick = React.useCallback(
		(propertyId: string) => {
			if (!selectedOwnerId || !data) return;

			const ownerCluster = data.owners?.find((o) => o.ownerId === selectedOwnerId);
			const property = ownerCluster?.properties.find((p) => p._id === propertyId);

			if (property) {
				setSelectedProperty(property);
			}
		},
		[selectedOwnerId, data]
	);

	// Ya no usamos initialCenter basado en userInfo, siempre iniciamos en México
	// y luego el efecto de centrado se encarga de mover el mapa
	const initialCenter = undefined;

	return (
		<>
			<MapContainer initialCenter={initialCenter}>
				<ClusteredMarkers
					owners={data?.owners || []}
					selectedOwnerId={selectedOwnerId}
					onMarkerClick={handleMarkerClick}
					interactedProperties={interactedProperties}
				/>
			</MapContainer>
			<SearchBar />
			<div className="absolute bottom-4 left-4 z-20 lg:hidden">
				<FilterSidebar
					propertyType={filters.propertyType}
					priceRange={filters.priceRange}
					currency={filters.currency}
					operationType={filters.operationType}
					onFiltersChange={handleFiltersChange}
				/>
			</div>
			<FloatingFilterBar
				propertyType={filters.propertyType}
				priceRange={filters.priceRange}
				currency={filters.currency}
				operationType={filters.operationType}
				onFiltersChange={handleFiltersChange}
			/>
			<FloatingControls />
			{!canSearch && searchLocation && (
				<div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 bg-[#c4443b] text-white px-3 lg:px-4 py-2 rounded-full shadow-lg max-w-md text-center">
					<span className="text-xs lg:text-sm font-semibold leading-tight">
						{(filters.propertyType.length === 0 || filters.operationType.length === 0) && 'Selecciona'}
						{filters.propertyType.length === 0 && ' tipo de propiedad'}
						{filters.propertyType.length === 0 && filters.operationType.length === 0 && ' y '}
						{filters.operationType.length === 0 && ' tipo de operación'}
					</span>
				</div>
			)}{' '}
			{isLoading && canSearch && (
				<div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 bg-white/95 px-3 lg:px-4 py-2 rounded-full shadow-lg max-w-md text-center">
					<span className="text-xs lg:text-sm font-medium">Buscando propiedades...</span>
				</div>
			)}
			{error && canSearch && (
				<div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 bg-red-500/95 text-white px-3 lg:px-4 py-2 rounded-full shadow-lg max-w-md text-center">
					<span className="text-xs lg:text-sm font-medium">Error al buscar propiedades</span>
				</div>
			)}
			{data && !isLoading && canSearch && config.renderResultsBadges?.(data, data.total, data.owners?.length || 0)}
			<PropertyPreviewDialog
				property={displayProperty}
				isOpen={!!displayProperty}
				onClose={() => {
					setSelectedProperty(null);
					setSelectedOwnerId(null);
				}}
				similarProperties={similarProperties}
				onSimilarPropertyClick={handleSimilarPropertyClick}
				onPropertyViewed={updateInteractedProperty}
			/>
		</>
	);
}
