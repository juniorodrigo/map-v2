import type { MapContentConfig } from './MapContentBase';
import { useSession } from '@/contexts/SessionProvider';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { HelpCircle } from 'lucide-react';

const COLORS = {
	VIEWED: '#10b981',
	DISCARDED: '#C93232',
	BASE: '#8F7BBD',
};

const ColorLegendTooltip = () => (
	<Tooltip>
		<TooltipTrigger asChild>
			<button className="bg-[#8F7BBD] px-2 py-2 rounded-full shadow-lg text-white hover:bg-[#7a68a6] transition-colors cursor-help flex items-center justify-center h-[36px]">
				<HelpCircle className="w-5 h-5" />
			</button>
		</TooltipTrigger>
		<TooltipContent
			side="top"
			sideOffset={8}
			className="bg-white text-gray-800 p-3 rounded-lg shadow-xl border max-w-xs [&>svg]:hidden"
		>
			<p className="font-semibold mb-2 text-sm">Leyenda de colores</p>
			<div className="space-y-2">
				<div className="flex items-center gap-2">
					<span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.BASE }}></span>
					<span className="text-xs">Sin revisar</span>
				</div>
				<div className="flex items-center gap-2">
					<span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.VIEWED }}></span>
					<span className="text-xs">Revisadas</span>
				</div>
				<div className="flex items-center gap-2">
					<span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.DISCARDED }}></span>
					<span className="text-xs">Descartadas</span>
				</div>
			</div>
		</TooltipContent>
	</Tooltip>
);

const GuResultsBadges = ({ data, total }: { data: any; total: number }) => {
	const { session } = useSession();

	let altLabel = 'Cargando';

	if (session.searchType === 'end-user') {
		if (session.searchSubtype === 'similar-properties') {
			altLabel = 'Propiedades Similares';
		} else if (session.searchSubtype === 'shared-comission') {
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
				<ColorLegendTooltip />
			</div>

			<div className="lg:hidden absolute bottom-10 left-1/2 -translate-x-1/2 z-20 bg-[#8F7BBD] text-white px-4 py-1.5 rounded-full shadow-lg">
				<span className="text-xs font-medium whitespace-nowrap">{total} propiedades</span>
			</div>
		</>
	);
};

export const guMapConfig: MapContentConfig = {
	searchType: 'end-user',
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
