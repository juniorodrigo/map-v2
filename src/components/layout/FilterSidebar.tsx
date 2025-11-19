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

	// Ref para evitar notificar cambios durante la sincronización inicial
	const isSyncingRef = React.useRef(true);

	// Sincronizar con props cuando cambien
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
									onChange={setPropertyType}
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
									onChange={setOperationType}
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
								<Select value={currency} onValueChange={setCurrency}>
									<SelectTrigger className="w-full h-11">
										<SelectValue placeholder="Moneda" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="MXN">MXN - Peso Mexicano</SelectItem>
										<SelectItem value="USD">USD - Dólar</SelectItem>
									</SelectContent>
								</Select>
								<div className="space-y-3 pt-2">
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
