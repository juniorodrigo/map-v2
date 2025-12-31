'use client';

import React from 'react';
import { useMap as useGoogleMap } from '@vis.gl/react-google-maps';
import { MarkerClusterer } from '@googlemaps/markerclusterer';
import type { Marker } from '@googlemaps/markerclusterer';
import type { OwnerCluster, PropertyData } from '@/types/property';

const COLORS = {
	VIEWED: '#10b981',
	DISCARDED: '#C93232',
	SCHEDULED: '#38bdf8',
	BASE: '#8F7BBD',
};

interface ClusteredMarkersProps {
	owners: OwnerCluster[];
	selectedOwnerId: string | null;
	onMarkerClick: (propertyId: string) => void;
	interactedProperties?: {
		viewed: string[];
		discarded: string[];
		scheduled: string[];
	};
}

const MIN_ZOOM_ON_CLICK = 14;

export function ClusteredMarkers({
	owners,
	selectedOwnerId,
	onMarkerClick,
	interactedProperties,
}: ClusteredMarkersProps) {
	const map = useGoogleMap();
	const clustererRef = React.useRef<MarkerClusterer | null>(null);
	const markersRef = React.useRef<Map<string, google.maps.Marker>>(new Map());

	const getPinColorForProperty = (property: PropertyData | null) => {
		if (!property || !interactedProperties) return COLORS.BASE;
		const id = property._id;
		const viewed = new Set(interactedProperties.viewed || []);
		const discarded = new Set(interactedProperties.discarded || []);
		const scheduled = new Set(interactedProperties.scheduled || []);

		if (discarded.has(id)) return COLORS.DISCARDED;
		if (scheduled.has(id)) return COLORS.SCHEDULED;
		if (viewed.has(id)) return COLORS.VIEWED;
		return COLORS.BASE;
	};

	const properties = React.useMemo(() => {
		const list: Array<PropertyData & { ownerId?: string; position?: { lat: number; lng: number } }> = [];
		for (const owner of owners || []) {
			for (const prop of owner.properties || []) {
				const coords = (prop as any).location?.coordinates as number[] | undefined;
				const position = coords && coords.length >= 2 ? { lat: coords[1], lng: coords[0] } : owner.position;
				list.push({ ...(prop as PropertyData), ownerId: owner.ownerId, position });
			}
		}
		return list;
	}, [owners]);

	// Sync markers (create/update/remove) for each property
	React.useEffect(() => {
		if (!map) return;

		// Remove markers that are no longer present
		const currentIds = new Set(properties.map((p) => p._id));
		for (const [id, marker] of markersRef.current.entries()) {
			if (!currentIds.has(id)) {
				marker.setMap(null);
				markersRef.current.delete(id);
			}
		}

		properties.forEach((property) => {
			const id = property._id;
			let marker = markersRef.current.get(id);
			const color = getPinColorForProperty(property);
			const size = 28;

			const svg = `
				<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
					<circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 2}" fill="${color}" stroke="white" stroke-width="2"/>
				</svg>
			`;

			if (!marker) {
				marker = new google.maps.Marker({
					position: property.position as any,
					map,
					icon: {
						url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg),
						scaledSize: new google.maps.Size(size, size),
						anchor: new google.maps.Point(size / 2, size / 2),
					},
				});

				(marker as any).propertyData = property;

				marker.addListener('click', () => {
					const currentZoom = map.getZoom();
					if (currentZoom !== undefined && currentZoom < MIN_ZOOM_ON_CLICK) {
						map.panTo(property.position as any);
						setTimeout(() => {
							const targetZoom = MIN_ZOOM_ON_CLICK;
							const startZoom = map.getZoom() || currentZoom;
							const zoomDiff = targetZoom - startZoom;
							const steps = 6;
							const stepDelay = 50;
							for (let i = 1; i <= steps; i++) {
								setTimeout(() => map.setZoom(startZoom + (zoomDiff * i) / steps), i * stepDelay);
							}
						}, 100);
					} else {
						map.panTo(property.position as any);
					}
					onMarkerClick(id);
				});

				markersRef.current.set(id, marker);
			} else {
				marker.setPosition(property.position as any);
				marker.setIcon({
					url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg),
					scaledSize: new google.maps.Size(size, size),
					anchor: new google.maps.Point(size / 2, size / 2),
				});
				(marker as any).propertyData = property;
			}
		});
	}, [map, properties, interactedProperties, onMarkerClick]);

	// Clusterer: create and add markers
	React.useEffect(() => {
		if (!map) return;

		if (!clustererRef.current) {
			clustererRef.current = new MarkerClusterer({
				map,
				markers: [],
				onClusterClick: (event, cluster, mapInstance) => {
					const currentZoom = mapInstance.getZoom() || 0;
					const targetZoom = Math.min(currentZoom + 3, 18);
					mapInstance.panTo((cluster as any).position || (cluster as any).center);
					setTimeout(() => {
						const startZoom = mapInstance.getZoom() || currentZoom;
						const zoomDiff = targetZoom - startZoom;
						const steps = 6;
						const stepDelay = 50;
						for (let i = 1; i <= steps; i++) {
							setTimeout(() => mapInstance.setZoom(startZoom + (zoomDiff * i) / steps), i * stepDelay);
						}
					}, 100);
				},
				renderer: {
					render: (opts: any) => {
						const count = opts.count || (opts.markers ? opts.markers.length : 0);
						const size = Math.min(50 + Math.floor(count / 5) * 5, 70);
						const position = opts.position || opts.center;
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
		if (markers.length > 0) clustererRef.current.addMarkers(markers as unknown as Marker[]);
	}, [map, properties]);

	React.useEffect(() => {
		return () => {
			if (clustererRef.current) {
				clustererRef.current.clearMarkers();
				clustererRef.current.setMap(null);
			}
			for (const marker of markersRef.current.values()) marker.setMap(null);
			markersRef.current.clear();
		};
	}, []);

	return null;
}
