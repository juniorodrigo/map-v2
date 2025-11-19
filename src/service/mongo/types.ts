export interface MongoDocument {
	[key: string]: unknown;
}

export interface FindOneParams {
	collection: string;
	filter: Record<string, unknown>;
	dbName?: string;
}

export interface FindParams extends FindOneParams {
	limit?: number;
	skip?: number;
}

export interface UpdateOneParams {
	collection: string;
	filter: Record<string, unknown>;
	update: Record<string, unknown>;
	dbName?: string;
	upsert?: boolean;
}

export interface InsertOneParams {
	collection: string;
	document: MongoDocument;
	dbName?: string;
}

export interface GeoNearParams {
	collection: string;
	pipeline: Record<string, unknown>;
	dbName?: string;
}

export interface CountParams {
	collection: string;
	filter: Record<string, unknown>;
	dbName?: string;
}
