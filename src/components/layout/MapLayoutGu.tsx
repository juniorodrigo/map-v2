'use client';

import React from 'react';
import { APIProvider } from '@vis.gl/react-google-maps';
import { MapProvider } from './MapContext';
import { MapContentBase } from './MapContentBase';
import { guMapConfig } from './map-configs';
import { Toaster } from 'react-hot-toast';

export default function MapLayout() {
	return (
		<APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY_GGA ?? ''}>
			<MapProvider>
				<div className="relative h-screen w-full overflow-hidden bg-gray-100">
					<Toaster />
					<MapContentBase config={guMapConfig} />
				</div>
			</MapProvider>
		</APIProvider>
	);
}
