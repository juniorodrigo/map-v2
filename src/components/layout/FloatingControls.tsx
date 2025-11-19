'use client';

import React from 'react';
import { MdAdd, MdRemove, MdMyLocation } from 'react-icons/md';
import { Button } from '@/components/ui/button';
import { useMap } from './MapContext';

export default function FloatingControls() {
	const { zoomIn, zoomOut, centerOnUserLocation } = useMap();

	return (
		<div className="absolute right-4 bottom-20 lg:bottom-8 z-20 flex flex-col gap-2">
			<Button
				size="icon"
				variant="outline"
				aria-label="Zoom in"
				className="h-11 w-11 rounded-full bg-white/95 shadow-lg backdrop-blur-sm hover:bg-white border-0"
				onClick={zoomIn}
			>
				<MdAdd className="size-5" />
			</Button>
			<Button
				size="icon"
				variant="outline"
				aria-label="Zoom out"
				className="h-11 w-11 rounded-full bg-white/95 shadow-lg backdrop-blur-sm hover:bg-white border-0"
				onClick={zoomOut}
			>
				<MdRemove className="size-5" />
			</Button>
			<Button
				size="icon"
				variant="outline"
				aria-label="Centrar en mi ubicación"
				className="h-11 w-11 rounded-full bg-white/95 shadow-lg backdrop-blur-sm hover:bg-white border-0"
				onClick={centerOnUserLocation}
			>
				<MdMyLocation className="size-5" />
			</Button>
		</div>
	);
}
