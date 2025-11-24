'use client';

import { APIProvider } from '@vis.gl/react-google-maps';
import { MapProvider } from '../../contexts/MapContext';
import { MapContentBase } from './MapContentBase';
import { marketmeetMapConfig } from './MapConfig';
import { guMapConfig } from './MapConfig';

import { Toaster } from 'react-hot-toast';
import { useSession } from '@/contexts/SessionProvider';

export default function MapLayout() {
	const { session, isLoading } = useSession();
	const isMarketmeet = session.searchType == 'marketmeet';
	const mapConfig = isMarketmeet ? marketmeetMapConfig : guMapConfig;

	return (
		<APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY_GGA ?? ''}>
			<MapProvider>
				<div className="relative h-screen w-full overflow-hidden bg-gray-100">
					<Toaster />
					<MapContentBase config={mapConfig} />
				</div>
			</MapProvider>
		</APIProvider>
	);
}
