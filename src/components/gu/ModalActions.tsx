import { MdWhatsapp } from 'react-icons/md';
import ContactAgentButton from '../layout/ContactAgentButton';
import { Property } from '../layout/PropertyPreview';
import { Button } from '../ui/button';

interface ModalActionsProps {
	property: Property;
	onDiscard: () => void;
}

export function ModalActions({ property, onDiscard }: ModalActionsProps) {
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

			<ContactAgentButton
				propertyId={property.id}
				userOwnerId={property.user_owner}
				className="h-11 text-sm font-semibold rounded-lg transition-opacity flex items-center justify-center gap-2 bg-[#8F7BBD] hover:bg-purple-900"
			>
				<MdWhatsapp className="size-4" />
				Contactar
			</ContactAgentButton>

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
