'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { AdvancedMarker, InfoWindow, useAdvancedMarkerRef, Pin } from '@vis.gl/react-google-maps';
import { LocationCoordinates } from './types';

interface DraggableMarkerProps {
	position: LocationCoordinates;
	onPositionChange: (position: LocationCoordinates) => void;
	showInfoWindow?: boolean;
}

export function DraggableMarker({ position, onPositionChange, showInfoWindow = true }: DraggableMarkerProps) {
	const [markerRef, marker] = useAdvancedMarkerRef();
	const [infoWindowOpen, setInfoWindowOpen] = useState(showInfoWindow);

	useEffect(() => {
		if (showInfoWindow) {
			setInfoWindowOpen(true);
		}
	}, [showInfoWindow, position]);

	const handleDragEnd = useCallback(
		(e: google.maps.MapMouseEvent) => {
			if (e.latLng) {
				onPositionChange({
					lat: e.latLng.lat(),
					lng: e.latLng.lng(),
				});
			}
		},
		[onPositionChange]
	);

	if (position.lat === 0 && position.lng === 0) {
		return null;
	}

	return (
		<>
			<AdvancedMarker
				ref={markerRef}
				position={position}
				draggable={true}
				onDragEnd={handleDragEnd}
				title="Ubicación de la propiedad"
			>
				<Pin background="#8F7BBD" borderColor="#7A6BB0" glyphColor="#ffffff" scale={1.2} />
			</AdvancedMarker>

			{infoWindowOpen && marker && (
				<InfoWindow anchor={marker} maxWidth={220} onCloseClick={() => setInfoWindowOpen(false)}>
					<div className="p-1">
						<p className="text-sm font-medium text-gray-900 mb-1">📍 Ajusta la ubicación</p>
						<p className="text-xs text-gray-600">
							Puedes arrastrar el pin para especificar la ubicación exacta de la propiedad
						</p>
					</div>
				</InfoWindow>
			)}
		</>
	);
}
