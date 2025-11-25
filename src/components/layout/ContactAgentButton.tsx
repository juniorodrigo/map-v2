'use client';

import { useSession } from '@/contexts/SessionProvider';
import { Button } from '@/components/ui/button';
import { whatsappService } from '@/service/whatsapp/templates';
import { MdWhatsapp } from 'react-icons/md';

type ContactAgentButtonProps = {
	propertyId: string;
	userOwnerId?: string;
	onClick?: () => void;
	className?: string;
	style?: React.CSSProperties;
	children?: React.ReactNode;
};

export default function ContactAgentButton({
	propertyId,
	userOwnerId,
	onClick,
	className,
	style,
	children,
}: ContactAgentButtonProps) {
	const { session } = useSession();
	const ownerNumber = session.userInfo?.owner_phone_number;

	const handleClick = () => {
		if (!ownerNumber) return;
		whatsappService.openWhatsAppChat(ownerNumber, propertyId);
	};

	return (
		<Button
			onClick={handleClick}
			className={className ?? 'w-full h-11 text-sm font-semibold rounded-xl flex items-center justify-center gap-2'}
			style={style}
			disabled={!ownerNumber}
		>
			{children ?? (
				<>
					<MdWhatsapp className="size-4" />
					Solicitar Información
				</>
			)}
		</Button>
	);
}
