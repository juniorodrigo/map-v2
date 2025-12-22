/**
 * Constantes de configuración para los filtros de precio.
 *
 * PRICE_FILTER_MIN: Valor mínimo del rango de precio (0 = sin límite inferior)
 * PRICE_FILTER_MAX: Valor máximo del rango de precio para la UI.
 *                   Se usa 100,000,000 (100M) como límite práctico para propiedades en México.
 *                   En la consulta a MongoDB, usar Number.MAX_SAFE_INTEGER para no excluir propiedades.
 * PRICE_FILTER_SLIDER_STEP: Incremento del slider de precios
 * PRICE_FILTER_DISPLAY_MAX_LABEL: Etiqueta para mostrar en la UI cuando el precio es el máximo
 */

export const PRICE_FILTER = {
	/** Precio mínimo por defecto (sin restricción) */
	MIN: 0,

	/** Precio máximo para la UI del slider (100 millones - límite visual práctico) */
	MAX: 100_000_000,

	/** Precio máximo para consultas a la base de datos (sin límite real) */
	DB_MAX: Number.MAX_SAFE_INTEGER,

	/** Incremento del slider */
	SLIDER_STEP: 1_000_000,

	/** Rango por defecto [min, max] */
	DEFAULT_RANGE: [0, 100_000_000] as [number, number],

	/** Moneda por defecto */
	DEFAULT_CURRENCY: 'MXN',

	/** Etiqueta para el máximo en la UI */
	DISPLAY_MAX_LABEL: '$100M+',

	/** Etiqueta para el mínimo en la UI */
	DISPLAY_MIN_LABEL: '$0',
} as const;

/**
 * Verifica si el rango de precio tiene filtros activos (diferentes a los valores por defecto)
 */
export function hasPriceFilterActive(priceRange?: [number, number] | null): boolean {
	if (!priceRange) return false;
	return priceRange[0] > PRICE_FILTER.MIN || priceRange[1] < PRICE_FILTER.MAX;
}

/**
 * Formatea un precio para mostrar en la UI
 */
export function formatPriceDisplay(value: number): string {
	if (value >= 1_000_000_000) {
		return `${(value / 1_000_000_000).toFixed(1)}B`;
	}
	if (value >= 1_000_000) {
		return `${(value / 1_000_000).toFixed(1)}M`;
	}
	if (value >= 1_000) {
		return `${(value / 1_000).toFixed(0)}K`;
	}
	return value.toString();
}

/**
 * Obtiene el precio máximo real para consultas a la base de datos.
 * Si el usuario selecciona el máximo de la UI, se usa DB_MAX para no excluir propiedades.
 */
export function getDbMaxPrice(uiMaxPrice: number): number {
	return uiMaxPrice >= PRICE_FILTER.MAX ? PRICE_FILTER.DB_MAX : uiMaxPrice;
}
