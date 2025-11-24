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
import type { Property } from './PropertyPreview';

interface PropertyDetailModalProps {
	property: Property;
	isOpen: boolean;
	onClose: () => void;
}

interface ModalActionsProps {
	property: Property;
}

/**
 * Componente separado para los botones de acción del modal
 * Permite intercambiar fácilmente por otra botonera
 */
function ModalActions({ property }: ModalActionsProps) {
	return (
		<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
			<Button
				variant="outline"
				className="h-11 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-colors"
				onClick={() => {
					/* TODO: Implementar ficha técnica */
				}}
			>
				Ficha técnica
			</Button>

			<ContactAgentButton
				propertyId={property.id}
				userOwnerId={property.user_owner}
				className="h-11 text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
				style={{ backgroundColor: '#8F7BBD' }}
			>
				<MdWhatsapp className="size-4" />
				Contactar Agente
			</ContactAgentButton>

			<Button
				variant="ghost"
				className="h-11 text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity"
				style={{ backgroundColor: '#c62323ff', color: 'white' }}
				onClick={() => {
					/* TODO: Implementar "No interesa" */
				}}
			>
				No interesa
			</Button>
		</div>
	);
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
			<DialogContent className="max-w-[95vw] w-full lg:max-w-[1200px] max-h-[95vh] p-0 overflow-hidden">
				<div className="flex flex-col max-h-[95vh]">
					{/* Header del Modal */}
					<DialogHeader className="px-5 md:px-6 pt-5 md:pt-6 pb-4 border-b shrink-0">
						<div className="space-y-2 pr-8">
							<DialogTitle className="text-xl md:text-2xl font-bold leading-tight">{property.title}</DialogTitle>
							<p className="flex items-center gap-2 text-sm md:text-base text-muted-foreground">
								<MdLocationOn className="size-4 md:size-5 shrink-0" />
								<span>{property.address}</span>
							</p>
						</div>
					</DialogHeader>

					{/* Contenido del Modal - Scrollable */}
					<div className="flex-1 overflow-y-auto">
						<div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr]">
							{/* Columna Izquierda - Imágenes (Más grande) */}
							<div className="p-5 md:p-6 lg:border-r">
								{property.images && property.images.length > 0 ? (
									<div className="space-y-4 group">
										{/* Carousel Principal - Más grande */}
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
														<div className="relative aspect-4/3 rounded-xl overflow-hidden bg-gray-100">
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
													<CarouselPrevious
														className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 md:h-12 md:w-12"
														style={{ backgroundColor: '#8F7BBD', borderColor: '#8F7BBD', color: 'white' }}
													/>
													<CarouselNext
														className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 md:h-12 md:w-12"
														style={{ backgroundColor: '#8F7BBD', borderColor: '#8F7BBD', color: 'white' }}
													/>
												</>
											)}
										</Carousel>

										{/* Galería de miniaturas - Carousel horizontal scrolleable */}
										{property.images.length > 1 && (
											<Carousel
												className="w-full"
												opts={{
													align: 'start',
													loop: false,
													dragFree: true,
												}}
											>
												<CarouselContent className="-ml-2">
													{property.images.map((img, index) => (
														<CarouselItem key={index} className="pl-2 basis-1/5 md:basis-1/6 lg:basis-1/5 xl:basis-1/6">
															<button
																onClick={() => {
																	// TODO: Navegar a esta imagen en el carousel principal
																}}
																className={`aspect-square rounded-lg overflow-hidden bg-gray-100 hover:opacity-75 transition-all hover:scale-105 w-full ${
																	index === currentImageIndex ? 'ring-2 ring-[#8F7BBD] ring-offset-2' : ''
																}`}
															>
																<img src={img} alt={`Miniatura ${index + 1}`} className="h-full w-full object-cover" />
															</button>
														</CarouselItem>
													))}
												</CarouselContent>
												<CarouselPrevious
													className="absolute -left-3 top-1/2 -translate-y-1/2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
													style={{ backgroundColor: '#8F7BBD', borderColor: '#8F7BBD', color: 'white' }}
												/>
												<CarouselNext
													className="absolute -right-3 top-1/2 -translate-y-1/2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
													style={{ backgroundColor: '#8F7BBD', borderColor: '#8F7BBD', color: 'white' }}
												/>
											</Carousel>
										)}
									</div>
								) : (
									<div className="aspect-4/3 rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center">
										<MdLocationOn className="size-20 text-gray-400" />
									</div>
								)}
							</div>

							{/* Columna Derecha - Información */}
							<div className="p-5 md:p-6 space-y-6">
								{/* Precio Grande */}
								<div className="bg-linear-to-br from-gray-50 to-gray-100 rounded-xl p-5">
									<p className="text-sm text-muted-foreground mb-2">Precio</p>
									<div className="flex items-baseline gap-2">
										<span className="text-3xl md:text-4xl font-bold">
											{property.currency}
											{property.price}
										</span>
										<span className="text-lg text-muted-foreground">/{property.operation}</span>
									</div>
									{property.rating && <Badge className="mt-3 text-sm py-1.5 px-3 bg-white">⭐ {property.rating}</Badge>}
								</div>

								{/* Botones de Acción - Componente separado */}
								<ModalActions property={property} />

								{/* Características Principales */}
								<div>
									<h3 className="text-base font-semibold mb-4">Características</h3>
									<div className="grid grid-cols-3 gap-3">
										<div className="flex flex-col items-center p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
											<div className="p-2 bg-white rounded-lg mb-2">
												<MdBed className="size-6 text-gray-700" />
											</div>
											<div className="text-xl font-bold">{property.bedrooms}</div>
											<div className="text-xs text-muted-foreground text-center mt-1">Recámaras</div>
										</div>
										<div className="flex flex-col items-center p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
											<div className="p-2 bg-white rounded-lg mb-2">
												<MdBathtub className="size-6 text-gray-700" />
											</div>
											<div className="text-xl font-bold">{property.bathrooms}</div>
											<div className="text-xs text-muted-foreground text-center mt-1">Baños</div>
										</div>
										<div className="flex flex-col items-center p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
											<div className="p-2 bg-white rounded-lg mb-2">
												<MdSquareFoot className="size-6 text-gray-700" />
											</div>
											<div className="text-xl font-bold">{property.area}</div>
											<div className="text-xs text-muted-foreground text-center mt-1">m²</div>
										</div>
									</div>
								</div>

								{/* Descripción Completa */}
								{property.description && (
									<div>
										<h3 className="text-base font-semibold mb-3">Descripción</h3>
										<p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
											{property.description}
										</p>
									</div>
								)}

								{/* Información Adicional */}
								<div className="space-y-0 border-t pt-4">
									<div className="flex justify-between py-3 border-b">
										<span className="text-sm text-muted-foreground">Tipo de propiedad</span>
										<span className="text-sm font-semibold capitalize">{property.type}</span>
									</div>
									<div className="flex justify-between py-3">
										<span className="text-sm text-muted-foreground">Operación</span>
										<span className="text-sm font-semibold capitalize">{property.operation}</span>
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
