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
	const sheetHeight = hasSimilarProperties ? 'h-[75vh]' : hasDescription ? 'h-[65vh]' : 'h-[55vh]';

	return (
		<div
			className={`fixed top-4 z-30 w-full md:w-[40vw] lg:w-[30vw] max-w-[600px] ${sheetHeight} animate-in slide-in-from-right duration-300 left-1/2 -translate-x-1/2 md:translate-x-0 md:right-4 md:left-auto px-4 md:px-0`}
		>
			<div className="h-full flex flex-col gap-3 md:gap-0 md:bg-white md:shadow-2xl md:rounded-2xl md:p-3 relative">
				{/* Top Section - Altura dinámica según propiedades similares - Card separada en móvil */}
				<div
					className={`${hasSimilarProperties ? 'flex-1 md:h-[60%]' : 'h-full'} flex flex-col md:flex-row gap-3 bg-white shadow-2xl rounded-2xl p-3`}
				>
					{/* Left Column - Image Carousel con Shadcn (bloque final recomendado) */}
					{/* Left Column - Image Carousel: fill parent's height and adapt images */}
					<div className="w-full md:w-1/2 relative rounded-xl overflow-hidden bg-gray-100 aspect-video md:h-full md:aspect-auto">
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
					<div className="w-full md:w-1/2 overflow-y-auto flex flex-col">
						{/* Header with Actions */}
						<div className="flex items-start justify-between mb-2">
							<div className="flex-1">
								{/* rating omitted in sheet UI by design */}
								<h2 className="text-base md:text-lg font-bold leading-tight mb-1">{property.title}</h2>
								<p className="flex items-center gap-1 text-[11px] md:text-xs text-muted-foreground">
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
						<div className="flex items-center gap-2 md:gap-3 pb-2 border-b">
							<div className="flex items-center gap-1 md:gap-1.5">
								<MdBed className="size-3.5 md:size-4 text-muted-foreground" />
								<div>
									<div className="text-sm md:text-base font-semibold">{property.bedrooms}</div>
									<div className="text-[9px] md:text-[10px] text-muted-foreground leading-none">Recámaras</div>
								</div>
							</div>
							<div className="flex items-center gap-1 md:gap-1.5">
								<MdBathtub className="size-3.5 md:size-4 text-muted-foreground" />
								<div>
									<div className="text-sm md:text-base font-semibold">{property.bathrooms}</div>
									<div className="text-[9px] md:text-[10px] text-muted-foreground leading-none">Baños</div>
								</div>
							</div>
							<div className="flex items-center gap-1 md:gap-1.5">
								<MdSquareFoot className="size-3.5 md:size-4 text-muted-foreground" />
								<div>
									<div className="text-sm md:text-base font-semibold">{property.area}</div>
									<div className="text-[9px] md:text-[10px] text-muted-foreground leading-none">m²</div>
								</div>
							</div>
						</div>
						{/* Description */}
						{property.description && (
							<div className="mt-2 mb-2 overflow-hidden">
								<h3 className="text-xs font-semibold mb-1">Descripción</h3>
								<p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">{property.description}</p>
							</div>
						)}
						{/* Price and CTA - Bottom of column */}
						<div className="mt-2 space-y-1.5 md:space-y-2">
							<div className="mb-1 md:mb-2">
								<p className="text-[10px] text-muted-foreground mb-0.5">Precio</p>
								<div className="flex items-baseline gap-1">
									<span className="text-xl md:text-2xl font-bold">
										{property.currency}
										{property.price}
									</span>
									<span className="text-xs md:text-sm text-muted-foreground">/{property.operation}</span>
								</div>
							</div>
							<ContactAgentButton
								propertyId={property.id}
								userOwnerId={property.user_owner}
								className="w-full h-9 md:h-10 text-xs md:text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
								style={{ backgroundColor: '#8F7BBD' }}
							>
								<MdWhatsapp className="size-3.5 md:size-4" />
								Contactar Agente
							</ContactAgentButton>
							<Button
								onClick={() => setIsDetailModalOpen(true)}
								variant="outline"
								className="w-full h-9 md:h-10 text-xs md:text-sm font-semibold rounded-lg border-2 hover:bg-gray-50 transition-colors"
								style={{ borderColor: '#8F7BBD', color: '#8F7BBD' }}
							>
								Ver detalles completos
							</Button>
						</div>
					</div>
				</div>

				{/* Bottom Section - Similar Properties Carousel - Card separada en móvil */}
				{hasSimilarProperties && (
					<div className="flex-1 md:h-[40%] flex flex-col bg-white shadow-2xl md:shadow-none rounded-2xl p-3 md:pt-3 md:border-t md:bg-transparent">
						<div className="flex items-center justify-between mb-2 px-1">
							<h3 className="text-sm font-semibold">Otras propiedades cerca</h3>
							<div className="flex items-center gap-1 text-xs text-muted-foreground md:hidden">
								<span>Desliza</span>
								<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
								</svg>
							</div>
						</div>
						{/* Horizontal Scrollable Carousel (swipeable) */}
						<div className="flex-1 relative">
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
						{/* Indicador de scroll horizontal para móvil */}
						<div className="md:hidden mt-2 flex justify-center gap-1">
							<div className="h-1 w-12 bg-gray-300 rounded-full"></div>
							<div className="h-1 w-2 bg-gray-400 rounded-full"></div>
							<div className="h-1 w-2 bg-gray-300 rounded-full"></div>
						</div>
					</div>
				)}
			</div>

			{/* Modal de Detalle Completo */}
			<PropertyDetailModal property={property} isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} />
		</div>
	);
}
