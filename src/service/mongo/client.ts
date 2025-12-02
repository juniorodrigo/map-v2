import { DatabaseError } from '@/lib/errors';

const EXCLUDE_FIELDS = ['vector'];

interface MongoRequestBody {
	database: string;
	collection: string;
	filters?: Record<string, unknown>;
	update?: Record<string, unknown>;
	document?: Record<string, unknown>;
	pipeline?: Record<string, unknown>;
	excludeFields?: string[];
	limit?: number;
	skip?: number;
	upsert?: boolean;
}

interface MongoResponse {
	document?: unknown;
	documents?: unknown[];
	count?: number;
}

export class MongoClient {
	private backendHost: string;

	constructor(backendHost: string) {
		this.backendHost = backendHost;
	}

	private async request<T = MongoResponse>(endpoint: string, body: MongoRequestBody): Promise<T> {
		try {
			const response = await fetch(`${this.backendHost}${endpoint}`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(body),
			});

			if (!response.ok) {
				throw new DatabaseError(`Error en request MongoDB: ${response.statusText}`, {
					status: response.status,
					endpoint,
				});
			}

			const data = await response.json();

			return data as T;
		} catch (error) {
			throw error instanceof DatabaseError ? error : new DatabaseError('Error al comunicarse con MongoDB', { error });
		}
	}

	async findOne(collection: string, filters: Record<string, unknown>, dbName: string): Promise<unknown> {
		const response = await this.request('/mongo/findOne', {
			database: dbName,
			collection,
			filters,
			excludeFields: EXCLUDE_FIELDS,
		});

		return response.document;
	}

	async count(collection: string, filters: Record<string, unknown>, dbName: string): Promise<number> {
		const requestBody = {
			database: dbName,
			collection,
			filters,
		};

		const response = await this.request<{ count: number }>('/mongo/count', requestBody);

		return response.count;
	}

	async find(
		collection: string,
		filters: Record<string, unknown>,
		dbName: string,
		options?: { limit?: number; skip?: number }
	): Promise<unknown[]> {
		const totalCount = await this.count(collection, filters, dbName);

		if (totalCount <= 1000) {
			const requestBody = {
				database: dbName,
				collection,
				filters,
				excludeFields: EXCLUDE_FIELDS,
				limit: options?.limit || 1000,
				skip: options?.skip || 0,
			};

			const response = await this.request('/mongo/find', requestBody);

			return response.documents || [];
		}

		const BATCH_SIZE = 1000;
		const totalBatches = Math.ceil(totalCount / BATCH_SIZE);
		let allDocuments: unknown[] = [];

		for (let i = 0; i < totalBatches; i++) {
			const skip = i * BATCH_SIZE;

			const requestBody = {
				database: dbName,
				collection,
				filters,
				excludeFields: EXCLUDE_FIELDS,
				limit: BATCH_SIZE,
				skip,
			};

			const response = await this.request('/mongo/find', requestBody);

			const documents = response.documents || [];
			allDocuments = allDocuments.concat(documents);
		}
		return allDocuments;
	}

	async updateOne(
		collection: string,
		filters: Record<string, unknown>,
		update: Record<string, unknown>,
		dbName: string,
		upsert: boolean = true
	): Promise<unknown> {
		const response = await this.request('/mongo/updateOne', {
			database: dbName,
			collection,
			filters,
			update,
			upsert,
			excludeFields: EXCLUDE_FIELDS,
		});

		return response;
	}

	async insertOne(collection: string, document: Record<string, unknown>, dbName: string): Promise<unknown> {
		const response = await this.request('/mongo/insertOne', {
			database: dbName,
			collection,
			document,
			excludeFields: EXCLUDE_FIELDS,
		});

		return response.document;
	}

	async geoNear(collection: string, pipeline: Record<string, unknown>, dbName: string): Promise<unknown[]> {
		const response = await this.request('/mongo/geoNear', {
			database: dbName,
			collection,
			pipeline,
			excludeFields: EXCLUDE_FIELDS,
		});

		return response.documents || [];
	}
}

export function createMongoClient(backendHost: string) {
	return new MongoClient(backendHost);
}

let _mongoClient: MongoClient | null = null;

export function getMongoClient(): MongoClient {
	if (!_mongoClient) {
		// Solo se ejecuta en server-side
		const { env } = require('@/config/env');
		_mongoClient = new MongoClient(env.backend.host || '');
	}
	return _mongoClient;
}

// Para compatibilidad con código existente
export const mongoClient = {
	get findOne() {
		return getMongoClient().findOne.bind(getMongoClient());
	},
	get find() {
		return getMongoClient().find.bind(getMongoClient());
	},
	get count() {
		return getMongoClient().count.bind(getMongoClient());
	},
	get updateOne() {
		return getMongoClient().updateOne.bind(getMongoClient());
	},
	get insertOne() {
		return getMongoClient().insertOne.bind(getMongoClient());
	},
	get geoNear() {
		return getMongoClient().geoNear.bind(getMongoClient());
	},
};
