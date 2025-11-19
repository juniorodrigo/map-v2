'use client';

import MapLayout from '@/components/layout/MapLayoutGu';
import { useSession } from '@/contexts/SessionProvider';
import { notFound } from 'next/navigation';
import { useEffect } from 'react';

export default function GuPage() {
	const { session, isLoading } = useSession();

	// Redirigir a 404 si no está autenticado después de cargar
	useEffect(() => {
		if (!isLoading && !session.isAuthenticated) {
			notFound();
		}
	}, [isLoading, session.isAuthenticated]);

	if (isLoading) {
		return (
			<div className="flex items-center justify-center h-screen">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
					<p>Validando sesión...</p>
				</div>
			</div>
		);
	}

	if (!session.isAuthenticated) {
		return null;
	}

	return <MapLayout />;
}
