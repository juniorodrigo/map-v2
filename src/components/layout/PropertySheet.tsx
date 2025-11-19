'use client';

import * as React from 'react';
import { MdBed, MdBathtub, MdSquareFoot, MdLocationOn, MdClose, MdPhotoCamera, MdWhatsapp } from 'react-icons/md';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { PropertyDetailModal } from './PropertyDetailModal';
import ContactAgentButton from '@/components/ui/ContactAgentButton';
// usamos etiquetas <img> nativas en lugar de next/image

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

interface PropertySheetProps {
	property: Property | null;
	isOpen: boolean;
	onClose: () => void;
	similarProperties?: Property[];
	onSimilarPropertyClick?: (propertyId: string) => void;
}

export function PropertySheet({
	property,
	isOpen,
	onClose,
	similarProperties = [],
	onSimilarPropertyClick,
}: PropertySheetProps) {
	const [isDetailModalOpen, setIsDetailModalOpen] = React.useState(false);

	if (!isOpen || !property) return null;

	// Determinar si hay propiedades similares para mostrar
	const hasSimilarProperties = similarProperties && similarProperties.length > 0;

	// Calcular altura dinámica del sheet - reducido para evitar espacios
	const hasDescription = property.description && property.description.trim().length > 0;
	const sheetHeight = hasSimilarProperties ? 'h-[68vh]' : hasDescription ? 'h-[60vh]' : 'h-[50vh]';

	return (
		<div className={`fixed right-4 top-4 z-30 w-[30vw] ${sheetHeight} animate-in slide-in-from-right duration-300`}>
			<div className="h-full bg-white shadow-2xl rounded-2xl p-3 flex flex-col gap-3 relative">
				{/* Top Section - Altura dinámica según propiedades similares */}
				<div className={hasSimilarProperties ? 'h-[60%]' : 'h-full'} style={{ display: 'flex', gap: '0.75rem' }}>
					{/* Left Column - Image Carousel con Shadcn (bloque final recomendado) */}
					{/* Left Column - Image Carousel: fill parent's height and adapt images */}
					<div className="w-1/2 relative rounded-xl overflow-hidden bg-gray-100 h-full">
						{property.images && property.images.length > 0 ? (
							<Carousel className="w-full h-full" opts={{ loop: true, align: 'start' }}>
								<CarouselContent className="h-full ml-0">
									{property.images.map((img, index) => (
										<CarouselItem key={index} className="basis-full h-full pl-0 flex items-center justify-center">
											<div className="w-full h-full">
												<img
													src={img}
													alt={`${property.title} - Imagen ${index + 1}`}
													className="w-full h-full object-cover"
													style={{ objectPosition: 'center' }}
												/>
											</div>
										</CarouselItem>
									))}
								</CarouselContent>

								<CarouselPrevious
									className="absolute left-2 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full"
									style={{
										backgroundColor: '#8F7BBD',
										borderColor: '#8F7BBD',
										color: 'white',
									}}
								/>
								<CarouselNext
									className="absolute right-2 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full"
									style={{
										backgroundColor: '#8F7BBD',
										borderColor: '#8F7BBD',
										color: 'white',
									}}
								/>
							</Carousel>
						) : (
							<div className="flex h-full items-center justify-center text-gray-400 bg-gray-100">
								<MdLocationOn className="size-16" />
							</div>
						)}
					</div>

					{/* Right Column - Property Info (Compact) */}
					<div className="w-1/2 overflow-y-auto flex flex-col">
						{/* Header with Actions */}
						<div className="flex items-start justify-between mb-2">
							<div className="flex-1">
								{/* rating omitted in sheet UI by design */}
								<h2 className="text-lg font-bold leading-tight mb-1">{property.title}</h2>
								<p className="flex items-center gap-1 text-xs text-muted-foreground">
									<MdLocationOn className="size-3.5" />
									{property.address}
								</p>
							</div>
							<div className="flex gap-1 ml-2 shrink-0">
								<Button
									size="icon"
									variant="ghost"
									className="h-8 w-8 rounded-full hover:bg-gray-100"
									onClick={onClose}
								>
									<MdClose className="size-4" />
								</Button>
							</div>
						</div>

						{/* Property Stats */}
						<div className="flex items-center gap-3 mb-2 pb-2 border-b">
							<div className="flex items-center gap-1.5">
								<MdBed className="size-4 text-muted-foreground" />
								<div>
									<div className="text-base font-semibold">{property.bedrooms}</div>
									<div className="text-[10px] text-muted-foreground leading-none">Recámaras</div>
								</div>
							</div>
							<div className="flex items-center gap-1.5">
								<MdBathtub className="size-4 text-muted-foreground" />
								<div>
									<div className="text-base font-semibold">{property.bathrooms}</div>
									<div className="text-[10px] text-muted-foreground leading-none">Baños</div>
								</div>
							</div>
							<div className="flex items-center gap-1.5">
								<MdSquareFoot className="size-4 text-muted-foreground" />
								<div>
									<div className="text-base font-semibold">{property.area}</div>
									<div className="text-[10px] text-muted-foreground leading-none">m²</div>
								</div>
							</div>
						</div>

						{/* Description */}
						{property.description && (
							<div className="mb-2 flex-1 overflow-hidden">
								<h3 className="text-xs font-semibold mb-1">Descripción</h3>
								<p className="text-xs text-muted-foreground leading-relaxed line-clamp-4">{property.description}</p>
							</div>
						)}

						{/* Price and CTA - Bottom of column */}
						<div className="mt-auto space-y-2">
							<div className="mb-2">
								<p className="text-[10px] text-muted-foreground mb-0.5">Precio</p>
								<div className="flex items-baseline gap-1">
									<span className="text-2xl font-bold">
										{property.currency}
										{property.price}
									</span>
									<span className="text-sm text-muted-foreground">/{property.operation}</span>
								</div>
							</div>
							<ContactAgentButton
								propertyId={property.id}
								userOwnerId={property.user_owner}
								className="w-full h-10 text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
								style={{ backgroundColor: '#8F7BBD' }}
							>
								<MdWhatsapp className="size-4" />
								Contactar Agente
							</ContactAgentButton>
							<Button
								onClick={() => setIsDetailModalOpen(true)}
								variant="outline"
								className="w-full h-10 text-sm font-semibold rounded-lg border-2 hover:bg-gray-50 transition-colors"
								style={{ borderColor: '#8F7BBD', color: '#8F7BBD' }}
							>
								Ver detalles completos
							</Button>
						</div>
					</div>
				</div>

				{/* Bottom Section - 40% Height - Similar Properties Carousel - Solo si hay propiedades */}
				{hasSimilarProperties && (
					<div className="h-[40%] flex flex-col pt-3 border-t">
						<h3 className="text-sm font-semibold mb-2 px-1">Otras propiedades cerca</h3>
						{/* Horizontal Scrollable Carousel (swipeable) */}
						<div className="flex-1">
							<Carousel opts={{ align: 'start', loop: false }} className="w-full">
								<CarouselContent className="-ml-3">
									{similarProperties.map((similar) => (
										<CarouselItem key={similar.id} className="pl-3 md:basis-[180px]">
											<div
												className="cursor-pointer hover:shadow-lg transition-shadow border rounded-xl overflow-hidden bg-white"
												onClick={() => onSimilarPropertyClick?.(similar.id)}
											>
												{/* Property Image - Primera imagen solo */}
												<div className="relative h-[120px] bg-gray-200">
													{similar.images && similar.images.length > 0 ? (
														<>
															<img src={similar.images[0]} alt={similar.title} className="h-full w-full object-cover" />
															{/* Badge de cantidad de fotos */}
															{similar.images.length > 1 && (
																<div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm z-10 flex items-center gap-1">
																	<MdPhotoCamera className="size-3" />
																	<span>{similar.images.length}</span>
																</div>
															)}
														</>
													) : (
														<div className="flex h-full items-center justify-center text-gray-400">
															<MdLocationOn className="size-8" />
														</div>
													)}
													{/* Rating Badge */}
													{similar.rating && (
														<Badge className="absolute top-2 left-2 bg-white/95 text-black hover:bg-white backdrop-blur-sm text-xs py-0.5 px-2 z-20">
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
														<span className="text-[10px] text-muted-foreground">/{similar.operation}</span>
													</div>
													<h4 className="font-semibold text-xs mb-0.5 line-clamp-1">{similar.title}</h4>
													<p className="text-[10px] text-muted-foreground mb-2 line-clamp-1">{similar.address}</p>
													<div className="flex items-center gap-2 text-xs">
														{similar.bedrooms > 0 && (
															<div className="flex items-center gap-0.5">
																<MdBed className="size-3.5 text-muted-foreground" />
																<span>{similar.bedrooms}</span>
															</div>
														)}
														{similar.bathrooms > 0 && (
															<div className="flex items-center gap-0.5">
																<MdBathtub className="size-3.5 text-muted-foreground" />
																<span>{similar.bathrooms}</span>
															</div>
														)}
														{similar.area > 0 && (
															<div className="flex items-center gap-0.5">
																<MdSquareFoot className="size-3.5 text-muted-foreground" />
																<span>{similar.area}m²</span>
															</div>
														)}
													</div>
												</div>
											</div>
										</CarouselItem>
									))}
								</CarouselContent>
								{/* arrows removed: swipe-only carousel for similar properties */}
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
