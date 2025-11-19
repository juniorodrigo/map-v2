import { env } from '@/config/env';
import { logger } from '@/lib/logger';

export const firebaseAdminConfig = {
	databaseURL: env.firebaseAdmin.databaseURL,
};

logger.info('Firebase Admin config cargado', { databaseURL: firebaseAdminConfig.databaseURL });
