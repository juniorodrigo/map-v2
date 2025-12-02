'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { OwnerSettings } from '@/service/firebase/owner';
import { UserInfo } from '@/service/mongo/user';
import { env } from '@/config/env';

// Types ---------------------------
type SearchType = 'marketmeet' | 'end-user';
type MarketmeetSearchSubtypes = 'default';
type GuSearchSubtypes = 'similar-properties' | 'default' | 'shared-comission';
type DatabasesToSearch = 'gu2' | 'gga' | 'bot';

export interface SessionData {
	token: string | null;
	userId?: string;
	userEmail?: string;
	isAuthenticated: boolean;
	userInfo: UserInfo | null;
	ownerSettings: OwnerSettings | null;
	searchType?: SearchType;
	searchSubtype?: MarketmeetSearchSubtypes | GuSearchSubtypes;
	propertiesDb?: DatabasesToSearch;
	usersDb?: DatabasesToSearch;
}

interface SessionContextType {
	session: SessionData;
	isLoading: boolean;
	error: string | null;
	validateToken: (
		token: string,
		searchType: SearchType,
		usersDb?: DatabasesToSearch
	) => Promise<{ success: boolean; data?: any; error?: string }>;
}

interface ParsedSearchParams {
	tokenFromUrl: string | null;
	searchType: SearchType;
	searchSubtype: MarketmeetSearchSubtypes | GuSearchSubtypes;
	isValidUrl: boolean;
	propertiesDb?: DatabasesToSearch;
	usersDb?: DatabasesToSearch;
}

// Constants -------------------------
const INITIAL_SESSION_STATE: SessionData = {
	token: null,
	isAuthenticated: false,
	userInfo: null,
	ownerSettings: null,
};

const SessionContext = createContext<SessionContextType | null>(null);

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
			usersDb?: DatabasesToSearch
		): Promise<{ success: boolean; data?: any; error?: string }> => {
			try {
				if (!token?.trim()) throw new Error('Token vacío o inválido');

				const response = await fetch('/api/mongo/process-token', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ token, database: usersDb ?? 'guaaaaaaaaaa' }),
				});

				if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

				const data = await response.json();

				// console.log('🔍 Token validation response data:', data);

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

		const propertiesDb: DatabasesToSearch | undefined =
			searchType === 'marketmeet'
				? (env.mongo.gga.properties as DatabasesToSearch)
				: searchType === 'end-user'
					? (env.mongo.gu.properties as DatabasesToSearch)
					: undefined;

		const usersDb: DatabasesToSearch | undefined =
			searchType === 'marketmeet'
				? (env.mongo.gga.users as DatabasesToSearch)
				: searchType === 'end-user'
					? (env.mongo.gu.users as DatabasesToSearch)
					: undefined;

		return { tokenFromUrl, searchType, searchSubtype, isValidUrl, propertiesDb, usersDb };
	}, [searchParams, pathname]);

	useEffect(() => {
		if (pathname === '/not-found') {
			setIsLoading(false);
			return;
		}

		const { tokenFromUrl, searchType, searchSubtype, isValidUrl, propertiesDb, usersDb } = parsedSearchParams;

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
				const result = await validateToken(tokenFromUrl, searchType, usersDb);

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
						propertiesDb,
						usersDb,
					});
				} else {
					setError(result.error || 'Error desconocido');
					setSession({
						...INITIAL_SESSION_STATE,
						searchType,
						searchSubtype,
						propertiesDb,
						usersDb,
					});
					router.push('/not-found');
				}
			} else if (!tokenFromUrl) {
				setSession((prev) => ({
					...prev,
					...INITIAL_SESSION_STATE,
					searchType,
					searchSubtype,
					propertiesDb,
					usersDb,
				}));
				router.push('/not-found');
			}
			// Update search parameters if changed
			else if (session.searchType !== searchType || session.searchSubtype !== searchSubtype) {
				setSession((prev) => ({
					...prev,
					searchType,
					searchSubtype,
					propertiesDb,
					usersDb,
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
