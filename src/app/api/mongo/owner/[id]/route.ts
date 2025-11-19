import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
	try {
		const ownerId = params.id;

		if (!ownerId) {
			return NextResponse.json({ success: false, error: 'ID del owner es requerido' }, { status: 400 });
		}

		logger.info('Owner ID recibido', { ownerId });

		return NextResponse.json({
			success: true,
			data: {
				ownerId,
			},
		});
	} catch (error) {
		logger.error('Error en API Owner', error);
		return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 });
	}
}
