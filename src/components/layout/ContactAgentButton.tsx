'use client';

import { useSession } from '@/contexts/SessionProvider';
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { firebaseClient } from '@/service/firebase/client';
import { getDoc } from 'firebase/firestore';
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
	const [ownerNumber, setOwnerNumber] = useState<string | null>(null);
	const { session } = useSession();

	const ownerPhone = session.userInfo?.owner_phone_number;

	useEffect(() => {
		let mounted = true;

		const fetchOwner = async () => {
			try {
				if (ownerPhone) {
					if (mounted) {
						console.log('✅ Owner phone from session:', ownerPhone);
						setOwnerNumber(ownerPhone);
					}
					return;
				}

				if (userOwnerId) {
					console.log('🔍 Fetching owner data from Firebase:', userOwnerId);
					const ref = firebaseClient.getUserRef(userOwnerId);
					const snap = await getDoc(ref);
					const data = snap.data() as { phone_number?: string } | undefined;
					if (mounted && data?.phone_number) {
						console.log('✅ Owner phone from Firebase:', data.phone_number);
						setOwnerNumber(data.phone_number);
					} else {
						console.warn('⚠️ No phone number found in Firebase data');
					}
				}
			} catch (error) {
				console.error('❌ Error fetching owner:', error);
			}
		};

		fetchOwner();

		return () => {
			mounted = false;
		};
	}, [userOwnerId, ownerPhone]);

	const handleClick = () => {
		console.log('🔵 ContactAgentButton clicked', { ownerNumber, propertyId });
		onClick?.();
		if (!ownerNumber) {
			console.warn('⚠️ No owner number available');
			return;
		}
		try {
			console.log('📞 Opening WhatsApp chat');
			whatsappService.openWhatsAppChat(ownerNumber, propertyId);
		} catch (error) {
			console.error('❌ Error opening WhatsApp:', error);
		}
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
