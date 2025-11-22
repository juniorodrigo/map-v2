import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { ValidationError } from '@/lib/errors';
import { searchProperties } from '@/service/properties/property';
import type { PropertyFilters } from '@/types/property';
import { groupPropertiesByOwner } from '@/utils/properties';

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { filters, dbName = 'gu' } = body;

		if (!filters) {
			throw new ValidationError('Faltan parámetros: filters es requerido');
		}

		const propertyFilters: PropertyFilters = {
			propertyType: filters.propertyType || [],
			priceRange: filters.priceRange || [5000, 10000000],
			currency: filters.currency || 'MXN',
			operationType: filters.operationType || [],
			bounds: filters.bounds,
			searchLocation: filters.searchLocation,
		};

		const { total, properties } = await searchProperties(propertyFilters, dbName);

		const owners = groupPropertiesByOwner(properties);

		return NextResponse.json({
			success: true,
			data: {
				total,
				properties,
				owners,
			},
		});
	} catch (error) {
		logger.error('Error en API Properties Search', error);

		if (error instanceof ValidationError) {
			return NextResponse.json({ success: false, error: error.message }, { status: 400 });
		}

		return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 });
	}
}
