'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Map, useMap } from '@vis.gl/react-google-maps';
import { LocationSearchBar } from './LocationSearchBar';
import { DraggableMarker } from './DraggableMarker';
import { LocationCoordinates, LocationData, SetLocationProps } from './types';
import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { MdCheck, MdMyLocation, MdError } from 'react-icons/md';

function MapHandler({ place }: { place: google.maps.places.PlaceResult | null }) {
	const map = useMap();

	useEffect(() => {
		if (!map || !place) return;

		if (place.geometry?.viewport) {
			map.fitBounds(place.geometry.viewport);
		} else if (place.geometry?.location) {
			map.setCenter(place.geometry.location);
			map.setZoom(17);
		}
	}, [map, place]);

	return null;
}

interface OfferInfo {
	type_property?: string;
	type_operation?: string[];
	price?: number[];
	currency?: string;
	title?: string;
	bedroom?: number;
	bathroom?: number;
}

interface ConfirmResult {
	success: boolean;
	propertyId?: string;
	editLink?: string;
	publicLink?: string;
	error?: string;
}

export function SetLocationMap({ onLocationConfirmed, initialCoordinates, product = 'gga', token }: SetLocationProps) {
	const [selectedPlace, setSelectedPlace] = useState<google.maps.places.PlaceResult | null>(null);
	const [markerPosition, setMarkerPosition] = useState<LocationCoordinates>(initialCoordinates || { lat: 0, lng: 0 });
	const [showConfirmButton, setShowConfirmButton] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [showSuccessDialog, setShowSuccessDialog] = useState(false);
	const [showErrorDialog, setShowErrorDialog] = useState(false);
	const [errorMessage, setErrorMessage] = useState('');
	const [confirmedLocation, setConfirmedLocation] = useState<LocationData | null>(null);
	const [confirmResult, setConfirmResult] = useState<ConfirmResult | null>(null);
	const [offerInfo, setOfferInfo] = useState<OfferInfo | null>(null);
	const [loadingOffer, setLoadingOffer] = useState(true);
	const [noActiveOffer, setNoActiveOffer] = useState(false);

	// Cargar información de la oferta al inicio
	useEffect(() => {
		async function loadOfferInfo() {
			if (!token) {
				setLoadingOffer(false);
				setNoActiveOffer(true);
				return;
			}

			try {
				const response = await fetch(`/api/offers/info?token=${token}`);
				const data = await response.json();

				if (data.success && data.hasActiveOffer) {
					setOfferInfo(data.offer);
				} else {
					setNoActiveOffer(true);
				}
			} catch (error) {
				console.error('Error cargando oferta:', error);
				setNoActiveOffer(true);
			} finally {
				setLoadingOffer(false);
			}
		}

		loadOfferInfo();
	}, [token]);

	// Cuando se selecciona un lugar, actualizar el marcador
	useEffect(() => {
		if (selectedPlace?.geometry?.location) {
			const lat = selectedPlace.geometry.location.lat();
			const lng = selectedPlace.geometry.location.lng();
			setMarkerPosition({ lat, lng });
			setShowConfirmButton(true);
		}
	}, [selectedPlace]);

	const handleMarkerPositionChange = useCallback((position: LocationCoordinates) => {
		setMarkerPosition(position);
		setShowConfirmButton(true);
	}, []);

	const handleConfirm = async () => {
		if (markerPosition.lat === 0 && markerPosition.lng === 0) return;

		setIsLoading(true);

		try {
			// 1. Obtener información de geocodificación reversa
			const geocodeResponse = await fetch(
				`/api/places/geocode?lat=${markerPosition.lat}&lng=${markerPosition.lng}&product=${product}`
			);

			if (!geocodeResponse.ok) {
				throw new Error('Error en geocodificación');
			}

			const geocodeData = await geocodeResponse.json();

			const locationData: LocationData = {
				coordinates: markerPosition,
				formattedAddress: geocodeData.formatted_address || `${markerPosition.lat}, ${markerPosition.lng}`,
				addressComponents: {
					streetNumber: geocodeData.address_components?.find((c: { types: string[] }) =>
						c.types.includes('street_number')
					)?.long_name,
					streetName: geocodeData.address_components?.find((c: { types: string[] }) => c.types.includes('route'))
						?.long_name,
					sublocality: geocodeData.address_components?.find((c: { types: string[] }) => c.types.includes('sublocality'))
						?.long_name,
					city: geocodeData.address_components?.find((c: { types: string[] }) => c.types.includes('locality'))
						?.long_name,
					state: geocodeData.address_components?.find((c: { types: string[] }) =>
						c.types.includes('administrative_area_level_1')
					)?.long_name,
					country: geocodeData.address_components?.find((c: { types: string[] }) => c.types.includes('country'))
						?.long_name,
					postalCode: geocodeData.address_components?.find((c: { types: string[] }) => c.types.includes('postal_code'))
						?.long_name,
				},
			};

			setConfirmedLocation(locationData);

			// 2. Si hay token, confirmar la ubicación en el backend
			if (token) {
				const confirmResponse = await fetch('/api/offers/confirm-location', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						token,
						coordinates: markerPosition,
						addressComponents: locationData.addressComponents,
						formattedAddress: locationData.formattedAddress,
					}),
				});

				const confirmData = await confirmResponse.json();

				if (confirmData.success) {
					setConfirmResult(confirmData);
					setShowSuccessDialog(true);
				} else {
					setErrorMessage(confirmData.error || 'Error al guardar la ubicación');
					setShowErrorDialog(true);
				}
			} else {
				// Sin token, solo mostrar confirmación local
				setShowSuccessDialog(true);
			}

			if (onLocationConfirmed) {
				onLocationConfirmed(locationData);
			}
		} catch (error) {
			console.error('Error al confirmar ubicación:', error);
			setErrorMessage('Ocurrió un error al procesar la ubicación. Por favor, intenta de nuevo.');
			setShowErrorDialog(true);
		} finally {
			setIsLoading(false);
		}
	};

	const handleUseCurrentLocation = () => {
		if (!navigator.geolocation) {
			alert('Tu navegador no soporta geolocalización');
			return;
		}

		navigator.geolocation.getCurrentPosition(
			(position) => {
				const coords = {
					lat: position.coords.latitude,
					lng: position.coords.longitude,
				};
				setMarkerPosition(coords);
				setShowConfirmButton(true);

				// Crear un PlaceResult simulado para centrar el mapa
				const simulatedPlace: google.maps.places.PlaceResult = {
					geometry: {
						location: new google.maps.LatLng(coords.lat, coords.lng),
					},
				};
				setSelectedPlace(simulatedPlace);
			},
			(error) => {
				console.error('Error obteniendo ubicación:', error);
				alert('No se pudo obtener tu ubicación actual');
			},
			{ enableHighAccuracy: true }
		);
	};

	const handleGoToWhatsApp = () => {
		const whatsappNumber = process.env.NEXT_PUBLIC_BOT_NUMBER || '5213310154820';
		window.open(`https://wa.me/${whatsappNumber}`, '_blank');
	};

	const handleCompleteOffer = () => {
		if (confirmResult?.editLink) {
			window.open(confirmResult.editLink, '_blank');
		}
	};

	// Estado de carga inicial
	if (loadingOffer) {
		return (
			<div className="w-full h-full flex items-center justify-center bg-gray-100">
				<div className="text-center">
					<div className="h-12 w-12 border-4 border-[#8F7BBD] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
					<p className="text-gray-600">Cargando información de la oferta...</p>
				</div>
			</div>
		);
	}

	// Sin oferta activa
	if (noActiveOffer) {
		return (
			<div className="w-full h-full flex items-center justify-center bg-gray-100 p-4">
				<div className="bg-white rounded-2xl p-8 shadow-xl max-w-md text-center">
					<MdError className="size-16 text-amber-500 mx-auto mb-4" />
					<h2 className="text-xl font-bold text-gray-900 mb-2">No hay oferta activa</h2>
					<p className="text-gray-600 mb-6">
						No encontramos una oferta pendiente de ubicación asociada a este enlace. Es posible que ya haya sido
						procesada o el enlace sea inválido.
					</p>
					<Button onClick={handleGoToWhatsApp} className="bg-[#8F7BBD] hover:bg-[#7A6BB0]">
						Volver a WhatsApp
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className="relative w-full h-full">
			<Map
				defaultCenter={{ lat: 23.6345, lng: -102.5528 }}
				defaultZoom={5}
				gestureHandling="greedy"
				disableDefaultUI={true}
				mapId="set-location-map"
				className="w-full h-full"
			>
				<MapHandler place={selectedPlace} />
				<DraggableMarker
					position={markerPosition}
					onPositionChange={handleMarkerPositionChange}
					showInfoWindow={showConfirmButton}
				/>
			</Map>

			{/* Info de la oferta */}
			{offerInfo && (
				<div className="absolute top-20 left-4 z-20 bg-white/95 backdrop-blur-sm rounded-xl p-3 shadow-lg max-w-[250px]">
					<p className="text-xs text-gray-500 mb-1">Cargando ubicación para:</p>
					<p className="text-sm font-semibold text-gray-900">{offerInfo.title || offerInfo.type_property}</p>
					{offerInfo.type_operation && <p className="text-xs text-[#8F7BBD]">{offerInfo.type_operation.join(' / ')}</p>}
				</div>
			)}

			{/* Barra de búsqueda */}
			<LocationSearchBar onPlaceSelect={setSelectedPlace} product={product} />

			{/* Botón de ubicación actual */}
			<Button
				variant="outline"
				size="icon"
				className="absolute bottom-24 right-4 z-20 h-12 w-12 rounded-full bg-white shadow-lg hover:bg-gray-50"
				onClick={handleUseCurrentLocation}
				title="Usar mi ubicación actual"
			>
				<MdMyLocation className="size-6 text-[#8F7BBD]" />
			</Button>

			{/* Botón de confirmar */}
			{showConfirmButton && (
				<div className="absolute bottom-4 left-4 right-4 z-20 flex justify-center">
					<Button
						onClick={handleConfirm}
						disabled={isLoading}
						className="w-full max-w-md h-14 text-lg font-semibold bg-[#8F7BBD] hover:bg-[#7A6BB0] text-white rounded-2xl shadow-lg transition-all animate-pulse hover:animate-none"
					>
						{isLoading ? (
							<>
								<div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
								Procesando...
							</>
						) : (
							<>
								<MdCheck className="size-6 mr-2" />
								Confirmar ubicación
							</>
						)}
					</Button>
				</div>
			)}

			{/* Loading overlay */}
			{isLoading && (
				<div className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center">
					<div className="bg-white rounded-2xl p-6 shadow-xl flex flex-col items-center gap-4">
						<div className="h-12 w-12 border-4 border-[#8F7BBD] border-t-transparent rounded-full animate-spin" />
						<p className="text-gray-700 font-medium">Procesando ubicación...</p>
					</div>
				</div>
			)}

			{/* Dialog de éxito - No se puede cerrar */}
			<Dialog open={showSuccessDialog}>
				<DialogContent
					className="sm:max-w-md [&>button]:hidden"
					onInteractOutside={(e) => e.preventDefault()}
					onEscapeKeyDown={(e) => e.preventDefault()}
				>
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2 text-green-600">
							<MdCheck className="size-6" />
							¡Ofrecimiento cargado exitosamente!
						</DialogTitle>
						<DialogDescription className="text-left">
							La ubicación de la propiedad ha sido registrada. Si deseas aumentar la visibilidad de tu anuncio, puedes
							completar más información.
						</DialogDescription>
					</DialogHeader>

					{confirmedLocation && (
						<div className="bg-gray-50 rounded-xl p-4 space-y-2">
							<p className="text-sm font-medium text-gray-900">{confirmedLocation.formattedAddress}</p>
							<p className="text-xs text-gray-500">
								Coordenadas: {confirmedLocation.coordinates.lat.toFixed(6)},{' '}
								{confirmedLocation.coordinates.lng.toFixed(6)}
							</p>
						</div>
					)}

					<DialogFooter className="flex-col sm:flex-row gap-2">
						<Button variant="outline" onClick={handleGoToWhatsApp} className="flex-1">
							Volver a WhatsApp
						</Button>
						{confirmResult?.editLink && (
							<Button className="flex-1 bg-[#8F7BBD] hover:bg-[#7A6BB0]" onClick={handleCompleteOffer}>
								Completar Anuncio
							</Button>
						)}
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Dialog de error */}
			<Dialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2 text-red-600">
							<MdError className="size-6" />
							Error al procesar
						</DialogTitle>
						<DialogDescription className="text-left">{errorMessage}</DialogDescription>
					</DialogHeader>

					<DialogFooter>
						<Button variant="outline" onClick={() => setShowErrorDialog(false)} className="flex-1">
							Intentar de nuevo
						</Button>
						<Button onClick={handleGoToWhatsApp} className="flex-1 bg-green-600 hover:bg-green-700">
							Contactar soporte
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
