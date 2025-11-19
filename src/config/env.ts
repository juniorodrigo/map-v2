import { z } from 'zod';

const envSchema = z.object({
	NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

	NEXT_PUBLIC_GOOGLE_MAPS_API_KEY_GGA: z.string(),
	NEXT_PUBLIC_GOOGLE_MAPS_API_KEY_GU: z.string(),

	NEXT_PUBLIC_FIREBASE_API_KEY: z.string(),
	NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string(),
	NEXT_PUBLIC_FIREBASE_PROJECT_ID: z.string(),
	NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: z.string(),
	NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: z.string(),
	NEXT_PUBLIC_FIREBASE_APP_ID: z.string(),
	NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: z.string().optional(),

	FIREBASE_DATABASE_URL: z.string().optional(),

	MONGO_DB_NAME_GGA: z.string().optional(),
	MONGO_DB_NAME_GU: z.string().optional(),
	MONGO_DB_NAME_GU2: z.string().optional(),

	AWS_REGION: z.string().optional(),
	AWS_ACCESS_KEY_ID: z.string().optional(),
	AWS_SECRET_ACCESS_KEY: z.string().optional(),
	AWS_QUEUE_URL: z.string().url().optional(),

	BACKEND_HOST: z.string().url().optional(),

	BOT_NUMBER: z.string().optional(),

	PROPERTY_PUBLIC_LINK: z.string().url().optional(),
	PROPERTY_LINK_EDIT: z.string().url().optional(),

	BLACKLIST: z.string(),
});

const _env = envSchema.parse({
	NODE_ENV: process.env.NODE_ENV,

	NEXT_PUBLIC_GOOGLE_MAPS_API_KEY_GGA: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY_GGA,
	NEXT_PUBLIC_GOOGLE_MAPS_API_KEY_GU: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY_GU,
	NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
	NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
	NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
	NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
	NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
	NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
	NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,

	FIREBASE_DATABASE_URL: process.env.FIREBASE_DATABASE_URL,

	MONGO_DB_NAME_GGA: process.env.MONGO_DB_NAME_GGA,
	MONGO_DB_NAME_GU: process.env.MONGO_DB_NAME_GU,
	MONGO_DB_NAME_GU2: process.env.MONGO_DB_NAME_GU2,

	AWS_REGION: process.env.AWS_REGION,
	AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
	AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
	AWS_QUEUE_URL: process.env.AWS_QUEUE_URL,
	BACKEND_HOST: process.env.BACKEND_HOST,
	BOT_NUMBER: process.env.BOT_NUMBER,
	PROPERTY_PUBLIC_LINK: process.env.PROPERTY_PUBLIC_LINK,
	PROPERTY_LINK_EDIT: process.env.PROPERTY_LINK_EDIT,
	BLACKLIST: process.env.BLACKLIST || '',
});

export const env = {
	nodeEnv: _env.NODE_ENV,

	googleMaps: {
		apiKeyGGA: _env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY_GGA,
		apiKeyGU: _env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY_GU,
	},

	firebaseClient: {
		apiKey: _env.NEXT_PUBLIC_FIREBASE_API_KEY,
		authDomain: _env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
		projectId: _env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
		storageBucket: _env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
		messagingSenderId: _env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
		appId: _env.NEXT_PUBLIC_FIREBASE_APP_ID,
		measurementId: _env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
	},

	firebaseAdmin: {
		databaseURL: _env.FIREBASE_DATABASE_URL,
	},

	mongo: {
		databases: {
			gga: _env.MONGO_DB_NAME_GGA,
			gu: _env.MONGO_DB_NAME_GU,
			gu2: _env.MONGO_DB_NAME_GU2,
		},
	},

	aws: {
		region: _env.AWS_REGION,
		accessKeyId: _env.AWS_ACCESS_KEY_ID,
		secretAccessKey: _env.AWS_SECRET_ACCESS_KEY,
		queueUrl: _env.AWS_QUEUE_URL,
	},

	backend: {
		host: _env.BACKEND_HOST,
	},

	whatsapp: {
		botNumber: _env.BOT_NUMBER,
	},

	properties: {
		publicLink: _env.PROPERTY_PUBLIC_LINK,
		editLink: _env.PROPERTY_LINK_EDIT,
	},

	blacklist: _env.BLACKLIST.split(','),
};
