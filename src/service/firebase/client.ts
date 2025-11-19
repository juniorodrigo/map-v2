import { getApps, initializeApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore, getDoc, doc, DocumentReference } from 'firebase/firestore';
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

	getUserRef(userId: string): DocumentReference {
		return doc(this.db, 'users', userId);
	}

	getPropertyRef(propertyId: string): DocumentReference {
		return doc(this.db, 'properties', propertyId);
	}
}

export const firebaseClient = new FirebaseClient();
