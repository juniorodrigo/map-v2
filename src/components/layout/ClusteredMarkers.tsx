'use client';

import React, { useEffect, useRef } from 'react';
import { useMap as useGoogleMap } from '@vis.gl/react-google-maps';
import { MarkerClusterer } from '@googlemaps/markerclusterer';
import type { Marker } from '@googlemaps/markerclusterer';
import type { OwnerCluster } from '@/types/property';

interface ClusteredMarkersProps {
	owners: OwnerCluster[];
	selectedOwnerId: string | null;
	onMarkerClick: (ownerId: string) => void;
	interactedProperties?: {
		viewed: string[];
		discarded: string[];
	};
}

export function ClusteredMarkers({
	owners,
	selectedOwnerId,
	onMarkerClick,
	interactedProperties,
}: ClusteredMarkersProps) {
	const map = useGoogleMap();
	const clustererRef = useRef<MarkerClusterer | null>(null);
	const markersRef = useRef<Map<string, google.maps.Marker>>(new Map());

	// Función para determinar el color del pin basado en el estado de las propiedades
	const getPinColor = (owner: OwnerCluster): string => {
		if (!interactedProperties || !owner.properties || owner.properties.length === 0) {
			return '#8F7BBD'; // Color base (morado)
		}

		const propertyIds = owner.properties.map((p: any) => p._id);
		const viewedSet = new Set(interactedProperties.viewed || []);
		const discardedSet = new Set(interactedProperties.discarded || []);

		// Para clusters: TODAS las propiedades deben tener el mismo estado
		const allViewed = propertyIds.every((id: string) => viewedSet.has(id));
		const allDiscarded = propertyIds.every((id: string) => discardedSet.has(id));

		if (allDiscarded) {
			return '#ef4444';
		} else if (allViewed) {
			return '#3b82f6';
		} else {
			return '#8F7BBD';
		}
	};

	// Crear o actualizar marcadores
	useEffect(() => {
		if (!map || !owners) return;

		// Limpiar marcadores antiguos que ya no existen
		const currentOwnerIds = new Set(owners.map((o) => o.ownerId));
		for (const [ownerId, marker] of markersRef.current.entries()) {
			if (!currentOwnerIds.has(ownerId)) {
				marker.setMap(null);
				markersRef.current.delete(ownerId);
			}
		}

		// Crear o actualizar marcadores
		owners.forEach((owner) => {
			let marker = markersRef.current.get(owner.ownerId);
			const pinColor = getPinColor(owner);
			const isSelected = selectedOwnerId === owner.ownerId;

			if (!marker) {
				// Crear SVG del marcador
				const selectedIconSvg = isSelected
					? '<g transform="translate(32, 4) scale(1.2)"><path d="M6 0C2.69 0 0 2.69 0 6c0 3.54 6 10 6 10s6-6.46 6-10c0-3.31-2.69-6-6-6zm0 8c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z" fill="#ef4444" stroke="white" stroke-width="0.5"/></g>'
					: '';

				const markerSvg = `
					<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48">
						<circle cx="24" cy="24" r="22" fill="${pinColor}" stroke="white" stroke-width="2"/>
						<text x="24" y="30" font-size="14" font-weight="bold" fill="white" text-anchor="middle">${owner.propertyCount}</text>
						${selectedIconSvg}
					</svg>
				`;

				// Crear nuevo marcador
				marker = new google.maps.Marker({
					position: owner.position,
					map,
					icon: {
						url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(markerSvg),
						scaledSize: new google.maps.Size(48, 48),
						anchor: new google.maps.Point(24, 24),
					},
				});

				// Agregar listener de click
				marker.addListener('click', () => {
					onMarkerClick(owner.ownerId);
				});

				markersRef.current.set(owner.ownerId, marker);
			} else {
				// Actualizar posición e icono si cambió
				marker.setPosition(owner.position);
				marker.setIcon({
					url:
						'data:image/svg+xml;charset=UTF-8,' +
						encodeURIComponent(`
						<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48">
							<circle cx="24" cy="24" r="22" fill="${pinColor}" stroke="white" stroke-width="2"/>
							<text x="24" y="30" font-size="14" font-weight="bold" fill="white" text-anchor="middle">${owner.propertyCount}</text>
							${isSelected ? '<g transform="translate(32, 4) scale(1.2)"><path d="M6 0C2.69 0 0 2.69 0 6c0 3.54 6 10 6 10s6-6.46 6-10c0-3.31-2.69-6-6-6zm0 8c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z" fill="#ef4444" stroke="white" stroke-width="0.5"/></g>' : ''}
						</svg>
					`),
					scaledSize: new google.maps.Size(48, 48),
					anchor: new google.maps.Point(24, 24),
				});
			}
		});
	}, [map, owners, selectedOwnerId, onMarkerClick, interactedProperties]);

	// Inicializar o actualizar el clusterer
	useEffect(() => {
		if (!map) return;

		if (!clustererRef.current) {
			// Crear el clusterer con un renderer personalizado
			clustererRef.current = new MarkerClusterer({
				map,
				markers: [],
				renderer: {
					render: ({ count, position }) => {
						const size = Math.min(50 + Math.floor(count / 5) * 5, 70);

						const clusterMarker = new google.maps.Marker({
							position,
							map,
							icon: {
								url:
									'data:image/svg+xml;charset=UTF-8,' +
									encodeURIComponent(`
									<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
										<circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 2}" fill="#8F7BBD" stroke="white" stroke-width="3"/>
										<text x="${size / 2}" y="${size / 2 + 6}" font-size="16" font-weight="bold" fill="white" text-anchor="middle">${count}</text>
									</svg>
								`),
								scaledSize: new google.maps.Size(size, size),
								anchor: new google.maps.Point(size / 2, size / 2),
							},
							zIndex: Number(google.maps.Marker.MAX_ZINDEX) + count,
						});

						return clusterMarker as Marker;
					},
				},
			});
		}

		// Actualizar los marcadores en el clusterer
		const markers = Array.from(markersRef.current.values());
		clustererRef.current.clearMarkers();
		if (markers.length > 0) {
			clustererRef.current.addMarkers(markers as unknown as Marker[]);
		}
	}, [map, owners]);

	// Limpiar al desmontar
	useEffect(() => {
		return () => {
			if (clustererRef.current) {
				clustererRef.current.clearMarkers();
				clustererRef.current.setMap(null);
			}
			for (const marker of markersRef.current.values()) {
				marker.setMap(null);
			}
			markersRef.current.clear();
		};
	}, []);

	return null;
}
