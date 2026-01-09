'use client';

import * as React from 'react';
import { MdClose } from 'react-icons/md';
import { BsHouseDoor, BsBuilding } from 'react-icons/bs';
import { MdAttachMoney } from 'react-icons/md';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { MultiSelect } from '@/components/ui/multi-select';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { PROPERTY_TYPE_MAPPINGS, OPERATION_TYPE_MAPPINGS } from '@/lib/property-type-mappings';
import { PRICE_FILTER, hasPriceFilterActive, formatPriceDisplay } from '@/config/price-filter';

// Generar opciones dinámicamente desde los mapeos centralizados
const propertyTypes = Object.entries(PROPERTY_TYPE_MAPPINGS).map(([value, label]) => ({
	value,
	label,
}));

const operationTypes = Object.entries(OPERATION_TYPE_MAPPINGS).map(([value, label]) => ({
	value,
	label,
}));

interface FloatingFilterBarProps {
	propertyType?: string[];
	priceRange?: [number, number] | null;
	currency?: string;
	operationType?: string[];
	onFiltersChange?: (filters: {
		propertyType: string[];
		priceRange: [number, number] | null;
		currency: string;
		operationType: string[];
	}) => void;
}

export function FloatingFilterBar({
	propertyType: propertyTypeProp = [],
	priceRange: priceRangeProp = null,
	currency: currencyProp = PRICE_FILTER.DEFAULT_CURRENCY,
	operationType: operationTypeProp = [],
	onFiltersChange,
}: FloatingFilterBarProps) {
	const [propertyType, setPropertyType] = React.useState<string[]>(propertyTypeProp);
	const [priceRange, setPriceRange] = React.useState<[number, number] | null>(priceRangeProp);
	const [currency, setCurrency] = React.useState(currencyProp);
	const [operationType, setOperationType] = React.useState<string[]>(operationTypeProp);

	// Estados locales para los inputs (sin debounce)
	const [localMinPrice, setLocalMinPrice] = React.useState<string>(priceRangeProp ? priceRangeProp[0].toString() : '');
	const [localMaxPrice, setLocalMaxPrice] = React.useState<string>(priceRangeProp ? priceRangeProp[1].toString() : '');

	// Estados para controlar la apertura de popovers con hover
	const [propertyTypeOpen, setPropertyTypeOpen] = React.useState(false);
	const [priceOpen, setPriceOpen] = React.useState(false);
	const [operationTypeOpen, setOperationTypeOpen] = React.useState(false);

	// Estado para el modal de confirmación de limpiar filtros
	const [showClearConfirmDialog, setShowClearConfirmDialog] = React.useState(false);
	const [isClearing, setIsClearing] = React.useState(false);

	// Timers para delay en hover
	const propertyTypeTimerRef = React.useRef<NodeJS.Timeout | null>(null);
	const priceTimerRef = React.useRef<NodeJS.Timeout | null>(null);
	const operationTypeTimerRef = React.useRef<NodeJS.Timeout | null>(null);

	// Timer para debounce de inputs de precio
	const priceDebounceTimerRef = React.useRef<NodeJS.Timeout | null>(null);

	// Timer para debounce de notificación cuando se usa el slider
	const sliderDebounceTimerRef = React.useRef<NodeJS.Timeout | null>(null);
	// Ref para ignorar la notificación inmediata desde el efecto cuando el cambio viene del slider
	const ignorePriceEffectRef = React.useRef(false);

	// Ref para rastrear si el usuario ha interactuado manualmente con los filtros
	const hasUserInteractedRef = React.useRef(false);

	// Sincronizar con props cuando cambien (sin disparar notificaciones)
	React.useEffect(() => {
		hasUserInteractedRef.current = false; // Reset al sincronizar con props externas
		setPropertyType(propertyTypeProp);

		// Si los filtros de precio vienen como [0, 0] del servidor, ignorarlos
		const effectivePriceRange =
			priceRangeProp && priceRangeProp[0] === 0 && priceRangeProp[1] === 0 ? null : (priceRangeProp ?? null);

		setPriceRange(effectivePriceRange);
		setLocalMinPrice(effectivePriceRange ? effectivePriceRange[0].toString() : '');
		setLocalMaxPrice(effectivePriceRange ? effectivePriceRange[1].toString() : '');
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
			// Si ambos inputs están vacíos, interpretamos que el usuario quiere quitar el filtro
			if (localMinPrice === '' && localMaxPrice === '') {
				if (priceRange !== null) setPriceRange(null);
				return;
			}

			const minPrice = Math.max(
				PRICE_FILTER.MIN,
				Math.min(Number(localMinPrice) || PRICE_FILTER.MIN, Number(localMaxPrice) || PRICE_FILTER.MAX)
			);
			const maxPrice = Math.min(PRICE_FILTER.MAX, Math.max(Number(localMaxPrice) || PRICE_FILTER.MAX, minPrice));

			if (!priceRange || minPrice !== priceRange[0] || maxPrice !== priceRange[1]) {
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
		(filters: {
			propertyType: string[];
			priceRange: [number, number] | null;
			currency: string;
			operationType: string[];
		}) => {
			if (hasUserInteractedRef.current && onFiltersChange) {
				onFiltersChange(filters);
			}
		},
		[onFiltersChange]
	);

	// Notificar cambios de filtros al padre solo cuando el usuario los cambia manualmente
	React.useEffect(() => {
		// Si el cambio de precio vino del slider, ignoramos la notificación inmediata
		if (ignorePriceEffectRef.current) {
			// resetear la bandera y esperar a que el debounce del slider notifique
			ignorePriceEffectRef.current = false;
			return;
		}
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

		// Indicar que el efecto no debe notificar inmediatamente (evita una petición por cada movimiento)
		ignorePriceEffectRef.current = true;

		// Debounce para notificar al padre una sola vez tras mover el slider
		if (sliderDebounceTimerRef.current) {
			clearTimeout(sliderDebounceTimerRef.current);
		}
		sliderDebounceTimerRef.current = setTimeout(() => {
			// Usar la función de notificación para respetar la lógica existente
			notifyFiltersChange({
				propertyType,
				priceRange: value,
				currency,
				operationType,
			});
		}, 300);
	};

	// Limpiar timers al desmontar
	React.useEffect(() => {
		return () => {
			if (priceDebounceTimerRef.current) clearTimeout(priceDebounceTimerRef.current);
			if (sliderDebounceTimerRef.current) clearTimeout(sliderDebounceTimerRef.current);
		};
	}, []);

	const handleMinPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		hasUserInteractedRef.current = true;
		setLocalMinPrice(e.target.value);
	};

	const handleMaxPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		hasUserInteractedRef.current = true;
		setLocalMaxPrice(e.target.value);
	};

	const hasActiveFilters = propertyType.length > 0 || operationType.length > 0 || hasPriceFilterActive(priceRange);

	const handleClearFiltersClick = () => {
		setShowClearConfirmDialog(true);
	};

	const clearAllFilters = async () => {
		setIsClearing(true);
		try {
			// Enviar petición al backend para limpiar filtros
			const response = await fetch('/api/filters/clear', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
			});

			if (!response.ok) {
				throw new Error('Error al limpiar filtros');
			}

			// Limpiar filtros localmente
			hasUserInteractedRef.current = true;
			setPropertyType([]);
			setOperationType([]);
			setPriceRange(null);
			setLocalMinPrice('');
			setLocalMaxPrice('');
			setShowClearConfirmDialog(false);
		} catch (error) {
			console.error('Error al limpiar filtros:', error);
		} finally {
			setIsClearing(false);
		}
	};

	const getPropertyTypeLabel = () => {
		if (propertyType.length === 0) return 'Tipo de propiedad';
		if (propertyType.length === 1) {
			return propertyTypes.find((t) => t.value === propertyType[0])?.label || 'Tipo de propiedad';
		}
		return `${propertyType.length} tipos`;
	};

	const getOperationTypeLabel = () => {
		if (operationType.length === 0) return 'Tipo de operación';
		if (operationType.length === 1) {
			return operationTypes.find((t) => t.value === operationType[0])?.label || 'Tipo de operación';
		}
		return `${operationType.length} operaciones`;
	};

	// Funciones para manejar hover con delay
	const handlePropertyTypeMouseEnter = () => {
		if (propertyTypeTimerRef.current) clearTimeout(propertyTypeTimerRef.current);
		setPropertyTypeOpen(true);
	};

	const handlePropertyTypeMouseLeave = () => {
		propertyTypeTimerRef.current = setTimeout(() => {
			setPropertyTypeOpen(false);
		}, 200);
	};

	const handlePriceMouseEnter = () => {
		if (priceTimerRef.current) clearTimeout(priceTimerRef.current);
		setPriceOpen(true);
	};

	const handlePriceMouseLeave = () => {
		priceTimerRef.current = setTimeout(() => {
			setPriceOpen(false);
		}, 200);
	};

	const handleOperationTypeMouseEnter = () => {
		if (operationTypeTimerRef.current) clearTimeout(operationTypeTimerRef.current);
		setOperationTypeOpen(true);
	};

	const handleOperationTypeMouseLeave = () => {
		operationTypeTimerRef.current = setTimeout(() => {
			setOperationTypeOpen(false);
		}, 200);
	};

	return (
		<div className="absolute top-4 right-4 z-20 items-center gap-2 hidden lg:flex">
			{/* Property Type Filter */}
			<Popover open={propertyTypeOpen} onOpenChange={setPropertyTypeOpen}>
				<PopoverTrigger asChild>
					<Button
						variant="outline"
						className="h-10 gap-2 rounded-full px-4 shadow-lg backdrop-blur-sm text-white hover:text-white hover:opacity-90"
						style={{ backgroundColor: '#8F7BBD', borderColor: '#8F7BBD' }}
						onMouseEnter={handlePropertyTypeMouseEnter}
						onMouseLeave={handlePropertyTypeMouseLeave}
					>
						<BsHouseDoor className="size-4" />
						<span className="font-medium">{getPropertyTypeLabel()}</span>
					</Button>
				</PopoverTrigger>
				<PopoverContent
					className="w-80"
					align="start"
					onMouseEnter={handlePropertyTypeMouseEnter}
					onMouseLeave={handlePropertyTypeMouseLeave}
				>
					<div className="space-y-2 mb-3">
						<h4 className="font-semibold leading-none">Tipo de propiedad</h4>
						<p className="text-sm text-muted-foreground">Selecciona uno o más tipos</p>
					</div>
					<MultiSelect
						options={propertyTypes}
						selected={propertyType}
						onChange={handlePropertyTypeChange}
						searchPlaceholder="Buscar tipo..."
						maxHeight="250px"
					/>
				</PopoverContent>
			</Popover>

			{/* Price Range Filter */}
			<Popover open={priceOpen} onOpenChange={setPriceOpen}>
				<PopoverTrigger asChild>
					<Button
						variant="outline"
						className="h-10 gap-2 rounded-full px-4 shadow-lg backdrop-blur-sm text-white hover:text-white hover:opacity-90"
						style={{ backgroundColor: '#8F7BBD', borderColor: '#8F7BBD' }}
						onMouseEnter={handlePriceMouseEnter}
						onMouseLeave={handlePriceMouseLeave}
					>
						<MdAttachMoney className="size-4" />
						<span className="font-medium">
							{priceRange
								? `${currency} $${formatPriceDisplay(priceRange[0])} - $${formatPriceDisplay(priceRange[1])}`
								: 'Rango de precio'}
						</span>
					</Button>
				</PopoverTrigger>
				<PopoverContent
					className="w-80"
					align="start"
					onMouseEnter={handlePriceMouseEnter}
					onMouseLeave={handlePriceMouseLeave}
				>
					<div className="space-y-4">
						<div className="space-y-2">
							<h4 className="font-semibold leading-none">Rango de precio</h4>
							<p className="text-sm text-muted-foreground">Ajusta el rango de precio</p>
						</div>
						<div className="space-y-4">
							<Select value={currency} onValueChange={handleCurrencyChange}>
								<SelectTrigger className="w-full">
									<SelectValue placeholder="Moneda" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="MXN">MXN - Peso Mexicano</SelectItem>
									<SelectItem value="USD">USD - Dólar</SelectItem>
								</SelectContent>
							</Select>
							<div className="space-y-3">
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
														PRICE_FILTER.MIN,
														Math.min(
															Number(localMinPrice) || PRICE_FILTER.MIN,
															Number(localMaxPrice) || PRICE_FILTER.MAX
														)
													);
													setLocalMinPrice(value.toString());
												}}
												className="w-full h-9 pl-16 pr-3 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-ring [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
														PRICE_FILTER.MAX,
														Math.max(
															Number(localMaxPrice) || PRICE_FILTER.MAX,
															Number(localMinPrice) || PRICE_FILTER.MIN
														)
													);
													setLocalMaxPrice(value.toString());
												}}
												className="w-full h-9 pl-16 pr-3 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-ring [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
											/>
										</div>
									</div>
								</div>
								<Slider
									value={priceRange ?? PRICE_FILTER.DEFAULT_RANGE}
									onValueChange={handlePriceRangeSliderChange}
									min={PRICE_FILTER.MIN}
									max={PRICE_FILTER.MAX}
									step={PRICE_FILTER.SLIDER_STEP}
									className="w-full"
								/>
								<div className="flex items-center justify-between text-xs text-muted-foreground">
									<span>{priceRange ? formatPriceDisplay(priceRange[0]) : PRICE_FILTER.DISPLAY_MIN_LABEL}</span>
									<span>{priceRange ? formatPriceDisplay(priceRange[1]) : PRICE_FILTER.DISPLAY_MAX_LABEL}</span>
								</div>
							</div>
						</div>
					</div>
				</PopoverContent>
			</Popover>

			{/* Operation Type Filter */}
			<Popover open={operationTypeOpen} onOpenChange={setOperationTypeOpen}>
				<PopoverTrigger asChild>
					<Button
						variant="outline"
						className="h-10 gap-2 rounded-full px-4 shadow-lg backdrop-blur-sm text-white hover:text-white hover:opacity-90"
						style={{ backgroundColor: '#8F7BBD', borderColor: '#8F7BBD' }}
						onMouseEnter={handleOperationTypeMouseEnter}
						onMouseLeave={handleOperationTypeMouseLeave}
					>
						<BsBuilding className="size-4" />
						<span className="font-medium">{getOperationTypeLabel()}</span>
					</Button>
				</PopoverTrigger>
				<PopoverContent
					className="w-72"
					align="start"
					onMouseEnter={handleOperationTypeMouseEnter}
					onMouseLeave={handleOperationTypeMouseLeave}
				>
					<div className="space-y-2 mb-3">
						<h4 className="font-semibold leading-none">Tipo de operación</h4>
						<p className="text-sm text-muted-foreground">Selecciona uno o más tipos</p>
					</div>
					<MultiSelect
						options={operationTypes}
						selected={operationType}
						onChange={handleOperationTypeChange}
						searchPlaceholder="Buscar operación..."
						maxHeight="200px"
					/>
				</PopoverContent>
			</Popover>

			{/* Clear Filters */}
			{hasActiveFilters && (
				<Button
					variant="ghost"
					size="icon"
					onClick={handleClearFiltersClick}
					className="h-10 w-10 rounded-full bg-white/95 shadow-lg backdrop-blur-sm hover:bg-white"
				>
					<MdClose className="size-5" />
					<span className="sr-only">Limpiar filtros</span>
				</Button>
			)}

			{/* Modal de confirmación para limpiar filtros */}
			<Dialog open={showClearConfirmDialog} onOpenChange={setShowClearConfirmDialog}>
				<DialogContent className="sm:max-w-[425px]">
					<DialogHeader>
						<DialogTitle>¿Limpiar todos los filtros?</DialogTitle>
						<DialogDescription>
							Esta acción eliminará todos los filtros de búsqueda activos. ¿Estás seguro de que deseas continuar?
						</DialogDescription>
					</DialogHeader>
					<DialogFooter className="gap-2 sm:gap-0">
						<Button variant="outline" onClick={() => setShowClearConfirmDialog(false)} disabled={isClearing}>
							Cancelar
						</Button>
						<Button onClick={clearAllFilters} disabled={isClearing} className="bg-red-500 hover:bg-red-600 text-white">
							{isClearing ? 'Limpiando...' : 'Sí, limpiar filtros'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
