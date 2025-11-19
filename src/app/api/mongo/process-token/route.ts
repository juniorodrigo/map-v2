import { NextResponse } from 'next/server';
import { getUserInfoByToken } from '@/service/mongo/user';
import { getOwnerInfoByFirebaseId } from '@/service/firebase/owner';

export async function POST(request: Request) {
	try {
		const { token } = await request.json();

		console.log('============== Procesando token:', token);

		const userInfo = await getUserInfoByToken(token);
		if (!userInfo) {
			return NextResponse.json({ success: false, error: 'Token no encontrado' }, { status: 404 });
		}

		const ownerSettings = await getOwnerInfoByFirebaseId(userInfo.owner_firebase_id);
		console.log('xxxxxxxxxxxxxxxxxxxxxxxxx Información del propietario obtenida:', ownerSettings);

		const resultado = {
			success: true,
			mensaje: 'Token procesado correctamente',
			token: token,
			userInfo: userInfo,
			ownerSettings,
			timestamp: new Date().toISOString(),
		};
		console.log('================================');
		return NextResponse.json(resultado);
	} catch (error) {
		console.error('❌ Error procesando token:', error);
		return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 });
	}
}
