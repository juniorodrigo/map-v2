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
import ContactAgentButton from '@/components/layout/ContactAgentButton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { Property } from './PropertyPreview';
import { useSession } from '@/contexts/SessionProvider';

interface PropertyDetailModalProps {
	property: Property;
	isOpen: boolean;
	onClose: () => void;
}

interface ModalActionsProps {
	property: Property;
}

function ModalActions({ property }: ModalActionsProps) {
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
				className="h-11 text-sm font-semibold rounded-lg transition-opacity flex items-center justify-center gap-2 bg-[#8F7BBD]"
			>
				<MdWhatsapp className="size-4" />
				Contactar
			</ContactAgentButton>

			<Button
				variant="ghost"
				className="h-11 text-sm font-semibold rounded-lg transition-opacity bg-red-700 text-white hover:bg-red-800 hover:text-white"
				disabled
				onClick={() => {}}
			>
				No me interesa
			</Button>
		</div>
	);
}

export function PropertyDetailModal({ property, isOpen, onClose }: PropertyDetailModalProps) {
	const [currentImageIndex, setCurrentImageIndex] = React.useState(0);
	const { session } = useSession();

	const isMarketmeet = session.searchType == 'marketmeet';

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
					<div className="flex-1 overflow-y-auto scrollbar-hide">
						<div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr]">
							{/* Columna Izquierda - Imágenes (Más grande) */}
							<div className="p-5 md:px-4 py-3 lg:border-r">
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
							<div className="p-5 md:p-6 space-y-4">
								{/* Precio Compacto */}
								<div className="flex items-baseline justify-between">
									<div>
										<p className="text-xs text-muted-foreground mb-1">Precio</p>
										<div className="flex items-baseline gap-2">
											<span className="text-2xl md:text-3xl font-bold">
												{property.currency}
												{property.price}
											</span>
											<span className="text-sm text-muted-foreground">/{property.operation}</span>
										</div>
									</div>
									{property.rating && <Badge className="text-sm py-1.5 px-3">⭐ {property.rating}</Badge>}
								</div>

								{/* Información del Agente y Comisión */}
								{isMarketmeet && (
									<div className="flex items-center justify-between py-3 bg-gray-50 rounded-lg">
										<div className="flex items-center gap-2">
											<span className="text-sm font-medium text-gray-700">De:</span>
											<span className="text-sm font-semibold text-gray-900">Test Marketmeet</span>
											<a
												href="https://wa.me/51999999999?text=Hola%20Carlos%2C%20estoy%20interesado%20en%20la%20propiedad"
												target="_blank"
												rel="noopener noreferrer"
												className="inline-flex items-center justify-center p-1 rounded-full bg-green-500 hover:bg-green-600 transition-colors"
												title="Contactar por WhatsApp"
											>
												<MdWhatsapp className="size-3.5 text-white" />
											</a>
										</div>
										<div className="flex items-center gap-2">
											<span className="text-sm font-medium text-gray-700">Comisión compartida:</span>
											<span className="text-sm font-semibold text-gray-900">50%/venta</span>
										</div>
									</div>
								)}

								{/* Características en línea - Diseño horizontal compacto */}
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
								<div className="space-y-0 border-t py-4 border-b ">
									<div className="flex justify-between py-1">
										<span className="text-sm text-muted-foreground">Tipo de propiedad</span>
										<span className="text-sm font-semibold capitalize">{property.type}</span>
									</div>
									<div className="flex justify-between py-1">
										<span className="text-sm text-muted-foreground">Operación</span>
										<span className="text-sm font-semibold capitalize">{property.operation}</span>
									</div>
								</div>

								{/* Botones de Acción - Componente separado */}
								<ModalActions property={property} />
							</div>
						</div>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
