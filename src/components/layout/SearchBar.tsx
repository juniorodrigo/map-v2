'use client';

import React from 'react';
import { MdSearch, MdLocationOn } from 'react-icons/md';
import { Input } from '@/components/ui/input';
import { useMap } from './MapContext';
import { useDatabase } from '@/contexts/DatabaseContext';

interface PlacePrediction {
	place_id: string;
	description: string;
	structured_formatting: {
		main_text: string;
		secondary_text: string;
	};
}

interface PlaceDetails {
	result?: {
		geometry?: {
			location: {
				lat: number;
				lng: number;
			};
		};
		formatted_address?: string;
		name?: string;
	};
}

export default function SearchBar() {
	const { setSearchLocation } = useMap();
	const { database } = useDatabase();
	const [query, setQuery] = React.useState('');
	const [suggestions, setSuggestions] = React.useState<PlacePrediction[]>([]);
	const [isOpen, setIsOpen] = React.useState(false);
	const [selectedIndex, setSelectedIndex] = React.useState(-1);
	const [isLoading, setIsLoading] = React.useState(false);

	const inputRef = React.useRef<HTMLInputElement>(null);
	const containerRef = React.useRef<HTMLDivElement>(null);
	const debounceTimer = React.useRef<NodeJS.Timeout | null>(null);

	React.useEffect(() => {
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
				const product = database === 'gga' ? 'gga' : 'gu';
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
				setSuggestions([]);
			} finally {
				setIsLoading(false);
			}
		}, 300);
	};

	const handleSelectPlace = async (place: PlacePrediction) => {
		setQuery(place.structured_formatting.main_text);
		setIsOpen(false);
		setSuggestions([]);

		try {
			const product = database === 'gga' ? 'gga' : 'gu';
			const response = await fetch(`/api/places/details?placeId=${place.place_id}&product=${product}`);

			if (!response.ok) {
				throw new Error('Error fetching place details');
			}

			const data: PlaceDetails = await response.json();

			if (data.result?.geometry?.location) {
				const { lat, lng } = data.result.geometry.location;
				setSearchLocation({ lat, lng });

				if (typeof window !== 'undefined') {
					window.dispatchEvent(new CustomEvent('map:panTo', { detail: { lat, lng } }));
				}
			}
		} catch (error) {}
	};

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
			<div className="relative">
				<MdLocationOn className="absolute left-3.5 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
				<Input
					ref={inputRef}
					id="map-search"
					className={`h-12 bg-white/95 pl-11 pr-12 shadow-lg backdrop-blur-sm border-0 focus-visible:ring-0 focus-visible:ring-offset-0 transition-all ${
						isOpen && suggestions.length > 0 ? 'rounded-t-2xl rounded-b-none' : 'rounded-full'
					}`}
					placeholder="Buscar ubicación"
					value={query}
					onChange={(e) => handleInputChange(e.target.value)}
					onFocus={() => {
						if (suggestions.length > 0) setIsOpen(true);
					}}
					onKeyDown={handleKeyDown}
				/>
				<button
					type="button"
					className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full text-white hover:opacity-90 transition-opacity"
					style={{ backgroundColor: '#8F7BBD' }}
					onClick={() => {
						if (query.trim()) {
						}
					}}
					aria-label="Buscar"
				>
					<MdSearch className="size-5" />
				</button>
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
								className={`w-full px-4 py-3 flex items-start gap-3 hover:bg-gray-100 transition-colors text-left ${
									index === selectedIndex ? 'bg-gray-100' : ''
								} ${index === suggestions.length - 1 ? 'rounded-b-2xl' : ''}`}
							>
								<MdLocationOn className="size-5 text-muted-foreground mt-0.5 shrink-0" />
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
