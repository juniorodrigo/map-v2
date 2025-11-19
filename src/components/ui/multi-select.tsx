'use client';

import * as React from 'react';
import { MdCheck, MdClose, MdSearch } from 'react-icons/md';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

export interface MultiSelectOption {
	value: string;
	label: string;
}

interface MultiSelectProps {
	options: MultiSelectOption[];
	selected: string[];
	onChange: (selected: string[]) => void;
	placeholder?: string;
	searchPlaceholder?: string;
	className?: string;
	maxHeight?: string;
}

export function MultiSelect({
	options,
	selected,
	onChange,
	placeholder = 'Seleccionar...',
	searchPlaceholder = 'Buscar...',
	className,
	maxHeight = '300px',
}: MultiSelectProps) {
	const [search, setSearch] = React.useState('');

	const filteredOptions = React.useMemo(() => {
		if (!search) return options;
		return options.filter((option) => option.label.toLowerCase().includes(search.toLowerCase()));
	}, [options, search]);

	const toggleOption = (value: string) => {
		if (selected.includes(value)) {
			onChange(selected.filter((v) => v !== value));
		} else {
			onChange([...selected, value]);
		}
	};

	const removeOption = (value: string) => {
		onChange(selected.filter((v) => v !== value));
	};

	const selectedOptions = options.filter((opt) => selected.includes(opt.value));

	return (
		<div className={cn('w-full', className)}>
			{/* Selected Items */}
			{selectedOptions.length > 0 && (
				<div className="flex flex-wrap gap-2 mb-3 pb-3 border-b">
					{selectedOptions.map((option) => (
						<Badge
							key={option.value}
							className="text-white hover:opacity-80 transition-opacity gap-1.5 pr-1.5"
							style={{ backgroundColor: '#8F7BBD' }}
						>
							<span>{option.label}</span>
							<button
								type="button"
								onClick={(e) => {
									e.stopPropagation();
									removeOption(option.value);
								}}
								className="rounded-full hover:bg-white/20 p-0.5 transition-colors"
							>
								<MdClose className="size-3" />
							</button>
						</Badge>
					))}
				</div>
			)}

			{/* Search Input */}
			<div className="relative mb-2">
				<MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
				<Input
					type="text"
					placeholder={searchPlaceholder}
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					className="pl-9 h-9"
				/>
			</div>

			{/* Options List */}
			<div className="rounded-md border overflow-y-auto" style={{ maxHeight }}>
				<div className="p-1">
					{filteredOptions.length === 0 ? (
						<div className="py-6 text-center text-sm text-muted-foreground">No se encontraron resultados</div>
					) : (
						filteredOptions.map((option) => {
							const isSelected = selected.includes(option.value);
							return (
								<button
									key={option.value}
									type="button"
									onClick={() => toggleOption(option.value)}
									className={cn(
										'relative flex w-full cursor-pointer select-none items-center rounded-sm px-3 py-2 text-sm outline-none transition-colors',
										'hover:bg-accent hover:text-accent-foreground',
										isSelected && 'bg-accent/50'
									)}
								>
									<div
										className={cn(
											'mr-2 flex size-4 items-center justify-center rounded border border-primary',
											isSelected ? 'text-white' : 'opacity-50 [&_svg]:invisible'
										)}
										style={isSelected ? { backgroundColor: '#8F7BBD', borderColor: '#8F7BBD' } : {}}
									>
										<MdCheck className="size-3" />
									</div>
									<span>{option.label}</span>
								</button>
							);
						})
					)}
				</div>
			</div>
		</div>
	);
}
