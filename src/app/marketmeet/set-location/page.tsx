'use client';

import { APIProvider } from '@vis.gl/react-google-maps';
import { SetLocationMap, LocationData } from '@/components/marketmeet/set-location';
import { useSearchParams } from 'next/navigation';
import { Suspense, useCallback } from 'react';

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY_GGA || '';

function SetLocationContent() {
	const searchParams = useSearchParams();
	const token = searchParams.get('token');
	const product = (searchParams.get('product') as 'gga' | 'gu') || 'gga';

	const handleLocationConfirmed = useCallback(
		(location: LocationData) => {
			console.log('Ubicación confirmada:', location);
			console.log('Token del usuario:', token);
			// Los datos ya fueron guardados por el backend a través de SetLocationMap
		},
		[token]
	);

	return (
		<div className="h-screen w-screen">
			<SetLocationMap onLocationConfirmed={handleLocationConfirmed} product={product} token={token} />
		</div>
	);
}

export default function SetLocationPage() {
	return (
		<APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
			<Suspense
				fallback={
					<div className="h-screen w-screen flex items-center justify-center bg-gray-100">
						<div className="text-center">
							<div className="h-12 w-12 border-4 border-[#8F7BBD] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
							<p className="text-gray-600">Cargando mapa...</p>
						</div>
					</div>
				}
			>
				<SetLocationContent />
			</Suspense>
		</APIProvider>
	);
}
