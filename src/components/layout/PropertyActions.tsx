'use client';

import { MdWhatsapp } from 'react-icons/md';
import ContactAgentButton from './ContactAgentButton';
import { Button } from '../ui/button';
import { useSession } from '@/contexts/SessionProvider';
import { ReactNode } from 'react';

export interface PropertyActionsProperty {
	id: string;
	user_owner?: string;
}

interface ActionButton {
	id: string;
	showsInPreview: boolean;
	render: () => ReactNode;
}

interface PropertyActionsContainerProps {
	property: PropertyActionsProperty;
	onViewDetails?: () => void;
	onDiscard?: () => void;
	showsInPreview?: boolean;
}

function DefaultActions({ property, onViewDetails, onDiscard, showsInPreview = false }: PropertyActionsContainerProps) {
	const buttons: ActionButton[] = [
		{
			id: 'contact',
			showsInPreview: true,
			render: () => (
				<ContactAgentButton
					key="contact"
					propertyId={property.id}
					userOwnerId={property.user_owner}
					className={
						showsInPreview
							? 'w-full h-10 md:h-11 text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2'
							: 'h-11 text-sm font-semibold rounded-lg transition-opacity flex items-center justify-center gap-2 bg-[#8F7BBD] hover:bg-purple-900'
					}
					style={showsInPreview ? { backgroundColor: '#8F7BBD' } : undefined}
				>
					<MdWhatsapp className="size-4" />
					Más información
				</ContactAgentButton>
			),
		},
		// Botón Ver detalles
		{
			id: 'view-details',
			showsInPreview: true,
			render: () =>
				onViewDetails ? (
					<Button
						key="view-details"
						onClick={onViewDetails}
						variant="outline"
						className="w-full h-10 md:h-11 text-sm font-semibold rounded-lg border-2 hover:bg-gray-50 transition-colors"
						style={{ borderColor: '#8F7BBD', color: '#8F7BBD' }}
					>
						Ver detalles completos
					</Button>
				) : null,
		},
		{
			id: 'schedule',
			showsInPreview: false,
			render: () => (
				<Button
					key="schedule"
					variant="outline"
					className="h-11 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-colors"
					disabled
					onClick={() => {}}
				>
					Agendar Cita
				</Button>
			),
		},
		{
			id: 'discard',
			showsInPreview: false,
			render: () =>
				onDiscard ? (
					<Button
						key="discard"
						variant="ghost"
						className="h-11 text-sm font-semibold rounded-lg transition-opacity bg-[#C93232] text-white hover:bg-red-800 hover:text-white"
						onClick={onDiscard}
					>
						No me interesa
					</Button>
				) : null,
		},
	];

	const filteredButtons = buttons.filter((btn) =>
		showsInPreview ? btn.showsInPreview : !btn.showsInPreview || btn.id === 'contact'
	);

	return (
		<div className={showsInPreview ? 'space-y-2' : 'grid grid-cols-1 sm:grid-cols-3 gap-3'}>
			{filteredButtons.map((btn) => btn.render())}
		</div>
	);
}

function SharedComissionActions({
	property,
	onViewDetails,
	onDiscard,
	showsInPreview = false,
}: PropertyActionsContainerProps) {
	const buttons: ActionButton[] = [
		{
			id: 'contact-agent',
			showsInPreview: true,
			render: () => (
				<ContactAgentButton
					key="contact-agent"
					propertyId={property.id}
					userOwnerId={property.user_owner}
					className={
						showsInPreview
							? 'w-full h-10 md:h-11 text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2'
							: 'h-11 text-sm font-semibold rounded-lg transition-opacity flex items-center justify-center gap-2 bg-[#8F7BBD] hover:bg-purple-900'
					}
					style={showsInPreview ? { backgroundColor: '#8F7BBD' } : undefined}
				>
					<MdWhatsapp className="size-4" />
					Contactar asesor
				</ContactAgentButton>
			),
		},
		{
			id: 'view-details',
			showsInPreview: true,
			render: () =>
				onViewDetails ? (
					<Button
						key="view-details"
						onClick={onViewDetails}
						variant="outline"
						className="w-full h-10 md:h-11 text-sm font-semibold rounded-lg border-2 hover:bg-gray-50 transition-colors"
						style={{ borderColor: '#8F7BBD', color: '#8F7BBD' }}
					>
						Ver detalles completos
					</Button>
				) : null,
		},
		{
			id: 'schedule',
			showsInPreview: false,
			render: () => (
				<Button
					key="schedule"
					variant="outline"
					className="h-11 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-colors"
					disabled
					onClick={() => {}}
				>
					Agendar Cita
				</Button>
			),
		},
		{
			id: 'datasheet',
			showsInPreview: false,
			render: () => (
				<Button
					key="datasheet"
					variant="outline"
					className="h-11 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-colors"
					disabled
					onClick={() => {}}
				>
					Solicitar Ficha técnica
				</Button>
			),
		},
		{
			id: 'discard',
			showsInPreview: false,
			render: () =>
				onDiscard ? (
					<Button
						key="discard"
						variant="ghost"
						className="h-11 text-sm font-semibold rounded-lg transition-opacity bg-[#C93232] text-white hover:bg-red-800 hover:text-white"
						onClick={onDiscard}
					>
						No me interesa
					</Button>
				) : null,
		},
	];

	const filteredButtons = buttons.filter((btn) =>
		showsInPreview ? btn.showsInPreview : !btn.showsInPreview || btn.id === 'contact-agent'
	);

	return (
		<div className={showsInPreview ? 'space-y-2' : 'grid grid-cols-1 sm:grid-cols-3 gap-3'}>
			{filteredButtons.map((btn) => btn.render())}
		</div>
	);
}

function MarketmeetActions({
	property,
	onViewDetails,
	onDiscard,
	showsInPreview = false,
}: PropertyActionsContainerProps) {
	const buttons: ActionButton[] = [
		{
			id: 'contact-agent',
			showsInPreview: true,
			render: () => (
				<ContactAgentButton
					key="contact-agent"
					propertyId={property.id}
					userOwnerId={property.user_owner}
					className={
						showsInPreview
							? 'w-full h-10 md:h-11 text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2'
							: 'h-11 text-sm font-semibold rounded-lg transition-opacity flex items-center justify-center gap-2 bg-[#8F7BBD] hover:bg-purple-900'
					}
					style={showsInPreview ? { backgroundColor: '#8F7BBD' } : undefined}
				>
					<MdWhatsapp className="size-4" />
					Contactar asesor
				</ContactAgentButton>
			),
		},
		{
			id: 'view-details',
			showsInPreview: true,
			render: () =>
				onViewDetails ? (
					<Button
						key="view-details"
						onClick={onViewDetails}
						variant="outline"
						className="w-full h-10 md:h-11 text-sm font-semibold rounded-lg border-2 hover:bg-gray-50 transition-colors"
						style={{ borderColor: '#8F7BBD', color: '#8F7BBD' }}
					>
						Ver detalles completos
					</Button>
				) : null,
		},
		{
			id: 'schedule',
			showsInPreview: false,
			render: () => (
				<Button
					key="schedule"
					variant="outline"
					className="h-11 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-colors"
					disabled
					onClick={() => {}}
				>
					Agendar Cita
				</Button>
			),
		},
		{
			id: 'datasheet',
			showsInPreview: false,
			render: () => (
				<Button
					key="datasheet"
					variant="outline"
					className="h-11 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-colors"
					disabled
					onClick={() => {}}
				>
					Solicitar Ficha técnica
				</Button>
			),
		},
		{
			id: 'discard',
			showsInPreview: false,
			render: () =>
				onDiscard ? (
					<Button
						key="discard"
						variant="ghost"
						className="h-11 text-sm font-semibold rounded-lg transition-opacity bg-[#C93232] text-white hover:bg-red-800 hover:text-white"
						onClick={onDiscard}
					>
						No me interesa
					</Button>
				) : null,
		},
	];

	const filteredButtons = buttons.filter((btn) =>
		showsInPreview ? btn.showsInPreview : !btn.showsInPreview || btn.id === 'contact-agent'
	);

	return (
		<div className={showsInPreview ? 'space-y-2' : 'grid grid-cols-1 sm:grid-cols-3 gap-3'}>
			{filteredButtons.map((btn) => btn.render())}
		</div>
	);
}

export function PropertyActions(props: PropertyActionsContainerProps) {
	const { session } = useSession();

	const isSharedComission = session?.searchType === 'end-user' && session?.searchSubtype === 'shared-comission';

	if (isSharedComission) return <SharedComissionActions {...props} />;
	if (session?.searchType === 'marketmeet') return <MarketmeetActions {...props} />;

	return <DefaultActions {...props} />;
}
