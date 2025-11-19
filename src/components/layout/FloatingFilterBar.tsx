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

interface FloatingFilterBarProps {
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

export function FloatingFilterBar({
	propertyType: propertyTypeProp = [],
	priceRange: priceRangeProp = [5000, 10000000],
	currency: currencyProp = 'MXN',
	operationType: operationTypeProp = [],
	onFiltersChange,
}: FloatingFilterBarProps) {
	const [propertyType, setPropertyType] = React.useState<string[]>(propertyTypeProp);
	const [priceRange, setPriceRange] = React.useState<[number, number]>(priceRangeProp);
	const [currency, setCurrency] = React.useState(currencyProp);
	const [operationType, setOperationType] = React.useState<string[]>(operationTypeProp);

	// Estados para controlar la apertura de popovers con hover
	const [propertyTypeOpen, setPropertyTypeOpen] = React.useState(false);
	const [priceOpen, setPriceOpen] = React.useState(false);
	const [operationTypeOpen, setOperationTypeOpen] = React.useState(false);

	// Timers para delay en hover
	const propertyTypeTimerRef = React.useRef<NodeJS.Timeout | null>(null);
	const priceTimerRef = React.useRef<NodeJS.Timeout | null>(null);
	const operationTypeTimerRef = React.useRef<NodeJS.Timeout | null>(null);

	// Ref para evitar notificar cambios durante la sincronización inicial
	const isSyncingRef = React.useRef(true);

	React.useEffect(() => {
		isSyncingRef.current = true;
		setPropertyType(propertyTypeProp);
		setPriceRange(priceRangeProp);
		setCurrency(currencyProp);
		setOperationType(operationTypeProp);
		// Permitir notificaciones después de un tick
		setTimeout(() => {
			isSyncingRef.current = false;
		}, 0);
	}, [propertyTypeProp, priceRangeProp, currencyProp, operationTypeProp]);

	// Notificar cambios de filtros al padre solo cuando el usuario los cambia
	React.useEffect(() => {
		if (!isSyncingRef.current && onFiltersChange) {
			onFiltersChange({
				propertyType,
				priceRange,
				currency,
				operationType,
			});
		}
	}, [propertyType, priceRange, currency, operationType, onFiltersChange]);

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
		setPropertyType([]);
		setOperationType([]);
		setPriceRange([5000, 10000000]);
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
						onChange={setPropertyType}
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
							{currency} ${formatPrice(priceRange[0])} - ${formatPrice(priceRange[1])}
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
							<Select value={currency} onValueChange={setCurrency}>
								<SelectTrigger className="w-full">
									<SelectValue placeholder="Moneda" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="MXN">MXN - Peso Mexicano</SelectItem>
									<SelectItem value="USD">USD - Dólar</SelectItem>
								</SelectContent>
							</Select>
							<div className="space-y-3">
								<div className="flex items-center justify-between">
									<span className="text-sm font-medium">
										{currency} ${formatPrice(priceRange[0])}
									</span>
									<span className="text-sm font-medium">
										{currency} ${formatPrice(priceRange[1])}
									</span>
								</div>
								<Slider
									value={priceRange}
									onValueChange={(value) => setPriceRange(value as [number, number])}
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
						onChange={setOperationType}
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
					onClick={clearAllFilters}
					className="h-10 w-10 rounded-full bg-white/95 shadow-lg backdrop-blur-sm hover:bg-white"
				>
					<MdClose className="size-5" />
					<span className="sr-only">Limpiar filtros</span>
				</Button>
			)}
		</div>
	);
}
