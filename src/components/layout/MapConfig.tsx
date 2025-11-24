import type { MapContentConfig } from './MapContentBase';
import { useSession } from '@/contexts/SessionProvider';

const GuResultsBadges = ({ data, total }: { data: any; total: number }) => {
	const { session } = useSession();
	console.log('Session en GuResultsBadges:', session);

	let altLabel = 'Cargando';

	if (session.searchType === 'end-user') {
		if (session.searchSubType === 'similar-properties') {
			altLabel = 'Propiedades Similares';
		} else if (session.searchSubType === 'shared-comission') {
			altLabel = 'Comisión Compartida';
		} else {
			altLabel = 'Resultados de Búsqueda';
		}
	} else {
		altLabel = 'Marketmeet';
	}

	return (
		<>
			<div className="hidden lg:flex lg:flex-row lg:items-center lg:space-x-2 lg:absolute lg:bottom-4 lg:left-4 lg:z-20">
				<div className="bg-[#8F7BBD] px-4 py-2 rounded-full shadow-lg text-white">
					<span className="text-sm font-semibold">{altLabel}</span>
				</div>
				<div className="bg-[#8F7BBD] px-4 py-2 rounded-full shadow-lg text-white">
					<span className="text-sm font-medium">{total} propiedades</span>
				</div>
			</div>

			<div className="lg:hidden absolute bottom-10 left-1/2 -translate-x-1/2 z-20 bg-[#8F7BBD] text-white px-4 py-1.5 rounded-full shadow-lg">
				<span className="text-xs font-medium whitespace-nowrap">{total} propiedades</span>
			</div>
		</>
	);
};

export const guMapConfig: MapContentConfig = {
	searchType: 'gu',
	onMarkerClick: (clusterId, ownerCluster) => {
		// Log específico de GU
		console.log('ID de la propiedad:', ownerCluster.properties[0]._id);
	},
	markerProps: (ownerId, selectedOwnerId) => ({
		isSelected: selectedOwnerId === ownerId,
	}),
	renderResultsBadges: (data, total) => <GuResultsBadges data={data} total={total} />,
};

export const marketmeetMapConfig: MapContentConfig = {
	searchType: 'marketmeet',
	renderResultsBadges: (data, total, ownersCount) => (
		<>
			<div className="hidden lg:flex lg:flex-row lg:items-center lg:space-x-2 lg:absolute lg:bottom-4 lg:left-4 lg:z-20">
				<div className="bg-[#8F7BBD] px-4 py-2 rounded-full shadow-lg text-white">
					<span className="text-sm font-semibold">Marketmeet</span>
				</div>
				<div className="bg-[#8F7BBD] px-4 py-2 rounded-full shadow-lg text-white">
					<span className="text-sm font-semibold">
						{total} propiedades / {ownersCount} propietarios
					</span>
				</div>
			</div>

			<div className="lg:hidden absolute bottom-20 left-1/2 -translate-x-1/2 z-20 bg-[#8F7BBD] text-white px-4 py-1.5 rounded-full shadow-lg">
				<span className="text-xs font-semibold whitespace-nowrap">
					{total} propiedades / {ownersCount} propietarios
				</span>
			</div>
		</>
	),
};
