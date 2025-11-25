'use client';

import React from 'react';
import { Map, useMap as useGoogleMap } from '@vis.gl/react-google-maps';
import { useMap } from '../../contexts/MapContext';

function MapInstance() {
	const googleMap = useGoogleMap();
	const { setMap } = useMap();

	React.useEffect(() => {
		if (googleMap) {
			setMap(googleMap);
		}
	}, [googleMap, setMap]);

	return null;
}

interface MapContainerProps {
	children?: React.ReactNode;
	initialCenter?: { lat: number; lng: number };
}

export default function MapContainer({ children, initialCenter }: MapContainerProps) {
	const defaultCenter = initialCenter || { lat: 23.6345, lng: -102.5528 };
	const defaultZoom = initialCenter ? 12 : 6;

	return (
		<div className="absolute inset-0 h-full w-full" data-slot="map-container">
			<Map
				defaultCenter={defaultCenter}
				defaultZoom={defaultZoom}
				gestureHandling="greedy"
				disableDefaultUI={true}
				style={{ width: '100%', height: '100%' }}
				mapId="ungga-map"
			>
				<MapInstance />
				{children}
			</Map>
		</div>
	);
}
