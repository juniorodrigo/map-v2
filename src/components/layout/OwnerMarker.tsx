'use client';
import { AdvancedMarker } from '@vis.gl/react-google-maps';

interface OwnerMarkerProps {
	position: { lat: number; lng: number };
	propertyCount: number;
	ownerId: string;
	ownerName?: string;
	isSelected?: boolean;
	onClick: () => void;
}

export default function OwnerMarker({
	position,
	propertyCount,
	ownerId,
	ownerName,
	isSelected = false,
	onClick,
}: OwnerMarkerProps) {
	return (
		<AdvancedMarker position={position} onClick={onClick}>
			<div
				className="flex items-center justify-center w-12 h-12 text-white rounded-full shadow-lg cursor-pointer hover:scale-110 transition-transform duration-200 border-2 border-white"
				style={{ backgroundColor: isSelected ? '#3b82f6' : '#8F7BBD' }}
			>
				<span className="text-sm font-bold">{propertyCount}</span>
			</div>
		</AdvancedMarker>
	);
}
