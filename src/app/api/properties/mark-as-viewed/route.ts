import { NextRequest, NextResponse } from 'next/server';
import { markPropertyAsViewed } from '@/service/properties/property';

export async function POST(request: NextRequest) {
	const body = await request.json();

	const propertyId: string = body.propertyId;
	const viewerId: string = body.viewerId;
	const dbName: string = body.dbName || 'gu';

	if (!propertyId || !viewerId) {
		return NextResponse.json(
			{
				success: false,
				error: 'Faltan parámetros: propertyId y viewerId son requeridos',
			},
			{ status: 400 }
		);
	}

	await markPropertyAsViewed(propertyId, viewerId, dbName);

	return NextResponse.json({
		success: true,
		status: 'ok',
	});
}
