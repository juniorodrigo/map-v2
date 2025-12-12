import { NextResponse } from 'next/server';

export async function POST() {
	try {
		// Aquí puedes agregar lógica adicional como:
		// - Limpiar filtros guardados en base de datos para el usuario
		// - Registrar analytics sobre la acción
		// - Limpiar caché de filtros si existe

		// Por ahora, simplemente confirmamos que los filtros fueron limpiados
		return NextResponse.json({
			success: true,
			message: 'Filtros limpiados correctamente',
			filters: {
				propertyType: null,
				priceRange: null,
				currency: null,
				operationType: null,
			},
		});
	} catch (error) {
		console.error('Error al limpiar filtros:', error);
		return NextResponse.json({ success: false, message: 'Error al limpiar los filtros' }, { status: 500 });
	}
}
