import { getApps, initializeApp, FirebaseApp } from 'firebase/app';
import {
	getFirestore,
	Firestore,
	getDoc,
	doc,
	DocumentReference,
	collection,
	query,
	where,
	getDocs,
} from 'firebase/firestore';
import { env } from '@/config/env';
import type { UserDocument } from './types';

class FirebaseClient {
	private app: FirebaseApp;
	private db: Firestore;

	constructor() {
		if (!getApps().length) {
			this.app = initializeApp(env.firebaseClient);
		} else {
			this.app = getApps()[0];
		}

		this.db = getFirestore(this.app);
	}

	async findUserById(userId: string): Promise<UserDocument | null> {
		try {
			const userDoc = await getDoc(doc(this.db, 'users', userId));

			if (userDoc.exists()) {
				const userData = userDoc.data() as UserDocument;
				if (userData.gu_number) {
					const guDoc = await getDoc(userData.gu_number as DocumentReference);
					if (guDoc.exists()) {
						(userData as any).gu_number_data = guDoc.data();
					}
				} else return null;

				return userData;
			}

			return null;
		} catch (error) {
			return null;
		}
	}

	/**
	 * Busca usuarios cuyo gu_number_data.associations_to_look contenga alguno de los elementos proporcionados
	 * Retorna los IDs de los documentos de usuarios encontrados
	 */
	async findUserIdsByAssociations(associations: string[]): Promise<string[]> {
		try {
			if (!associations || associations.length === 0) return [];

			const guNumbersRef = collection(this.db, 'gu_numbers');
			const userIds: string[] = [];

			// Firestore permite array-contains para buscar un elemento en un array
			// Necesitamos hacer una consulta por cada asociación
			for (const association of associations) {
				const q = query(guNumbersRef, where('associations_to_look', 'array-contains', association));
				const querySnapshot = await getDocs(q);

				for (const docSnapshot of querySnapshot.docs) {
					const guData = docSnapshot.data();
					// El user_owner puede ser una referencia o un string
					if (guData.user_owner) {
						let userId: string;
						if (typeof guData.user_owner === 'string') {
							userId = guData.user_owner;
						} else {
							// Es una DocumentReference
							userId = (guData.user_owner as DocumentReference).id;
						}
						if (!userIds.includes(userId)) {
							userIds.push(userId);
						}
					}
				}
			}

			return userIds;
		} catch (error) {
			console.error('Error finding users by associations:', error);
			return [];
		}
	}

	getUserRef(userId: string): DocumentReference {
		return doc(this.db, 'users', userId);
	}

	getPropertyRef(propertyId: string): DocumentReference {
		return doc(this.db, 'properties', propertyId);
	}
}

export const firebaseClient = new FirebaseClient();
