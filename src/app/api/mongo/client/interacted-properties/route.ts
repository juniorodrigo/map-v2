import { NextRequest, NextResponse } from 'next/server';
import { updateClientPropertiesList } from '@/service/mongo/user';

export async function POST(request: NextRequest) {
	const body = await request.json();
	const { propertyId, viewerId, dbName, status } = body;

	if (status !== 'viewed' && status !== 'discarded' && status !== 'scheduled') {
		return NextResponse.json(
			{
				success: false,
				error: 'Estado inválido: debe ser "viewed", "discarded" o "scheduled"',
			},
			{ status: 400 }
		);
	}

	if (!propertyId || !viewerId) {
		return NextResponse.json(
			{
				success: false,
				error: 'Faltan parámetros: propertyId y viewerId son requeridos',
			},
			{ status: 400 }
		);
	}

	await updateClientPropertiesList(propertyId, viewerId, dbName, status);

	return NextResponse.json({
		success: true,
		status: 'ok',
	});
}
