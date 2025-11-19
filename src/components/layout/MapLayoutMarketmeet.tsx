'use client';

import React from 'react';
import { APIProvider } from '@vis.gl/react-google-maps';
import MapContainer from './MapContainer';
import SearchBar from './SearchBar';
import FloatingControls from './FloatingControls';
import { FloatingFilterBar } from './FloatingFilterBar';
import { FilterSidebar } from './FilterSidebar';
import { PropertySheet } from './PropertySheet';
import { MapProvider, useMap } from './MapContext';
import OwnerMarker from './OwnerMarker';
import { usePropertySearch } from '@/hooks/use-property-search';
import { propertyDataToProperty, propertyDataArrayToPropertyArray } from '@/lib/property-utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useSession } from '@/contexts/SessionProvider';
import type { PropertyFilters, PropertyData } from '@/types/property';
import toast, { Toaster } from 'react-hot-toast';

function MapContent() {
	const { map, searchLocation } = useMap();
	const isMobile = useIsMobile();
	const { session } = useSession();

	const [filters, setFilters] = React.useState({
		propertyType: [] as string[],
		priceRange: [5000, 10000000] as [number, number],
		currency: 'MXN',
		operationType: [] as string[],
	});

	const [filtersInitialized, setFiltersInitialized] = React.useState(false);
	const [selectedOwnerId, setSelectedOwnerId] = React.useState<string | null>(null);
	const [selectedProperty, setSelectedProperty] = React.useState<PropertyData | null>(null);
	const consecutiveEmptySearchesRef = React.useRef(0);
	const lastSearchKeyRef = React.useRef<string | null>(null);

	React.useEffect(() => {
		if (!filtersInitialized && session.userInfo?.requirement_info) {
			const requirement = session.userInfo.requirement_info;

			const minPrice = requirement.minimum_price ?? 5000;
			const maxPrice = requirement.maximum_price ?? 10000000;
			const userCurrency = requirement.currency || 'MXN';
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
	}, [session.userInfo, filtersInitialized]);

	const searchFilters = React.useMemo<PropertyFilters>(
		() => ({
			...filters,
			searchLocation: searchLocation || undefined,
		}),
		[filters, searchLocation]
	);

	const canSearch = React.useMemo(() => {
		return !!searchLocation && filters.propertyType.length > 0 && filters.operationType.length > 0;
	}, [searchLocation, filters.propertyType, filters.operationType]);

	const { data, isLoading, error, isFetched } = usePropertySearch({
		filters: searchFilters,
		enabled: canSearch,
		sessionData: session,
	});

	React.useEffect(() => {
		if (isFetched && canSearch && !isLoading && !error) {
			const searchKey = JSON.stringify(searchFilters);

			if (searchKey !== lastSearchKeyRef.current) {
				lastSearchKeyRef.current = searchKey;

				const hasResults = data && data.total > 0;

				if (hasResults) {
					toast.success(`${data.total} propiedades encontradas`, {
						position: 'top-center',
						duration: 3000,
						style: {
							background: '#10b981',
							color: '#fff',
							fontWeight: '500',
							marginTop: '40px',
						},
					});
					consecutiveEmptySearchesRef.current = 0;
				} else {
					toast.error('No se encontraron propiedades', {
						position: 'top-center',
						duration: 3000,
						style: {
							background: '#ef4444',
							color: '#fff',
							fontWeight: '500',
							marginTop: '40px',
						},
					});
					consecutiveEmptySearchesRef.current += 1;

					// Flujo de tres búsquedas fallidas
					if (consecutiveEmptySearchesRef.current === 3) {
						console.log('⚠️ ALERTA: Se han realizado 3 búsquedas consecutivas sin encontrar ninguna propiedad');
					}
				}
			}
		}
	}, [data, isLoading, error, canSearch, isFetched, searchFilters]);

	const handleFiltersChange = React.useCallback(
		(newFilters: {
			propertyType: string[];
			priceRange: [number, number];
			currency: string;
			operationType: string[];
		}) => {
			setFilters(newFilters);
		},
		[]
	);

	const handleMarkerClick = (clusterId: string) => {
		setSelectedOwnerId(clusterId);
		const ownerCluster = data?.owners?.find((o) => o.ownerId === clusterId);
		if (ownerCluster && ownerCluster.properties.length > 0) {
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

	return (
		<>
			<MapContainer>
				{/* Owner Markers */}
				{data?.owners?.map((owner) => (
					<OwnerMarker
						key={owner.ownerId}
						position={owner.position}
						propertyCount={owner.propertyCount}
						ownerId={owner.ownerId}
						ownerName={owner.ownerName}
						onClick={() => handleMarkerClick(owner.ownerId)}
					/>
				))}
			</MapContainer>

			{/* Floating Search Bar - Top */}
			<SearchBar />

			{/* Filter Sidebar for Mobile & Tablet - Bottom Left (< 1024px) */}
			<div className="absolute bottom-4 left-4 z-20 lg:hidden">
				<FilterSidebar
					propertyType={filters.propertyType}
					priceRange={filters.priceRange}
					currency={filters.currency}
					operationType={filters.operationType}
					onFiltersChange={handleFiltersChange}
				/>
			</div>

			{/* Floating Filter Bar for Desktop - Top Center (>= 1024px) */}
			<FloatingFilterBar
				propertyType={filters.propertyType}
				priceRange={filters.priceRange}
				currency={filters.currency}
				operationType={filters.operationType}
				onFiltersChange={handleFiltersChange}
			/>

			{/* Floating Controls - Bottom Right */}
			<FloatingControls />

			{/* Status Indicators */}
			{!canSearch && (
				<div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 bg-[#c4443b] text-white px-3 lg:px-4 py-2 rounded-full shadow-lg max-w-md text-center">
					<span className="text-xs lg:text-sm font-medium leading-tight">
						{!searchLocation && '📍 Busca una ubicación'}
						{searchLocation && filters.propertyType.length === 0 && ' • Selecciona tipo de propiedad'}
						{searchLocation && filters.operationType.length === 0 && ' • Selecciona tipo de operación'}
					</span>
				</div>
			)}

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

			{data && !isLoading && canSearch && (
				<>
					<div className="hidden lg:block absolute bottom-4 left-4 z-20 bg-white/95 px-4 py-2 rounded-full shadow-lg">
						<span className="text-sm font-medium">
							{data.total} propiedades • {data.owners?.length || 0} propietarios
						</span>
					</div>

					{/* Mostrar cantidad de propietarios solo con modo marketmeet*/}
					{session.searchType == 'marketmeet' && (
						<div className="lg:hidden absolute bottom-20 left-1/2 -translate-x-1/2 z-20 bg-white/95 px-4 py-1.5 rounded-full shadow-lg">
							<span className="text-xs font-medium whitespace-nowrap">
								{data.total} propiedades • {data.owners?.length || 0} propietarios
							</span>
						</div>
					)}
				</>
			)}

			<PropertySheet
				property={displayProperty}
				isOpen={!!displayProperty}
				onClose={() => {
					setSelectedProperty(null);
					setSelectedOwnerId(null);
				}}
				similarProperties={similarProperties}
				onSimilarPropertyClick={handleSimilarPropertyClick}
			/>
		</>
	);
}

export default function MapLayout() {
	return (
		<APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY_GGA ?? ''}>
			<MapProvider>
				<div className="relative h-screen w-full overflow-hidden bg-gray-100">
					<Toaster />
					<MapContent />
				</div>
			</MapProvider>
		</APIProvider>
	);
}
