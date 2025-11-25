'use client';

import * as React from 'react';
import { MdBed, MdBathtub, MdSquareFoot, MdLocationOn, MdClose, MdPhotoCamera, MdWhatsapp } from 'react-icons/md';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { PropertyDetailModal } from './PropertyDetailModal';
import ContactAgentButton from '@/components/layout/ContactAgentButton';
import { useSession } from '@/contexts/SessionProvider';

export interface Property {
	id: string;
	title: string;
	address: string;
	price: string;
	currency: string;
	type: string;
	operation: string;
	bedrooms: number;
	bathrooms: number;
	area: number;
	images: string[];
	user_owner?: string;
	rating?: number;
	description?: string;
}

interface PropertyPreviewDialogProps {
	property: Property | null;
	isOpen: boolean;
	onClose: () => void;
	similarProperties?: Property[];
	onSimilarPropertyClick?: (propertyId: string) => void;
}

interface PropertyActionsProps {
	property: Property;
	onViewDetails: () => void;
}

/**
 * Componente separado para los botones de acción de la propiedad
 * Permite intercambiar fácilmente por otra botonera
 */
function PropertyActions({ property, onViewDetails }: PropertyActionsProps) {
	return (
		<div className="space-y-2">
			<ContactAgentButton
				propertyId={property.id}
				userOwnerId={property.user_owner}
				className="w-full h-10 md:h-11 text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
				style={{ backgroundColor: '#8F7BBD' }}
			>
				<MdWhatsapp className="size-4" />
				Solicitar Información
			</ContactAgentButton>
			<Button
				onClick={onViewDetails}
				variant="outline"
				className="w-full h-10 md:h-11 text-sm font-semibold rounded-lg border-2 hover:bg-gray-50 transition-colors"
				style={{ borderColor: '#8F7BBD', color: '#8F7BBD' }}
			>
				Ver detalles completos
			</Button>
		</div>
	);
}

export function PropertyPreviewDialog({
	property,
	isOpen,
	onClose,
	similarProperties = [],
	onSimilarPropertyClick,
}: PropertyPreviewDialogProps) {
	const [isDetailModalOpen, setIsDetailModalOpen] = React.useState(false);
	const { session } = useSession();

	// Registrar la propiedad como vista cuando se abre el diálogo
	React.useEffect(() => {
		if (isOpen && property && session.token && session.databaseToSearch) {
			fetch('/api/mongo/client/interacted-properties', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					propertyId: property.id,
					viewerId: session.token,
					dbName: session.databaseToSearch,
					status: 'viewed',
				}),
			}).catch((error) => {
				console.error('Error registrando interacción con propiedad:', error);
			});
		}
	}, [isOpen, property?.id, session.token, session.databaseToSearch]);

	if (!isOpen || !property) return null;

	const hasSimilarProperties = similarProperties && similarProperties.length > 0;
	const hasDescription = property.description && property.description.trim().length > 0;

	return (
		<div className="fixed top-4 z-30 w-full md:w-[40vw] lg:w-[32vw] max-w-[600px] animate-in slide-in-from-right duration-300 left-1/2 -translate-x-1/2 md:translate-x-0 md:right-4 md:left-auto px-4 md:px-0">
			<div className="flex flex-col gap-3 bg-white shadow-2xl rounded-2xl overflow-hidden">
				{/* Main Property Card */}
				<div className="flex flex-col">
					{/* Image Section - Proporción mejorada */}
					<div className="relative h-[280px] md:h-80 bg-gray-100 overflow-hidden">
						{/* Close Button - Posición absoluta sobre la imagen */}
						<Button
							size="icon"
							variant="ghost"
							className="absolute top-3 right-3 z-20 h-9 w-9 rounded-full bg-white/90 hover:bg-white backdrop-blur-sm shadow-md"
							onClick={onClose}
						>
							<MdClose className="size-5" />
						</Button>

						{property.images && property.images.length > 0 ? (
							<Carousel className="w-full h-full" opts={{ loop: true, align: 'start' }}>
								<CarouselContent className="h-full ml-0">
									{property.images.map((img, index) => (
										<CarouselItem key={index} className="basis-full h-full pl-0">
											<div className="w-full h-full">
												<img
													src={img}
													alt={`${property.title} - Imagen ${index + 1}`}
													className="w-full h-full object-cover"
												/>
											</div>
										</CarouselItem>
									))}
								</CarouselContent>

								<CarouselPrevious
									className="absolute left-3 top-1/2 -translate-y-1/2 z-10 h-9 w-9 rounded-full shadow-lg"
									style={{
										backgroundColor: '#8F7BBD',
										borderColor: '#8F7BBD',
										color: 'white',
									}}
								/>
								<CarouselNext
									className="absolute right-3 top-1/2 -translate-y-1/2 z-10 h-9 w-9 rounded-full shadow-lg"
									style={{
										backgroundColor: '#8F7BBD',
										borderColor: '#8F7BBD',
										color: 'white',
									}}
								/>

								{/* Contador de imágenes */}
								{property.images.length > 1 && (
									<div className="absolute bottom-3 right-3 bg-black/70 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-sm z-10 flex items-center gap-1.5">
										<MdPhotoCamera className="size-3.5" />
										<span className="font-medium">{property.images.length}</span>
									</div>
								)}
							</Carousel>
						) : (
							<div className="flex h-full items-center justify-center text-gray-400">
								<MdLocationOn className="size-20" />
							</div>
						)}
					</div>

					{/* Content Section */}
					<div className="p-4 md:p-5 space-y-4">
						{/* Header */}
						<div>
							<h2 className="text-lg md:text-xl font-bold leading-tight mb-2">{property.title}</h2>
							<p className="flex items-center gap-1.5 text-sm text-muted-foreground">
								<MdLocationOn className="size-4 shrink-0" />
								<span className="line-clamp-1">{property.address}</span>
							</p>
						</div>

						{/* Stats Grid */}
						<div className="flex items-center justify-between py-3 border-y w-full px-4">
							<div className="flex items-center gap-2">
								<div className="p-2 rounded-lg bg-gray-100">
									<MdBed className="size-5 text-gray-700" />
								</div>
								<div>
									<div className="text-base md:text-lg font-bold">{property.bedrooms}</div>
									<div className="text-xs text-muted-foreground">Recámaras</div>
								</div>
							</div>
							<div className="flex items-center gap-2">
								<div className="p-2 rounded-lg bg-gray-100">
									<MdBathtub className="size-5 text-gray-700" />
								</div>
								<div>
									<div className="text-base md:text-lg font-bold">{property.bathrooms}</div>
									<div className="text-xs text-muted-foreground">Baños</div>
								</div>
							</div>
							<div className="flex items-center gap-2">
								<div className="p-2 rounded-lg bg-gray-100">
									<MdSquareFoot className="size-5 text-gray-700" />
								</div>
								<div>
									<div className="text-base md:text-lg font-bold">{property.area}</div>
									<div className="text-xs text-muted-foreground">m²</div>
								</div>
							</div>
						</div>

						{/* Description */}
						{hasDescription && (
							<div>
								<h3 className="text-sm font-semibold mb-2">Descripción</h3>
								<p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">{property.description}</p>
							</div>
						)}

						{/* Price */}
						<div className="pt-2">
							<p className="text-xs text-muted-foreground mb-1">Precio</p>
							<div className="flex items-baseline gap-2">
								<span className="text-2xl md:text-3xl font-bold">
									{property.currency}
									{property.price}
								</span>
								<span className="text-sm text-muted-foreground">/{property.operation}</span>
							</div>
						</div>

						{/* Actions - Componente separado */}
						<PropertyActions property={property} onViewDetails={() => setIsDetailModalOpen(true)} />
					</div>
				</div>

				{/* Similar Properties Section */}
				{hasSimilarProperties && (
					<div className="border-t">
						<div className="p-4 md:p-5">
							<div className="flex items-center justify-between mb-4">
								<h3 className="text-base font-semibold">Propiedades similares</h3>
								<div className="flex items-center gap-1 text-xs text-muted-foreground md:hidden">
									<span>Desliza</span>
									<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
									</svg>
								</div>
							</div>

							<Carousel opts={{ align: 'start', loop: false }} className="w-full">
								<CarouselContent className="-ml-3">
									{similarProperties.map((similar) => (
										<CarouselItem key={similar.id} className="pl-3 basis-[280px] md:basis-[200px]">
											<div
												className="cursor-pointer hover:shadow-lg transition-all duration-200 border rounded-xl overflow-hidden bg-white h-full hover:scale-[1.02]"
												onClick={() => onSimilarPropertyClick?.(similar.id)}
											>
												{/* Property Image */}
												<div className="relative h-32 bg-gray-200">
													{similar.images && similar.images.length > 0 ? (
														<>
															<img src={similar.images[0]} alt={similar.title} className="h-full w-full object-cover" />
															{similar.images.length > 1 && (
																<div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm flex items-center gap-1">
																	<MdPhotoCamera className="size-3" />
																	<span className="font-medium">{similar.images.length}</span>
																</div>
															)}
														</>
													) : (
														<div className="flex h-full items-center justify-center text-gray-400">
															<MdLocationOn className="size-10" />
														</div>
													)}
													{similar.rating && (
														<Badge className="absolute top-2 left-2 bg-white/95 text-black hover:bg-white backdrop-blur-sm text-xs py-0.5 px-2">
															⭐ {similar.rating}
														</Badge>
													)}
												</div>

												{/* Property Info */}
												<div className="p-3">
													<div className="flex items-baseline gap-1 mb-1">
														<span className="text-base font-bold">
															{similar.currency}
															{similar.price}
														</span>
														<span className="text-xs text-muted-foreground">/{similar.operation}</span>
													</div>
													<h4 className="font-semibold text-sm mb-1 line-clamp-1">{similar.title}</h4>
													<p className="text-xs text-muted-foreground mb-2 line-clamp-1 flex items-center gap-1">
														<MdLocationOn className="size-3 shrink-0" />
														{similar.address}
													</p>
													<div className="flex items-center gap-3 text-xs">
														{similar.bedrooms > 0 && (
															<div className="flex items-center gap-1">
																<MdBed className="size-4 text-muted-foreground" />
																<span>{similar.bedrooms}</span>
															</div>
														)}
														{similar.bathrooms > 0 && (
															<div className="flex items-center gap-1">
																<MdBathtub className="size-4 text-muted-foreground" />
																<span>{similar.bathrooms}</span>
															</div>
														)}
														{similar.area > 0 && (
															<div className="flex items-center gap-1">
																<MdSquareFoot className="size-4 text-muted-foreground" />
																<span>{similar.area}m²</span>
															</div>
														)}
													</div>
												</div>
											</div>
										</CarouselItem>
									))}
								</CarouselContent>
							</Carousel>
						</div>
					</div>
				)}
			</div>

			{/* Modal de Detalle Completo */}
			<PropertyDetailModal property={property} isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} />
		</div>
	);
}
