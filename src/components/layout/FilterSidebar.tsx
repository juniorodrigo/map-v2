'use client';

import * as React from 'react';
import { MdClose, MdFilterList } from 'react-icons/md';
import { BsHouseDoor, BsBuilding } from 'react-icons/bs';
import { MdAttachMoney } from 'react-icons/md';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { MultiSelect } from '@/components/ui/multi-select';
import { PROPERTY_TYPE_MAPPINGS, OPERATION_TYPE_MAPPINGS } from '@/lib/property-type-mappings';

// Generar opciones dinámicamente desde los mapeos centralizados
const propertyTypes = Object.entries(PROPERTY_TYPE_MAPPINGS).map(([value, label]) => ({
	value,
	label,
}));

const operationTypes = Object.entries(OPERATION_TYPE_MAPPINGS).map(([value, label]) => ({
	value,
	label,
}));

interface FilterSidebarProps {
	propertyType?: string[];
	priceRange?: [number, number];
	currency?: string;
	operationType?: string[];
	onFiltersChange?: (filters: {
		propertyType: string[];
		priceRange: [number, number];
		currency: string;
		operationType: string[];
	}) => void;
}

export function FilterSidebar({
	propertyType: propertyTypeProp = [],
	priceRange: priceRangeProp = [5000, 10000000],
	currency: currencyProp = 'MXN',
	operationType: operationTypeProp = [],
	onFiltersChange,
}: FilterSidebarProps) {
	const [isOpen, setIsOpen] = React.useState(false);
	const [propertyType, setPropertyType] = React.useState<string[]>(propertyTypeProp);
	const [priceRange, setPriceRange] = React.useState<[number, number]>(priceRangeProp);
	const [currency, setCurrency] = React.useState(currencyProp);
	const [operationType, setOperationType] = React.useState<string[]>(operationTypeProp);

	// Estados locales para los inputs (sin debounce)
	const [localMinPrice, setLocalMinPrice] = React.useState<string>(priceRangeProp[0].toString());
	const [localMaxPrice, setLocalMaxPrice] = React.useState<string>(priceRangeProp[1].toString());

	// Timer para debounce de inputs de precio
	const priceDebounceTimerRef = React.useRef<NodeJS.Timeout | null>(null);

	// Ref para rastrear si el usuario ha interactuado manualmente con los filtros
	const hasUserInteractedRef = React.useRef(false);

	// Sincronizar con props cuando cambien (sin disparar notificaciones)
	React.useEffect(() => {
		hasUserInteractedRef.current = false; // Reset al sincronizar con props externas
		setPropertyType(propertyTypeProp);
		setPriceRange(priceRangeProp);
		setLocalMinPrice(priceRangeProp[0].toString());
		setLocalMaxPrice(priceRangeProp[1].toString());
		setCurrency(currencyProp);
		setOperationType(operationTypeProp);
	}, [propertyTypeProp, priceRangeProp, currencyProp, operationTypeProp]);

	// Debounce para cambios de precio
	React.useEffect(() => {
		// Solo procesar si el usuario ha interactuado
		if (!hasUserInteractedRef.current) return;

		if (priceDebounceTimerRef.current) {
			clearTimeout(priceDebounceTimerRef.current);
		}

		priceDebounceTimerRef.current = setTimeout(() => {
			const minPrice = Math.max(0, Math.min(Number(localMinPrice) || 0, Number(localMaxPrice) || 10000000));
			const maxPrice = Math.min(10000000, Math.max(Number(localMaxPrice) || 10000000, minPrice));

			if (minPrice !== priceRange[0] || maxPrice !== priceRange[1]) {
				setPriceRange([minPrice, maxPrice]);
			}
		}, 800); // 800ms de espera

		return () => {
			if (priceDebounceTimerRef.current) {
				clearTimeout(priceDebounceTimerRef.current);
			}
		};
	}, [localMinPrice, localMaxPrice]);

	// Función para notificar cambios solo cuando el usuario interactúa
	const notifyFiltersChange = React.useCallback(
		(filters: { propertyType: string[]; priceRange: [number, number]; currency: string; operationType: string[] }) => {
			if (hasUserInteractedRef.current && onFiltersChange) {
				onFiltersChange(filters);
			}
		},
		[onFiltersChange]
	);

	// Notificar cambios de filtros al padre solo cuando el usuario los cambia manualmente
	React.useEffect(() => {
		notifyFiltersChange({
			propertyType,
			priceRange,
			currency,
			operationType,
		});
	}, [propertyType, priceRange, currency, operationType, notifyFiltersChange]);

	// Handlers que marcan interacción del usuario
	const handlePropertyTypeChange = (value: string[]) => {
		hasUserInteractedRef.current = true;
		setPropertyType(value);
	};

	const handleOperationTypeChange = (value: string[]) => {
		hasUserInteractedRef.current = true;
		setOperationType(value);
	};

	const handleCurrencyChange = (value: string) => {
		hasUserInteractedRef.current = true;
		setCurrency(value);
	};

	const handlePriceRangeSliderChange = (value: [number, number]) => {
		hasUserInteractedRef.current = true;
		setPriceRange(value);
		setLocalMinPrice(value[0].toString());
		setLocalMaxPrice(value[1].toString());
	};

	const handleMinPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		hasUserInteractedRef.current = true;
		setLocalMinPrice(e.target.value);
	};

	const handleMaxPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		hasUserInteractedRef.current = true;
		setLocalMaxPrice(e.target.value);
	};

	const formatPrice = (value: number) => {
		if (value >= 1000000) {
			return `${(value / 1000000).toFixed(1)}M`;
		}
		if (value >= 1000) {
			return `${(value / 1000).toFixed(0)}K`;
		}
		return value.toString();
	};

	const hasActiveFilters =
		propertyType.length > 0 || operationType.length > 0 || priceRange[0] > 5000 || priceRange[1] < 10000000;

	const clearAllFilters = () => {
		hasUserInteractedRef.current = true;
		setPropertyType([]);
		setOperationType([]);
		setPriceRange([5000, 10000000]);
		setLocalMinPrice('5000');
		setLocalMaxPrice('10000000');
	};

	const filterCount = propertyType.length + operationType.length;

	return (
		<Sheet open={isOpen} onOpenChange={setIsOpen}>
			<SheetTrigger asChild>
				<Button
					size="icon"
					className="relative h-12 w-12 rounded-full shadow-lg text-white hover:text-white hover:opacity-90 border-0"
					style={{ backgroundColor: '#8F7BBD' }}
				>
					<MdFilterList className="size-6" />
					{filterCount > 0 && (
						<span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
							{filterCount}
						</span>
					)}
				</Button>
			</SheetTrigger>
			<SheetContent side="left" className="w-[85vw] sm:w-[400px] p-0">
				<div className="flex h-full flex-col">
					{/* Header */}
					<div className="flex items-center justify-between border-b px-6 py-4">
						<h2 className="text-lg font-semibold">Filtros</h2>
						{hasActiveFilters && (
							<Button variant="ghost" size="sm" onClick={clearAllFilters} className="h-8 px-3 text-sm">
								Limpiar todo
							</Button>
						)}
					</div>

					{/* Filters Content */}
					<div className="flex-1 overflow-y-auto px-6 py-6">
						<div className="space-y-6">
							{/* Property Type */}
							<div className="space-y-3">
								<div className="flex items-center gap-2">
									<BsHouseDoor className="size-4 text-muted-foreground" />
									<h3 className="font-semibold">Tipo de propiedad</h3>
								</div>
								<MultiSelect
									options={propertyTypes}
									selected={propertyType}
									onChange={handlePropertyTypeChange}
									searchPlaceholder="Buscar tipo..."
									maxHeight="200px"
								/>
							</div>

							{/* Operation Type */}
							<div className="space-y-3">
								<div className="flex items-center gap-2">
									<BsBuilding className="size-4 text-muted-foreground" />
									<h3 className="font-semibold">Tipo de operación</h3>
								</div>
								<MultiSelect
									options={operationTypes}
									selected={operationType}
									onChange={handleOperationTypeChange}
									searchPlaceholder="Buscar operación..."
									maxHeight="150px"
								/>
							</div>

							{/* Price Range */}
							<div className="space-y-3">
								<div className="flex items-center gap-2">
									<MdAttachMoney className="size-4 text-muted-foreground" />
									<h3 className="font-semibold">Rango de precio</h3>
								</div>
								<Select value={currency} onValueChange={handleCurrencyChange}>
									<SelectTrigger className="w-full h-11">
										<SelectValue placeholder="Moneda" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="MXN">MXN - Peso Mexicano</SelectItem>
										<SelectItem value="USD">USD - Dólar</SelectItem>
									</SelectContent>
								</Select>
								<div className="space-y-3 pt-2">
									<div className="flex items-center gap-2">
										<div className="flex-1">
											<label className="text-xs text-muted-foreground mb-1 block">Mínimo</label>
											<div className="relative">
												<span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
													{currency} $
												</span>
												<input
													type="number"
													value={localMinPrice}
													onChange={handleMinPriceChange}
													onBlur={() => {
														const value = Math.max(
															0,
															Math.min(Number(localMinPrice) || 0, Number(localMaxPrice) || 10000000)
														);
														setLocalMinPrice(value.toString());
													}}
													className="w-full h-10 pl-16 pr-3 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-ring [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
												/>
											</div>
										</div>
										<div className="flex-1">
											<label className="text-xs text-muted-foreground mb-1 block">Máximo</label>
											<div className="relative">
												<span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
													{currency} $
												</span>
												<input
													type="number"
													value={localMaxPrice}
													onChange={handleMaxPriceChange}
													onBlur={() => {
														const value = Math.min(
															10000000,
															Math.max(Number(localMaxPrice) || 10000000, Number(localMinPrice) || 0)
														);
														setLocalMaxPrice(value.toString());
													}}
													className="w-full h-10 pl-16 pr-3 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-ring [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
												/>
											</div>
										</div>
									</div>
									<Slider
										value={priceRange}
										onValueChange={handlePriceRangeSliderChange}
										min={0}
										max={10000000}
										step={100000}
										className="w-full"
									/>
									<div className="flex items-center justify-between text-xs text-muted-foreground">
										<span>$0</span>
										<span>$10M+</span>
									</div>
								</div>
							</div>
						</div>
					</div>

					{/* Footer */}
					<div className="border-t px-6 py-4">
						<Button
							className="w-full h-11 text-white"
							style={{ backgroundColor: '#8F7BBD' }}
							onClick={() => setIsOpen(false)}
						>
							Aplicar filtros
						</Button>
					</div>
				</div>
			</SheetContent>
		</Sheet>
	);
}
