'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { MdLocationOn, MdSearch } from 'react-icons/md';
import { Input } from '@/components/ui/input';
import { PlacePrediction } from './types';

interface LocationSearchBarProps {
	onPlaceSelect: (place: google.maps.places.PlaceResult | null) => void;
	product?: 'gga' | 'gu';
}

export function LocationSearchBar({ onPlaceSelect, product = 'gga' }: LocationSearchBarProps) {
	const [query, setQuery] = useState('');
	const [suggestions, setSuggestions] = useState<PlacePrediction[]>([]);
	const [isOpen, setIsOpen] = useState(false);
	const [selectedIndex, setSelectedIndex] = useState(-1);
	const [isLoading, setIsLoading] = useState(false);
	const [showHint, setShowHint] = useState(true);

	const inputRef = useRef<HTMLInputElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	const debounceTimer = useRef<NodeJS.Timeout | null>(null);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
				setIsOpen(false);
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	const handleInputChange = async (value: string) => {
		setQuery(value);
		setShowHint(false);

		if (!value.trim()) {
			setSuggestions([]);
			setIsOpen(false);
			return;
		}

		if (debounceTimer.current) {
			clearTimeout(debounceTimer.current);
		}

		debounceTimer.current = setTimeout(async () => {
			setIsLoading(true);
			try {
				const response = await fetch(`/api/places/autocomplete?input=${encodeURIComponent(value)}&product=${product}`);

				if (!response.ok) {
					throw new Error('Error fetching predictions');
				}

				const data = await response.json();

				if (data.predictions) {
					setSuggestions(data.predictions);
					setIsOpen(true);
					setSelectedIndex(-1);
				}
			} catch (error) {
				console.error('Error en autocomplete:', error);
				setSuggestions([]);
			} finally {
				setIsLoading(false);
			}
		}, 300);
	};

	const handleSelectPlace = useCallback(
		async (place: PlacePrediction) => {
			setQuery(place.structured_formatting.main_text);
			setIsOpen(false);
			setSuggestions([]);

			try {
				const response = await fetch(`/api/places/details?placeId=${place.place_id}&product=${product}`);

				if (!response.ok) {
					throw new Error('Error fetching place details');
				}

				const data = await response.json();

				if (data.result?.geometry?.location) {
					const { lat, lng } = data.result.geometry.location;

					// Crear un PlaceResult compatible con Google Maps
					const placeResult: google.maps.places.PlaceResult = {
						name: place.structured_formatting.main_text,
						formatted_address: place.description,
						geometry: {
							location: new google.maps.LatLng(lat, lng),
							viewport: data.result.geometry.viewport
								? new google.maps.LatLngBounds(
										new google.maps.LatLng(
											data.result.geometry.viewport.southwest.lat,
											data.result.geometry.viewport.southwest.lng
										),
										new google.maps.LatLng(
											data.result.geometry.viewport.northeast.lat,
											data.result.geometry.viewport.northeast.lng
										)
									)
								: undefined,
						},
						place_id: place.place_id,
					};

					onPlaceSelect(placeResult);
				}
			} catch (error) {
				console.error('Error obteniendo detalles del lugar:', error);
			}
		},
		[onPlaceSelect, product]
	);

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (!isOpen || suggestions.length === 0) return;

		if (e.key === 'ArrowDown') {
			e.preventDefault();
			setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
		} else if (e.key === 'Enter' && selectedIndex >= 0) {
			e.preventDefault();
			handleSelectPlace(suggestions[selectedIndex]);
		} else if (e.key === 'Escape') {
			setIsOpen(false);
		}
	};

	return (
		<div ref={containerRef} className="absolute top-4 left-4 right-4 lg:right-auto z-30 lg:w-[400px]">
			{/* Hint animado */}
			{showHint && (
				<div className="absolute -top-12 left-0 right-0 flex flex-col items-center animate-bounce">
					<div className="bg-[#8F7BBD] text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium">
						↓ Introduce la ubicación aquí
					</div>
				</div>
			)}

			<div className="relative">
				<MdLocationOn className="absolute left-3.5 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
				<Input
					ref={inputRef}
					className={`h-12 bg-white/95 pl-11 pr-12 shadow-lg backdrop-blur-sm border-0 focus-visible:ring-2 focus-visible:ring-[#8F7BBD] transition-all ${
						isOpen && suggestions.length > 0 ? 'rounded-t-2xl rounded-b-none' : 'rounded-full'
					} ${showHint ? 'ring-2 ring-[#8F7BBD] ring-offset-2' : ''}`}
					placeholder="Buscar dirección de la propiedad..."
					value={query}
					onChange={(e) => handleInputChange(e.target.value)}
					onFocus={() => {
						setShowHint(false);
						if (suggestions.length > 0) setIsOpen(true);
					}}
					onKeyDown={handleKeyDown}
				/>
				<div className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-[#8F7BBD] text-white">
					{isLoading ? (
						<div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
					) : (
						<MdSearch className="size-5" />
					)}
				</div>
			</div>

			{/* Suggestions Dropdown */}
			{isOpen && suggestions.length > 0 && (
				<div className="bg-white/95 backdrop-blur-sm shadow-lg rounded-b-2xl overflow-hidden border-t">
					<div className="max-h-[300px] overflow-y-auto">
						{suggestions.map((place, index) => (
							<button
								key={place.place_id}
								onClick={() => handleSelectPlace(place)}
								onMouseEnter={() => setSelectedIndex(index)}
								className={`w-full px-4 py-3 flex items-start gap-3 hover:bg-[#8F7BBD]/10 transition-colors text-left ${
									index === selectedIndex ? 'bg-[#8F7BBD]/10' : ''
								} ${index === suggestions.length - 1 ? 'rounded-b-2xl' : ''}`}
							>
								<MdLocationOn className="size-5 text-[#8F7BBD] mt-0.5 shrink-0" />
								<div className="flex-1 min-w-0">
									<div className="text-sm font-medium text-gray-900 truncate">
										{place.structured_formatting.main_text}
									</div>
									<div className="text-xs text-muted-foreground truncate">
										{place.structured_formatting.secondary_text}
									</div>
								</div>
							</button>
						))}
					</div>
				</div>
			)}
		</div>
	);
}
