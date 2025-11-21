import React from 'react';
import type { MapContentConfig } from './MapContentBase';

export const guMapConfig: MapContentConfig = {
	searchType: 'gu',
	onMarkerClick: (clusterId, ownerCluster) => {
		// Log específico de GU
		console.log('ID de la propiedad:', ownerCluster.properties[0]._id);
	},
	markerProps: (ownerId, selectedOwnerId) => ({
		isSelected: selectedOwnerId === ownerId,
	}),
	renderResultsBadges: (data, total) => (
		<>
			<div className="hidden lg:flex lg:flex-row lg:items-center lg:space-x-2 lg:absolute lg:bottom-4 lg:left-4 lg:z-20">
				<div className="bg-[#1C1C1C] px-4 py-2 rounded-full shadow-lg text-white">
					<span className="text-sm font-semibold">Propiedades Similares</span>
				</div>
				<div className="bg-[#8F7BBD] px-4 py-2 rounded-full shadow-lg text-white">
					<span className="text-sm font-medium">{total} propiedades</span>
				</div>
			</div>

			<div className="lg:hidden absolute bottom-10 left-1/2 -translate-x-1/2 z-20 bg-[#8F7BBD] text-white px-4 py-1.5 rounded-full shadow-lg">
				<span className="text-xs font-medium whitespace-nowrap">{total} propiedades</span>
			</div>
		</>
	),
};

export const marketmeetMapConfig: MapContentConfig = {
	searchType: 'marketmeet',
	renderResultsBadges: (data, total, ownersCount) => (
		<>
			<div className="hidden lg:block absolute bottom-4 left-4 z-20 bg-white/95 px-4 py-2 rounded-full shadow-lg">
				<span className="text-sm font-semibold">
					{total} propiedades • {ownersCount} propietarios
				</span>
			</div>

			<div className="lg:hidden absolute bottom-20 left-1/2 -translate-x-1/2 z-20 bg-white/95 px-4 py-1.5 rounded-full shadow-lg">
				<span className="text-xs font-semibold whitespace-nowrap">
					{total} propiedades • {ownersCount} propietarios
				</span>
			</div>
		</>
	),
};
