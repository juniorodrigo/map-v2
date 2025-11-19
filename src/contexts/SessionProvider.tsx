'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { UserInfo } from '@/service/mongo/user';
import { OwnerSettings } from '@/service/firebase/owner';

export interface SessionData {
	token: string | null;
	userId?: string;
	userEmail?: string;
	isAuthenticated: boolean;
	userInfo: UserInfo | null;
	ownerSettings: OwnerSettings | null;
	searchType?: 'marketmeet' | 'end-user';
	searchSubType?: 'similar-properties' | 'owner-properties' | 'normal-search';
}

interface SessionContextType {
	session: SessionData;
	isLoading: boolean;
	error: string | null;
	validateToken: (token: string) => Promise<{ success: boolean; data?: any; error?: string }>;
	clearSession: () => void;
}

const SessionContext = createContext<SessionContextType | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
	const searchParams = useSearchParams();
	const router = useRouter();
	const pathname = usePathname();
	const [session, setSession] = useState<SessionData>({
		token: null,
		isAuthenticated: false,
		userInfo: null,
		ownerSettings: null,
	});
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [validationAttempted, setValidationAttempted] = useState(false);

	const validateToken = useCallback(
		async (token: string): Promise<{ success: boolean; data?: any; error?: string }> => {
			try {
				if (!token || token.trim() === '') {
					throw new Error('Token vacío o inválido');
				}

				const response = await fetch('/api/mongo/process-token', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({ token }),
				});

				if (!response.ok) {
					throw new Error(`HTTP error! status: ${response.status}`);
				}

				const data = await response.json();

				if (data.success) {
					// Validar que userInfo y ownerSettings existan
					if (!data.userInfo || !data.ownerSettings) {
						console.error('❌ Datos incompletos: userInfo o ownerSettings no existen');
						throw new Error('Datos de usuario incompletos');
					}

					return { success: true, data };
				} else {
					throw new Error(data.error || 'Token inválido');
				}
			} catch (err) {
				console.error('❌ Error validando token:', err);
				return { success: false, error: err instanceof Error ? err.message : 'Error desconocido' };
			}
		},
		[]
	);

	const clearSession = useCallback(() => {
		console.log('🔴 Limpiando sesión');
		setSession((prev) => ({
			...prev,
			token: null,
			isAuthenticated: false,
			userInfo: null,
			ownerSettings: null,
		}));
		setError(null);
	}, []);

	// Efecto principal para manejar search params y token
	useEffect(() => {
		const tokenFromUrl = searchParams.get('token');
		const searchParam = searchParams.get('search');
		const firstPathSegment = pathname.split('/')[1];

		let searchType: 'marketmeet' | 'end-user' | undefined;
		let searchSubType: 'similar-properties' | 'owner-properties' | 'normal-search' | undefined;

		// Detectar searchType basado en el path
		if (firstPathSegment === 'marketmeet') {
			searchType = 'marketmeet';
		} else if (firstPathSegment === 'gu') {
			searchType = 'end-user';
		}

		// Detectar searchSubType basado en query parameter
		if (searchParam === 'similar') {
			searchSubType = 'similar-properties';
		} else if (searchParam === 'owner') {
			searchSubType = 'owner-properties';
		} else {
			searchSubType = 'normal-search';
		}

		const processSession = async () => {
			setIsLoading(true);
			setError(null);

			if (tokenFromUrl && tokenFromUrl !== session.token) {
				console.log('🔍 Token detectado en URL, validando...');
				const result = await validateToken(tokenFromUrl);

				if (result.success && result.data) {
					setSession({
						token: tokenFromUrl,
						isAuthenticated: true,
						userId: result.data.userInfo._id,
						userEmail: result.data.userInfo.phone_number,
						userInfo: result.data.userInfo,
						ownerSettings: result.data.ownerSettings,
						searchType,
						searchSubType,
					});
				} else {
					setError(result.error || 'Error desconocido');
					setSession({
						token: null,
						isAuthenticated: false,
						userInfo: null,
						ownerSettings: null,
						searchType,
						searchSubType,
					});
					// Redirigir a 404 en caso de error
					router.push('/not-found');
				}
			} else if (!tokenFromUrl) {
				// No hay token, setear solo search
				console.error('❌ No se encontró token en la URL');
				setSession((prev) => ({
					...prev,
					searchType,
					searchSubType,
					isAuthenticated: false,
					userInfo: null,
					ownerSettings: null,
				}));
				router.push('/not-found');
			} else {
				// Token ya validado, solo actualizar search
				setSession((prev) => ({
					...prev,
					searchType,
					searchSubType,
				}));
			}

			setIsLoading(false);
			setValidationAttempted(true);
		};

		processSession();
	}, [pathname, searchParams, session.token, validateToken, router]);

	// Log del sessionData para evaluación
	// useEffect(() => {
	// 	console.log('📊 SessionData actualizado:', session);
	// }, [session]);

	const value = React.useMemo(
		() => ({
			session,
			isLoading,
			error,
			validateToken,
			clearSession,
		}),
		[session, isLoading, error, validateToken, clearSession]
	);
	return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
	const context = useContext(SessionContext);
	if (!context) {
		throw new Error('useSession must be used within a SessionProvider');
	}
	return context;
}
