'use client';

import * as React from 'react';
import { MdBed, MdBathtub, MdSquareFoot, MdLocationOn, MdWhatsapp } from 'react-icons/md';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
	Carousel,
	CarouselContent,
	CarouselItem,
	CarouselNext,
	CarouselPrevious,
	type CarouselApi,
} from '@/components/ui/carousel';
import ContactAgentButton from '@/components/ui/ContactAgentButton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { Property } from './PropertySheet';

interface PropertyDetailModalProps {
	property: Property;
	isOpen: boolean;
	onClose: () => void;
}

export function PropertyDetailModal({ property, isOpen, onClose }: PropertyDetailModalProps) {
	const [currentImageIndex, setCurrentImageIndex] = React.useState(0);

	React.useEffect(() => {
		if (isOpen) {
			setCurrentImageIndex(0);
		}
	}, [property.id, isOpen]);

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="max-w-[95vw]! w-[1400px]! max-h-[95vh]! p-0 overflow-hidden">
				<div className="h-full flex flex-col max-h-[95vh]">
					{/* Header del Modal - Compacto */}
					<DialogHeader className="px-6 pt-6 pb-3 border-b shrink-0">
						<div className="space-y-2 pr-8">
							<DialogTitle className="text-2xl font-bold">{property.title}</DialogTitle>
							<p className="flex items-center gap-1.5 text-sm text-muted-foreground">
								<MdLocationOn className="size-4" />
								{property.address}
							</p>
						</div>
					</DialogHeader>

					{/* Contenido del Modal - Scrollable */}
					<div className="flex-1 overflow-y-auto">
						<div className="p-6">
							<div className="grid grid-cols-[1.2fr_0.8fr] gap-8">
								{/* Columna Izquierda - Imágenes */}
								<div className="space-y-4">
									{/* Carousel Principal */}
									{property.images && property.images.length > 0 ? (
										<div className="space-y-3">
											<Carousel
												className="w-full"
												opts={{
													loop: true,
													align: 'start',
												}}
												setApi={(api: CarouselApi) => {
													api?.on('select', () => {
														setCurrentImageIndex(api.selectedScrollSnap());
													});
												}}
											>
												<CarouselContent>
													{property.images.map((img, index) => (
														<CarouselItem key={index}>
															<div className="relative aspect-16/10 rounded-xl overflow-hidden bg-gray-100">
																<img
																	src={img}
																	alt={`${property.title} - Imagen ${index + 1}`}
																	className="h-full w-full object-cover"
																/>
																{/* Contador de imágenes */}
																<div className="absolute bottom-4 right-4 bg-black/70 text-white text-sm px-3 py-1.5 rounded-full backdrop-blur-sm font-medium">
																	{currentImageIndex + 1} / {property.images.length}
																</div>
															</div>
														</CarouselItem>
													))}
												</CarouselContent>
												{property.images.length > 1 && (
													<>
														<div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
															<CarouselPrevious
																className="relative left-0 top-0 translate-y-0 h-10 w-10"
																style={{ backgroundColor: '#8F7BBD', borderColor: '#8F7BBD', color: 'white' }}
															/>
														</div>
														<div className="absolute right-4 top-1/2 -translate-y-1/2 z-10">
															<CarouselNext
																className="relative right-0 top-0 translate-y-0 h-10 w-10"
																style={{ backgroundColor: '#8F7BBD', borderColor: '#8F7BBD', color: 'white' }}
															/>
														</div>
													</>
												)}
											</Carousel>

											{/* Galería de miniaturas */}
											{property.images.length > 1 && (
												<div className="grid grid-cols-6 gap-2">
													{property.images.slice(0, 12).map((img, index) => (
														<button
															key={index}
															onClick={() => {
																// TODO: Navegar a esta imagen en el carousel
															}}
															className={`aspect-square rounded-lg overflow-hidden bg-gray-100 hover:opacity-75 transition-opacity ${
																index === currentImageIndex ? 'ring-2 ring-[#8F7BBD]' : ''
															}`}
														>
															<img src={img} alt={`Miniatura ${index + 1}`} className="h-full w-full object-cover" />
														</button>
													))}
												</div>
											)}
										</div>
									) : (
										<div className="aspect-16/10 rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center">
											<MdLocationOn className="size-16 text-gray-400" />
										</div>
									)}
								</div>

								{/* Columna Derecha - Información */}
								<div className="space-y-5">
									{/* Precio Grande */}
									<div className="bg-gray-50 rounded-xl p-5">
										<p className="text-sm text-muted-foreground mb-2">Precio</p>
										<div className="flex items-baseline gap-2 mb-1">
											<span className="text-4xl font-bold">
												{property.currency}
												{property.price}
											</span>
											<span className="text-xl text-muted-foreground">/{property.operation}</span>
										</div>
										{property.rating && <Badge className="mt-3 text-sm py-1 px-3">⭐ {property.rating}</Badge>}
									</div>

									{/* Botones de Acción */}
									<div>
										<div className="grid grid-cols-3 gap-2">
											<Button
												variant="outline"
												className="h-11 text-sm font-semibold rounded-lg"
												onClick={() => {
													/* noop: ficha técnica - implementar si es necesario */
												}}
											>
												Ficha técnica
											</Button>

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
												variant="ghost"
												className="h-11 text-sm font-semibold rounded-lg"
												style={{ backgroundColor: '#c62323ff', color: 'white' }}
												onClick={() => {
													/* noop: marcar como no interesa */
												}}
											>
												No interesa
											</Button>
										</div>
									</div>

									{/* Características Principales */}
									<div>
										<h3 className="text-base font-semibold mb-3">Características</h3>
										<div className="grid grid-cols-3 gap-3">
											<div className="flex flex-col items-center p-3 bg-gray-50 rounded-xl">
												<MdBed className="size-6 text-muted-foreground mb-1.5" />
												<div className="text-xl font-bold">{property.bedrooms}</div>
												<div className="text-xs text-muted-foreground text-center mt-1">Recámaras</div>
											</div>
											<div className="flex flex-col items-center p-3 bg-gray-50 rounded-xl">
												<MdBathtub className="size-6 text-muted-foreground mb-1.5" />
												<div className="text-xl font-bold">{property.bathrooms}</div>
												<div className="text-xs text-muted-foreground text-center mt-1">Baños</div>
											</div>
											<div className="flex flex-col items-center p-3 bg-gray-50 rounded-xl">
												<MdSquareFoot className="size-6 text-muted-foreground mb-1.5" />
												<div className="text-xl font-bold">{property.area}</div>
												<div className="text-xs text-muted-foreground text-center mt-1">m²</div>
											</div>
										</div>
									</div>

									{/* Descripción Completa */}
									{property.description && (
										<div>
											<h3 className="text-base font-semibold mb-2">Descripción</h3>
											<p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
												{property.description}
											</p>
										</div>
									)}

									{/* Información Adicional */}
									<div className="space-y-2">
										<div className="flex justify-between py-2 border-b">
											<span className="text-sm text-muted-foreground">Tipo de propiedad</span>
											<span className="text-sm font-medium capitalize">{property.type}</span>
										</div>
										<div className="flex justify-between py-2 border-b">
											<span className="text-sm text-muted-foreground">Operación</span>
											<span className="text-sm font-medium capitalize">{property.operation}</span>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
