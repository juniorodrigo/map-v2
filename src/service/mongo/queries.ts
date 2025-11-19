import { mongoClient } from './client';
import type { FindOneParams, FindParams, UpdateOneParams, InsertOneParams, GeoNearParams, CountParams } from './types';

export async function findOne(params: FindOneParams) {
	return mongoClient.findOne(params.collection, params.filter, params.dbName);
}

export async function find(params: FindParams) {
	return mongoClient.find(params.collection, params.filter, params.dbName, { limit: params.limit, skip: params.skip });
}

export async function updateOne(params: UpdateOneParams) {
	return mongoClient.updateOne(params.collection, params.filter, params.update, params.dbName, params.upsert);
}

export async function insertOne(params: InsertOneParams) {
	return mongoClient.insertOne(params.collection, params.document, params.dbName);
}

export async function geoNear(params: GeoNearParams) {
	return mongoClient.geoNear(params.collection, params.pipeline, params.dbName);
}
