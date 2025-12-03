import { NextRequest, NextResponse } from 'next/server';
import { getUserInfoByToken } from '@/service/mongo/user';
import { updateOne } from '@/service/mongo/queries';
import { propertyTypeCodesToLabels, operationTypeCodesToLabels } from '@/lib/property-type-mappings';

export async function POST(request: NextRequest) {
	try {
		const { token, database, filters, location } = await request.json();

		console.log('📥 Datos recibidos para actualizar requerimiento:', { token, database, filters, location });

		if (!token || !database || !filters) {
			return NextResponse.json({ success: false, error: 'Faltan parámetros requeridos' }, { status: 400 });
		}

		// Verificar que el usuario existe
		const userInfo = await getUserInfoByToken(token, database);
		if (!userInfo) {
			return NextResponse.json({ success: false, error: 'Usuario no encontrado' }, { status: 404 });
		}

		// Convertir códigos a labels para la DB
		const propertyTypes = propertyTypeCodesToLabels(filters.propertyType || []);
		const operationTypes = operationTypeCodesToLabels(filters.operationType || []);

		const lastRequirement: any = {
			currency: filters.currency || 'MXN',
			price_start: filters.priceRange?.[0] || 0,
			price_end: filters.priceRange?.[1] || 10000000,
			property_type: propertyTypes,
			operation_type: operationTypes,
		};

		if (location) {
			lastRequirement.geometry = {
				type: 'Point',
				coordinates: [location.lng, location.lat],
			};
		}

		const updateResult = (await updateOne({
			collection: 'users',
			filter: { lead_id: token },
			update: { $set: { last_requirement: lastRequirement } },
			dbName: database,
		})) as any;

		// Verificar si la operación fue exitosa (matchedCount > 0 significa que se encontró el documento)
		if (!updateResult || updateResult.matchedCount === 0) {
			return NextResponse.json({ success: false, error: 'No se encontró el usuario para actualizar' }, { status: 404 });
		}

		return NextResponse.json({
			success: true,
			message: 'Requerimiento actualizado correctamente',
			updated: updateResult.modifiedCount > 0,
			document: updateResult.document,
		});
	} catch (error) {
		console.error('❌ Error actualizando requerimiento:', error);
		return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 });
	}
}
