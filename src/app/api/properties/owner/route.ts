import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { ValidationError } from '@/lib/errors';
import { getPropertiesByOwner } from '@/service/properties/property';

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const ownerId = searchParams.get('ownerId');
		const dbName = searchParams.get('dbName') || 'gu';

		if (!ownerId) {
			throw new ValidationError('Parámetro "ownerId" es requerido');
		}

		logger.info('API Properties by Owner', { ownerId, dbName });

		const properties = await getPropertiesByOwner(ownerId, dbName);

		return NextResponse.json({
			success: true,
			data: {
				ownerId,
				count: properties.length,
				properties,
			},
		});
	} catch (error) {
		logger.error('Error en API Properties by Owner', error);

		if (error instanceof ValidationError) {
			return NextResponse.json({ success: false, error: error.message }, { status: 400 });
		}

		return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 });
	}
}
