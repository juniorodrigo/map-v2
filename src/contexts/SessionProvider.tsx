'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { OwnerSettings } from '@/service/firebase/owner';
import { UserInfo } from '@/service/mongo/user';

// Types
type SearchType = 'marketmeet' | 'end-user';
type MarketmeetSearchSubtypes = 'default';
type GuSearchSubtypes = 'similar-properties' | 'default' | 'shared-comission';
type DatabasesToSearch = 'gu2' | 'gga';

export interface SessionData {
	token: string | null;
	userId?: string;
	userEmail?: string;
	isAuthenticated: boolean;
	userInfo: UserInfo | null;
	ownerSettings: OwnerSettings | null;
	searchType?: SearchType;
	searchSubtype?: MarketmeetSearchSubtypes | GuSearchSubtypes;
	databaseToSearch?: DatabasesToSearch;
}

interface SessionContextType {
	session: SessionData;
	isLoading: boolean;
	error: string | null;
	validateToken: (
		token: string,
		searchType: SearchType,
		databaseToSearch?: DatabasesToSearch
	) => Promise<{ success: boolean; data?: any; error?: string }>;
}

interface ParsedSearchParams {
	tokenFromUrl: string | null;
	searchType: SearchType;
	searchSubtype: MarketmeetSearchSubtypes | GuSearchSubtypes;
	isValidUrl: boolean;
	databaseToSearch?: DatabasesToSearch;
}

// Constants
const INITIAL_SESSION_STATE: SessionData = {
	token: null,
	isAuthenticated: false,
	userInfo: null,
	ownerSettings: null,
};

// Context
const SessionContext = createContext<SessionContextType | null>(null);

// Provider Component
export function SessionProvider({ children }: { children: React.ReactNode }) {
	const searchParams = useSearchParams();
	const router = useRouter();
	const pathname = usePathname();

	const [session, setSession] = useState<SessionData>(INITIAL_SESSION_STATE);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const validateToken = useCallback(
		async (
			token: string,
			searchType: SearchType,
			databaseToSearch?: DatabasesToSearch
		): Promise<{ success: boolean; data?: any; error?: string }> => {
			try {
				if (!token?.trim()) throw new Error('Token vacío o inválido');

				const response = await fetch('/api/mongo/process-token', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ token, database: databaseToSearch }),
				});

				if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

				const data = await response.json();

				if (!data.success) throw new Error(data.error || 'Token inválido');

				if (!data.userInfo || (!data.ownerSettings && searchType === 'end-user'))
					throw new Error('Datos de usuario incompletos');

				return { success: true, data };
			} catch (err) {
				return {
					success: false,
					error: err instanceof Error ? err.message : 'Error desconocido',
				};
			}
		},
		[]
	);

	const parsedSearchParams = useMemo((): ParsedSearchParams => {
		const tokenFromUrl = searchParams.get('token');
		const searchParam = searchParams.get('search');
		const firstPathSegment = pathname.split('/')[1];

		if (pathname === '/not-found') {
			return { tokenFromUrl, isValidUrl: true, searchType: 'end-user', searchSubtype: 'default' };
		}

		let searchType: SearchType = 'end-user';
		let searchSubtype: MarketmeetSearchSubtypes | GuSearchSubtypes = 'default';
		let isValidUrl = true;

		// Determine search type and subtype based on path
		if (firstPathSegment === 'marketmeet') {
			searchType = 'marketmeet';
			searchSubtype = 'default';
		} else if (firstPathSegment === 'gu') {
			searchType = 'end-user';

			if (searchParam === 'similar') {
				searchSubtype = 'similar-properties';
			} else if (searchParam === 'shared') {
				searchSubtype = 'shared-comission';
			} else if (!searchParam) {
				searchSubtype = 'default';
			} else {
				isValidUrl = false;
			}
		} else {
			isValidUrl = false;
		}

		const databaseToSearch: DatabasesToSearch | undefined =
			searchType === 'marketmeet' ? 'gga' : searchType === 'end-user' ? 'gu2' : undefined;

		return { tokenFromUrl, searchType, searchSubtype, isValidUrl, databaseToSearch };
	}, [searchParams, pathname]);

	useEffect(() => {
		if (pathname === '/not-found') {
			setIsLoading(false);
			return;
		}

		console.log('🔍 Parsed Search Params:', parsedSearchParams);

		const { tokenFromUrl, searchType, searchSubtype, isValidUrl, databaseToSearch } = parsedSearchParams;

		const processSession = async () => {
			setIsLoading(true);
			setError(null);

			// Redirect if URL is invalid
			if (!isValidUrl) {
				router.push('/not-found');
				return;
			}

			// Validate new token
			if (tokenFromUrl && tokenFromUrl !== session.token) {
				const result = await validateToken(tokenFromUrl, searchType, databaseToSearch);

				console.log('✅ Token validation result:', result);

				if (result.success && result.data) {
					setSession({
						token: tokenFromUrl,
						isAuthenticated: true,
						userId: result.data.userInfo._id,
						userEmail: result.data.userInfo.phone_number,
						userInfo: result.data.userInfo,
						ownerSettings: result.data.ownerSettings,
						searchType,
						searchSubtype,
						databaseToSearch,
					});
				} else {
					setError(result.error || 'Error desconocido');
					setSession({
						...INITIAL_SESSION_STATE,
						searchType,
						searchSubtype,
						databaseToSearch,
					});
					router.push('/not-found');
				}
			}
			// No token provided
			else if (!tokenFromUrl) {
				setSession((prev) => ({
					...prev,
					...INITIAL_SESSION_STATE,
					searchType,
					searchSubtype,
					databaseToSearch,
				}));
				router.push('/not-found');
			}
			// Update search parameters if changed
			else if (session.searchType !== searchType || session.searchSubtype !== searchSubtype) {
				setSession((prev) => ({
					...prev,
					searchType,
					searchSubtype,
					databaseToSearch,
				}));
			}

			setIsLoading(false);
		};

		processSession();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [parsedSearchParams, validateToken, router]);

	const value = useMemo(
		() => ({
			session,
			isLoading,
			error,
			validateToken,
		}),
		[session, isLoading, error, validateToken]
	);

	return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

// Hook
export function useSession() {
	const context = useContext(SessionContext);
	if (!context) {
		throw new Error('useSession must be used within a SessionProvider');
	}
	return context;
}
