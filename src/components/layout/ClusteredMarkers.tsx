'use client';

import React, { useEffect, useRef } from 'react';
import { useMap as useGoogleMap } from '@vis.gl/react-google-maps';
import { MarkerClusterer } from '@googlemaps/markerclusterer';
import type { Marker } from '@googlemaps/markerclusterer';
import type { OwnerCluster } from '@/types/property';

const COLORS = {
	VIEWED: '#10b981',
	DISCARDED: '#C93232',
	BASE: '#8F7BBD',
};
interface ClusteredMarkersProps {
	owners: OwnerCluster[];
	selectedOwnerId: string | null;
	onMarkerClick: (ownerId: string) => void;
	interactedProperties?: {
		viewed: string[];
		discarded: string[];
	};
}

const MIN_ZOOM_ON_CLICK = 14; // Nivel mínimo de zoom al hacer click en un pin

export function ClusteredMarkers({
	owners,
	selectedOwnerId,
	onMarkerClick,
	interactedProperties,
}: ClusteredMarkersProps) {
	const map = useGoogleMap();
	const clustererRef = useRef<MarkerClusterer | null>(null);
	const markersRef = useRef<Map<string, google.maps.Marker>>(new Map());

	const getPinColor = (owner: OwnerCluster): string => {
		if (!interactedProperties || !owner.properties || owner.properties.length === 0) {
			return COLORS.BASE;
		}

		const propertyIds = owner.properties.map((p: any) => p._id);
		const viewedSet = new Set(interactedProperties.viewed || []);
		const discardedSet = new Set(interactedProperties.discarded || []);

		const allViewed = propertyIds.every((id: string) => viewedSet.has(id));
		const allDiscarded = propertyIds.every((id: string) => discardedSet.has(id));

		if (allDiscarded) {
			return COLORS.DISCARDED;
		} else if (allViewed) {
			return COLORS.VIEWED;
		} else {
			return COLORS.BASE;
		}
	};

	useEffect(() => {
		if (!map || !owners) return;

		const currentOwnerIds = new Set(owners.map((o) => o.ownerId));
		for (const [ownerId, marker] of markersRef.current.entries()) {
			if (!currentOwnerIds.has(ownerId)) {
				marker.setMap(null);
				markersRef.current.delete(ownerId);
			}
		}

		owners.forEach((owner) => {
			let marker = markersRef.current.get(owner.ownerId);
			const pinColor = getPinColor(owner);
			const isSelected = selectedOwnerId === owner.ownerId;

			if (!marker) {
				const selectedIconSvg = isSelected
					? '<g transform="translate(32, 4) scale(1.2)"><path d="M6 0C2.69 0 0 2.69 0 6c0 3.54 6 10 6 10s6-6.46 6-10c0-3.31-2.69-6-6-6zm0 8c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z" fill="#ef4444" stroke="white" stroke-width="0.5"/></g>'
					: '';

				const markerSvg = `
					<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48">
						<circle cx="24" cy="24" r="22" fill="${pinColor}" stroke="white" stroke-width="2"/>
						<text x="24" y="30" font-size="14" font-weight="bold" fill="white" text-anchor="middle" font-family="sans-serif">${owner.propertyCount}</text>
						${selectedIconSvg}
					</svg>
				`;

				marker = new google.maps.Marker({
					position: owner.position,
					map,
					icon: {
						url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(markerSvg),
						scaledSize: new google.maps.Size(48, 48),
						anchor: new google.maps.Point(24, 24),
					},
				});

				marker.addListener('click', () => {
					// Ajustar zoom si es muy bajo con animación suave
					const currentZoom = map.getZoom();
					if (currentZoom !== undefined && currentZoom < MIN_ZOOM_ON_CLICK) {
						// Primero centrar suavemente, luego ajustar zoom gradualmente
						map.panTo(owner.position);
						// Pequeño delay para que el pan se complete antes del zoom
						setTimeout(() => {
							const targetZoom = MIN_ZOOM_ON_CLICK;
							const startZoom = map.getZoom() || currentZoom;
							const zoomDiff = targetZoom - startZoom;
							const steps = 6;
							const stepDelay = 50;
							
							for (let i = 1; i <= steps; i++) {
								setTimeout(() => {
									const newZoom = startZoom + (zoomDiff * i) / steps;
									map.setZoom(newZoom);
								}, i * stepDelay);
							}
						}, 100);
					} else {
						// Si el zoom ya es adecuado, solo centrar suavemente
						map.panTo(owner.position);
					}
					onMarkerClick(owner.ownerId);
				});

				markersRef.current.set(owner.ownerId, marker);
			} else {
				marker.setPosition(owner.position);
				marker.setIcon({
					url:
						'data:image/svg+xml;charset=UTF-8,' +
						encodeURIComponent(`
						<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48">
							<circle cx="24" cy="24" r="22" fill="${pinColor}" stroke="white" stroke-width="2"/>
							<text x="24" y="30" font-size="14" font-weight="bold" fill="white" text-anchor="middle" font-family="sans-serif">${owner.propertyCount}</text>
							${isSelected ? '<g transform="translate(32, 4) scale(1.2)"><path d="M6 0C2.69 0 0 2.69 0 6c0 3.54 6 10 6 10s6-6.46 6-10c0-3.31-2.69-6-6-6zm0 8c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z" fill="#ef4444" stroke="white" stroke-width="0.5"/></g>' : ''}
						</svg>
					`),
					scaledSize: new google.maps.Size(48, 48),
					anchor: new google.maps.Point(24, 24),
				});
			}
		});
	}, [map, owners, selectedOwnerId, onMarkerClick, interactedProperties]);

	useEffect(() => {
		if (!map) return;

		if (!clustererRef.current) {
			clustererRef.current = new MarkerClusterer({
				map,
				markers: [],
				onClusterClick: (event, cluster, map) => {
					// Al hacer click en un cluster, hacer zoom suave para ver los marcadores
					const currentZoom = map.getZoom() || 0;
					const targetZoom = Math.min(currentZoom + 3, 18);
					
					// Primero centrar suavemente
					map.panTo(cluster.position);
					
					// Luego zoom gradual
					setTimeout(() => {
						const startZoom = map.getZoom() || currentZoom;
						const zoomDiff = targetZoom - startZoom;
						const steps = 6;
						const stepDelay = 50;
						
						for (let i = 1; i <= steps; i++) {
							setTimeout(() => {
								const newZoom = startZoom + (zoomDiff * i) / steps;
								map.setZoom(newZoom);
							}, i * stepDelay);
						}
					}, 100);
				},
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
										<text x="${size / 2}" y="${size / 2 + 6}" font-size="16" font-weight="bold" fill="white" text-anchor="middle" font-family="sans-serif">${count}</text>
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

		const markers = Array.from(markersRef.current.values());
		clustererRef.current.clearMarkers();
		if (markers.length > 0) {
			clustererRef.current.addMarkers(markers as unknown as Marker[]);
		}
	}, [map, owners]);

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
