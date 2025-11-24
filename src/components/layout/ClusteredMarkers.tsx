'use client';

import React, { useEffect, useRef } from 'react';
import { useMap as useGoogleMap } from '@vis.gl/react-google-maps';
import { MarkerClusterer } from '@googlemaps/markerclusterer';
import type { Marker } from '@googlemaps/markerclusterer';

interface OwnerData {
	ownerId: string;
	position: { lat: number; lng: number };
	propertyCount: number;
	ownerName?: string;
}

interface ClusteredMarkersProps {
	owners: OwnerData[];
	selectedOwnerId: string | null;
	onMarkerClick: (ownerId: string) => void;
}

export function ClusteredMarkers({ owners, selectedOwnerId, onMarkerClick }: ClusteredMarkersProps) {
	const map = useGoogleMap();
	const clustererRef = useRef<MarkerClusterer | null>(null);
	const markersRef = useRef<Map<string, google.maps.Marker>>(new Map());

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
			const isSelected = selectedOwnerId === owner.ownerId;

			if (!marker) {
				// Crear nuevo marcador
				marker = new google.maps.Marker({
					position: owner.position,
					map,
					icon: {
						url:
							'data:image/svg+xml;charset=UTF-8,' +
							encodeURIComponent(`
							<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48">
								<circle cx="24" cy="24" r="22" fill="${isSelected ? '#3b82f6' : '#8F7BBD'}" stroke="white" stroke-width="2"/>
								<text x="24" y="30" font-size="14" font-weight="bold" fill="white" text-anchor="middle">${owner.propertyCount}</text>
							</svg>
						`),
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
							<circle cx="24" cy="24" r="22" fill="${isSelected ? '#3b82f6' : '#8F7BBD'}" stroke="white" stroke-width="2"/>
							<text x="24" y="30" font-size="14" font-weight="bold" fill="white" text-anchor="middle">${owner.propertyCount}</text>
						</svg>
					`),
					scaledSize: new google.maps.Size(48, 48),
					anchor: new google.maps.Point(24, 24),
				});
			}
		});
	}, [map, owners, selectedOwnerId, onMarkerClick]);

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
