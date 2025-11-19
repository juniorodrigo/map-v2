'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { UserInfo } from '@/service/mongo/user';
import { OwnerSettings } from '@/service/firebase/owner';

interface SessionData {
	token: string | null;
	userId?: string;
	userEmail?: string;
	isAuthenticated: boolean;
	userInfo: UserInfo | null;
	ownerSettings: OwnerSettings | null;
	searchType?: 'marketmeet' | 'end-user';
	searchSubType?: 'similar-roperties' | 'owner-properties';
}

interface SessionContextType {
	session: SessionData;
	isLoading: boolean;
	error: string | null;
	validateToken: (token: string) => Promise<boolean>;
	clearSession: () => void;
}

const SessionContext = createContext<SessionContextType | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
	const searchParams = useSearchParams();
	const router = useRouter();
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
		async (token: string): Promise<boolean> => {
			setIsLoading(true);
			setError(null);

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

					setSession({
						token,
						isAuthenticated: true,
						userId: data.userInfo._id,
						userEmail: data.userInfo.phone_number,
						userInfo: data.userInfo,
						ownerSettings: data.ownerSettings,
					});

					return true;
				} else {
					throw new Error(data.error || 'Token inválido');
				}
			} catch (err) {
				console.error('❌ Error validando token:', err);
				setError(err instanceof Error ? err.message : 'Error desconocido');
				setSession({
					token: null,
					isAuthenticated: false,
					userInfo: null,
					ownerSettings: null,
				});
				// Redirigir a 404 en caso de error
				router.push('/not-found');
				return false;
			} finally {
				setIsLoading(false);
				setValidationAttempted(true);
				console.log('=============================================');
			}
		},
		[router]
	);

	const clearSession = useCallback(() => {
		console.log('🔴 Limpiando sesión');
		setSession({
			token: null,
			isAuthenticated: false,
			userInfo: null,
			ownerSettings: null,
		});
		setError(null);
	}, []);

	// Efecto principal para validar token
	useEffect(() => {
		const tokenFromUrl = searchParams.get('token');

		const processToken = async () => {
			if (tokenFromUrl && tokenFromUrl !== session.token) {
				console.log('🔍 Token detectado en URL, validando...');
				await validateToken(tokenFromUrl);
			} else if (!tokenFromUrl) {
				// No hay token, redirigir a 404
				console.error('❌ No se encontró token en la URL');
				router.push('/not-found');
				setIsLoading(false);
				setValidationAttempted(true);
			} else {
				// Token ya validado previamente
				setIsLoading(false);
				setValidationAttempted(true);
			}
		};

		processToken();
	}, [searchParams, validateToken, session.token, router]);

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
