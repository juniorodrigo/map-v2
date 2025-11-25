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
					<Toaster
						position="top-center"
						toastOptions={{
							duration: 3000,
							style: {
								fontFamily: 'var(--font-geist-sans)',
								borderRadius: '20px',
								fontSize: '14px',
								fontWeight: '500',
								padding: '12px 16px',
								boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
								background: '#F54927',
								color: '#fff',
								marginTop: '50px',
							},
							success: {
								style: {
									background: '#10b981',
									color: '#fff',
									borderRadius: '20px',
									fontFamily: 'var(--font-geist-sans)',
									fontSize: '14px',
									fontWeight: '500',
									padding: '12px 16px',
									boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
									marginTop: '50px',
								},
							},
							error: {
								style: {
									background: '#ef4444',
									color: '#fff',
									borderRadius: '20px',
									fontFamily: 'var(--font-geist-sans)',
									fontSize: '14px',
									fontWeight: '500',
									padding: '12px 16px',
									boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
									marginTop: '50px',
								},
							},
						}}
					/>
					<MapContentBase config={mapConfig} />
				</div>
			</MapProvider>
		</APIProvider>
	);
}
