'use client';

import { useState } from 'react';
import { MdWhatsapp } from 'react-icons/md';
import { Button } from '../ui/button';
import { useSession } from '@/contexts/SessionProvider';
import { ReactNode } from 'react';
import { openWhatsAppChat, requestTechnicalSheet } from '@/service/whatsapp/templates';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';

export interface PropertyActionsProperty {
	id: string;
	user_owner?: string;
	owner_phone_number?: string;
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
	const { session } = useSession();

	// Siempre usar el bot_phone_number de la sesión
	const botPhoneNumber = session?.userInfo?.owner_phone_number;

	const handleContactClick = () => {
		if (botPhoneNumber) {
			openWhatsAppChat(botPhoneNumber, property.id);
		}
	};

	const buttons: ActionButton[] = [
		{
			id: 'contact',
			showsInPreview: true,
			render: () => (
				<Button
					key="contact"
					onClick={handleContactClick}
					disabled={!botPhoneNumber}
					className={
						showsInPreview
							? 'w-full h-10 md:h-11 text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2'
							: 'h-11 text-sm font-semibold rounded-lg transition-opacity flex items-center justify-center gap-2 bg-[#8F7BBD] hover:bg-purple-900'
					}
					style={showsInPreview ? { backgroundColor: '#8F7BBD' } : undefined}
				>
					<MdWhatsapp className="size-4" />
					Más información
				</Button>
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
	const { session } = useSession();
	const [showTechnicalSheetDialog, setShowTechnicalSheetDialog] = useState(false);
	const [isRequestingSheet, setIsRequestingSheet] = useState(false);

	// Siempre usar el bot_phone_number de la sesión
	const botPhoneNumber = session?.userInfo?.owner_phone_number;

	const handleContactClick = () => {
		if (botPhoneNumber) {
			openWhatsAppChat(botPhoneNumber, property.id);
		}
	};

	const handleTechnicalSheetRequest = async (withData: boolean) => {
		const userPhoneNumber = session?.userInfo?.phone_number;
		if (!userPhoneNumber) return;

		setIsRequestingSheet(true);
		const result = await requestTechnicalSheet(userPhoneNumber, property.id, withData);
		setIsRequestingSheet(false);
		setShowTechnicalSheetDialog(false);

		if (!result.success) {
			console.error('Error al solicitar ficha técnica:', result.error);
		}
	};

	const buttons: ActionButton[] = [
		{
			id: 'contact-agent',
			showsInPreview: true,
			render: () => (
				<Button
					key="contact-agent"
					onClick={handleContactClick}
					disabled={!botPhoneNumber}
					className={
						showsInPreview
							? 'w-full h-10 md:h-11 text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2'
							: 'h-11 text-sm font-semibold rounded-lg transition-opacity flex items-center justify-center gap-2 bg-[#8F7BBD] hover:bg-purple-900'
					}
					style={showsInPreview ? { backgroundColor: '#8F7BBD' } : undefined}
				>
					<MdWhatsapp className="size-4" />
					Contactar asesor
				</Button>
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
					onClick={() => setShowTechnicalSheetDialog(true)}
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
		<>
			<div className={showsInPreview ? 'space-y-2' : 'grid grid-cols-1 sm:grid-cols-3 gap-3'}>
				{filteredButtons.map((btn) => btn.render())}
			</div>

			<Dialog open={showTechnicalSheetDialog} onOpenChange={setShowTechnicalSheetDialog}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Solicitar Ficha Técnica</DialogTitle>
						<DialogDescription>¿Deseas recibir la ficha técnica con tus datos de contacto incluidos?</DialogDescription>
					</DialogHeader>
					<DialogFooter className="flex flex-col sm:flex-row gap-2">
						<Button variant="outline" onClick={() => handleTechnicalSheetRequest(false)} disabled={isRequestingSheet}>
							Sin mis datos
						</Button>
						<Button onClick={() => handleTechnicalSheetRequest(true)} disabled={isRequestingSheet}>
							{isRequestingSheet ? 'Enviando...' : 'Con mis datos'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}

function MarketmeetActions({
	property,
	onViewDetails,
	onDiscard,
	showsInPreview = false,
}: PropertyActionsContainerProps) {
	const { session } = useSession();
	const [showTechnicalSheetDialog, setShowTechnicalSheetDialog] = useState(false);
	const [isRequestingSheet, setIsRequestingSheet] = useState(false);

	// Siempre usar el bot_phone_number de la sesión
	const botPhoneNumber = session?.userInfo?.owner_phone_number;

	const handleContactClick = () => {
		if (botPhoneNumber) {
			openWhatsAppChat(botPhoneNumber, property.id);
		}
	};

	const handleTechnicalSheetRequest = async (withData: boolean) => {
		const userPhoneNumber = session?.userInfo?.phone_number;
		if (!userPhoneNumber) return;

		setIsRequestingSheet(true);
		const result = await requestTechnicalSheet(userPhoneNumber, property.id, withData);
		setIsRequestingSheet(false);
		setShowTechnicalSheetDialog(false);

		if (!result.success) {
			console.error('Error al solicitar ficha técnica:', result.error);
		}
	};

	const buttons: ActionButton[] = [
		{
			id: 'contact-agent',
			showsInPreview: true,
			render: () => (
				<Button
					key="contact-agent"
					onClick={handleContactClick}
					disabled={!botPhoneNumber}
					className={
						showsInPreview
							? 'w-full h-10 md:h-11 text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2'
							: 'h-11 text-sm font-semibold rounded-lg transition-opacity flex items-center justify-center gap-2 bg-[#8F7BBD] hover:bg-purple-900'
					}
					style={showsInPreview ? { backgroundColor: '#8F7BBD' } : undefined}
				>
					<MdWhatsapp className="size-4" />
					Contactar asesor
				</Button>
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
					onClick={() => setShowTechnicalSheetDialog(true)}
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
		<>
			<div className={showsInPreview ? 'space-y-2' : 'grid grid-cols-1 sm:grid-cols-3 gap-3'}>
				{filteredButtons.map((btn) => btn.render())}
			</div>

			<Dialog open={showTechnicalSheetDialog} onOpenChange={setShowTechnicalSheetDialog}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Solicitar Ficha Técnica</DialogTitle>
						<DialogDescription>¿Deseas recibir la ficha técnica con tus datos de contacto incluidos?</DialogDescription>
					</DialogHeader>
					<DialogFooter className="flex flex-col sm:flex-row gap-2">
						<Button variant="outline" onClick={() => handleTechnicalSheetRequest(false)} disabled={isRequestingSheet}>
							Sin mis datos
						</Button>
						<Button onClick={() => handleTechnicalSheetRequest(true)} disabled={isRequestingSheet}>
							{isRequestingSheet ? 'Enviando...' : 'Con mis datos'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}

export function PropertyActions(props: PropertyActionsContainerProps) {
	const { session } = useSession();

	const isSharedComission = session?.searchType === 'end-user' && session?.searchSubtype === 'shared-comission';

	if (isSharedComission) return <SharedComissionActions {...props} />;
	if (session?.searchType === 'marketmeet') return <MarketmeetActions {...props} />;

	return <DefaultActions {...props} />;
}
