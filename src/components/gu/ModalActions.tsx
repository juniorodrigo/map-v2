import { MdWhatsapp } from 'react-icons/md';
import { Property } from '../layout/PropertyPreview';
import { Button } from '../ui/button';
import { openWhatsAppChat } from '@/service/whatsapp/templates';

interface ModalActionsProps {
	property: Property;
	onDiscard: () => void;
}

export function ModalActions({ property, onDiscard }: ModalActionsProps) {
	const handleContactClick = () => {
		if (property.owner_phone_number) {
			openWhatsAppChat(property.owner_phone_number, property.id);
		}
	};

	return (
		<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
			<Button
				variant="outline"
				className="h-11 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-colors"
				disabled
				onClick={() => {}}
			>
				Agendar Cita
			</Button>

			<Button
				onClick={handleContactClick}
				disabled={!property.owner_phone_number}
				className="h-11 text-sm font-semibold rounded-lg transition-opacity flex items-center justify-center gap-2 bg-[#8F7BBD] hover:bg-purple-900"
			>
				<MdWhatsapp className="size-4" />
				Contactar
			</Button>

			<Button
				variant="ghost"
				className="h-11 text-sm font-semibold rounded-lg transition-opacity bg-[#C93232] text-white hover:bg-red-800 hover:text-white"
				onClick={onDiscard}
			>
				No me interesa
			</Button>
		</div>
	);
}
