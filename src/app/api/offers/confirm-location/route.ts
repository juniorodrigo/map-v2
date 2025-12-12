import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { mongoClient } from '@/service/mongo/client';
import { env } from '@/config/env';
import { firebaseClient } from '@/service/firebase/client';
import {
	getFirestore,
	collection,
	addDoc,
	GeoPoint,
	Timestamp,
	query,
	where,
	getDocs,
	doc,
	getDoc,
} from 'firebase/firestore';
import { getApps, initializeApp } from 'firebase/app';

// Inicializar Firebase si no está inicializado
if (!getApps().length) {
	initializeApp(env.firebaseClient);
}

const db = getFirestore();

interface ConfirmLocationRequest {
	token: string;
	coordinates: {
		lat: number;
		lng: number;
	};
	addressComponents: {
		streetNumber?: string;
		streetName?: string;
		sublocality?: string;
		city?: string;
		state?: string;
		country?: string;
		postalCode?: string;
	};
	formattedAddress: string;
}

interface Monetization {
	price: number;
	currency: string;
	mantain_cost: number;
	monetization_type: string;
	mxn_price: number;
	percentage?: number;
	months?: number;
	comission_conditions: string;
	share_commission: boolean;
}

// Obtener colonia basada en código postal
async function getSublocalityByPostalCode(state: string, postalCode: string, sublocality: string): Promise<string> {
	try {
		const estadosRef = collection(db, 'estados');
		const q = query(estadosRef, where('estado', '==', state));
		const querySnapshot = await getDocs(q);

		if (querySnapshot.empty) return sublocality || '';

		const data = querySnapshot.docs[0].data();
		const csvString = data.dataCSV;

		if (!csvString) return sublocality || '';

		const regex = /\r?\n/;
		const dataChunks = csvString.split(regex).map((chunk: string) => chunk.trim().split(','));

		dataChunks.shift(); // Remover header

		interface Location {
			municipio: string;
			asentamiento: string;
		}

		const groupedData: { [codigoPostal: string]: Location[] } = {};

		dataChunks.forEach((chunk: string[]) => {
			const [codigoPostal, municipio, ...asentamientoArr] = chunk;
			const asentamiento = asentamientoArr.join(' ');
			if (!groupedData[codigoPostal]) {
				groupedData[codigoPostal] = [];
			}
			groupedData[codigoPostal].push({ municipio, asentamiento });
		});

		// Buscar asentamiento
		const normalizedKeyword = (sublocality || '')
			.normalize('NFD')
			.replace(/[\u0300-\u036f]/g, '')
			.toLowerCase();
		const locations = groupedData[postalCode];

		if (locations) {
			for (const location of locations) {
				const normalizedAsentamiento = location.asentamiento
					.normalize('NFD')
					.replace(/[\u0300-\u036f]/g, '')
					.toLowerCase();
				if (normalizedAsentamiento.includes(normalizedKeyword)) {
					return location.asentamiento;
				}
			}
		}

		return sublocality || '';
	} catch (error) {
		logger.error('Error getting sublocality', error);
		return sublocality || '';
	}
}

// Obtener usuario de Firebase por número de teléfono
async function getUserByPhoneNumber(phoneNumber: string) {
	try {
		const usersRef = collection(db, 'users');
		const q = query(usersRef, where('phone_number', '==', phoneNumber));
		const querySnapshot = await getDocs(q);

		if (!querySnapshot.empty) {
			const userDoc = querySnapshot.docs[0];
			return { ...userDoc.data(), uid: userDoc.id };
		}
		return null;
	} catch (error) {
		logger.error('Error getting user by phone', error);
		return null;
	}
}

// Obtener referencia de usuario
function getUserRef(userId: string) {
	return doc(db, 'users', userId);
}

export async function POST(request: NextRequest) {
	try {
		const body: ConfirmLocationRequest = await request.json();
		const { token, coordinates, addressComponents, formattedAddress } = body;

		if (!token) {
			return NextResponse.json({ error: 'Token es requerido' }, { status: 400 });
		}

		if (!coordinates || coordinates.lat === 0 || coordinates.lng === 0) {
			return NextResponse.json({ error: 'Coordenadas inválidas' }, { status: 400 });
		}

		logger.info('Confirmando ubicación de oferta', { token, coordinates });

		const dbName = env.mongo.gga.users || 'gu2';

		// 1. Buscar usuario por lead_id (token)
		const users = (await mongoClient.find('users', { lead_id: token }, dbName)) as any[];

		if (!users || users.length === 0) {
			return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
		}

		const user = users[0];

		if (!user.current_offer_id) {
			return NextResponse.json({ error: 'No hay oferta activa para este usuario' }, { status: 400 });
		}

		// 2. Buscar la oferta en MongoDB
		const offers = (await mongoClient.find('offers', { offer_id: user.current_offer_id }, dbName)) as any[];

		if (!offers || offers.length === 0) {
			return NextResponse.json({ error: 'Oferta no encontrada' }, { status: 404 });
		}

		const offer = offers[0];

		// 3. Obtener colonia correcta basada en código postal
		const colony = await getSublocalityByPostalCode(
			addressComponents.state || '',
			addressComponents.postalCode || '',
			addressComponents.sublocality || ''
		);

		// 4. Obtener tipo de cambio
		const guDbName = env.mongo.gu.properties || 'gu';
		const exchange = (await mongoClient.findOne('exchange_rates', { base: 'usd' }, guDbName)) as any;

		// 5. Crear monetizaciones
		const monetizations: Monetization[] = [];

		if (offer.type_operation && Array.isArray(offer.type_operation)) {
			offer.type_operation.forEach((operation: string, index: number) => {
				let mxnPrice = offer.price?.[index] || 0;

				if (offer.currency === 'USD' && exchange?.rate) {
					mxnPrice = exchange.rate * (offer.price?.[index] || 0);
				}

				const monetization: Monetization = {
					price: offer.price?.[index] || 0,
					currency: offer.currency || 'MXN',
					mantain_cost: offer.mantain_cost || 0,
					monetization_type: operation,
					mxn_price: mxnPrice,
					comission_conditions: '',
					share_commission: true,
				};

				if (offer.percentage && offer.percentage !== 0) {
					monetization.percentage = offer.percentage;
				}
				if (offer.months && offer.months !== 0) {
					monetization.months = offer.months;
				}

				monetizations.push(monetization);
			});
		}

		if (monetizations.length === 0) {
			return NextResponse.json({ error: 'No se pudieron crear las monetizaciones' }, { status: 400 });
		}

		// 6. Obtener usuario de Firebase
		const userFirebase = await getUserByPhoneNumber(user.phone_number);

		if (!userFirebase) {
			return NextResponse.json({ error: 'Usuario de Firebase no encontrado' }, { status: 404 });
		}

		// 7. Preparar displays
		const priceDisplay = monetizations.map((m) => `$ ${m.mxn_price.toLocaleString()}`).join(' / ');

		let commissionDisplay = offer.percentage ? offer.percentage.toString() : '';
		commissionDisplay += offer.months ? ` / ${offer.months}` : '';

		const sharedCommissionDisplay = offer.percentage || offer.months ? 'Si' : 'Sin información';

		const commissionTypes: number[] = [];
		if (offer.percentage) commissionTypes.push(offer.percentage);
		if (offer.months) commissionTypes.push(offer.months);

		// 8. Crear documento de propiedad en Firebase
		const propertyData = {
			ad_status: 'Borrador',
			address: formattedAddress,
			amenities: [],
			apartment_number: '',
			bathroom: offer.bathroom || 0,
			bedroom: offer.bedroom || 0,
			city: addressComponents.city || '',
			commission_display: commissionDisplay,
			commission_types: commissionTypes,
			construction_area: offer.construction_area || 0,
			country: addressComponents.country || '',
			created_time: Timestamp.now(),
			currency_display: (offer.currency || 'MXN').trim(),
			currency_types: [(offer.currency || 'MXN').trim()],
			custom_amenities: [],
			description: offer.description || '',
			ext_number: addressComponents.streetNumber || '',
			half_bathroom: offer.half_bathroom || 0,
			house_type: offer.type_property || '',
			land_area: offer.land_area || 0,
			lat_lng: new GeoPoint(coordinates.lat, coordinates.lng),
			monetization_type_display: offer.type_operation?.[0] || '',
			monetizations_types: offer.type_operation || [],
			parking_lot: offer.parking_lot || 0,
			parking_lot_roofed: false,
			pictures: offer.images?.length
				? offer.images
				: [
						'https://storage.googleapis.com/flutterflow-io-6f20.appspot.com/projects/ungga-f-b-b8a1go/assets/b3m50k0ei0w7/kisspng-vector-graphics-computer-icons-transparency-portab-lo-5c4df88675d804.6272821215486137664827.png',
					],
			portals_names: [],
			price_display: priceDisplay,
			prices_types: offer.price || [],
			shared_commission_display: sharedCommissionDisplay,
			state: addressComponents.state || '',
			street: addressComponents.streetName || '',
			suburb: colony,
			terrain_length: offer.terrain_length || 0,
			terrain_shape: '',
			terrain_units: offer.terrain_units || 'M2',
			terrain_width: offer.terrain_width || 0,
			title: offer.title_of_offer || '',
			updated_at: Timestamp.now(),
			user_owner: getUserRef(userFirebase.uid),
			zip_code: addressComponents.postalCode || '',
			gga: true,
			price_type: offer.price_type || 'total',
		};

		// Crear propiedad en Firebase
		const propertiesRef = collection(db, 'properties');
		const docRef = await addDoc(propertiesRef, propertyData);

		// Crear subcolección de monetizaciones
		const monetizationsRef = collection(docRef, 'prop_monetizations');
		for (const monetization of monetizations) {
			await addDoc(monetizationsRef, monetization);
		}

		// 9. Actualizar oferta en MongoDB con el property_id
		await mongoClient.updateOne('offers', { offer_id: offer.offer_id }, { $set: { property_id: docRef.id } }, dbName);

		// 10. Actualizar chat con mensaje de confirmación
		await mongoClient.updateOne(
			'chats',
			{ phone_number: user.phone_number },
			{
				$push: {
					messages: {
						user: '¿Se terminó de cargar mi ofrecimiento?',
						offer_manager: `Si, ya hemos cargado completamente tu ofrecimiento, este es el resumen:
              type_property: ${offer.type_property}
              type_operation: ${offer.type_operation}
              price: ${priceDisplay}
              address: ${formattedAddress}
              bathroom: ${offer.bathroom}
              bedroom: ${offer.bedroom}
              parking_lot: ${offer.parking_lot}
            `,
						timestamp: new Date().toISOString(),
					},
				},
			},
			dbName
		);

		// 11. Limpiar current_offer_id del usuario
		await mongoClient.updateOne('users', { lead_id: token }, { $set: { current_offer_id: null } }, dbName);

		// 12. Enviar notificación por WhatsApp (opcional, descomentar si se necesita)
		// await sendOfferNotification(...)

		const editLink = env.properties.editLink || '';
		const publicLink = env.properties.publicLink || '';

		return NextResponse.json({
			success: true,
			propertyId: docRef.id,
			editLink: `${editLink}${docRef.id}`,
			publicLink: `${publicLink}${docRef.id}`,
			message: 'Ofrecimiento cargado exitosamente',
		});
	} catch (error) {
		logger.error('Error confirmando ubicación', error);
		return NextResponse.json({ error: 'Error al procesar la solicitud' }, { status: 500 });
	}
}
