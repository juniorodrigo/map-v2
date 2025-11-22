import { useQuery } from '@tanstack/react-query';
import { useDatabase } from '@/contexts/DatabaseContext';
import type { PropertyFilters, PropertySearchResponse } from '@/types/property';
import type { SessionData } from '@/contexts/SessionProvider';

interface UsePropertySearchParams {
	filters: PropertyFilters;
	enabled?: boolean;
	sessionData?: SessionData;
}

export function usePropertySearch({ filters, enabled = true, sessionData }: UsePropertySearchParams) {
	const { database } = useDatabase();
	return useQuery({
		queryKey: ['properties', 'search', database, filters, sessionData],
		queryFn: async () => {
			const requestBody = {
				filters,
				dbName: database,
				sessionData,
			};

			const response = await fetch('/api/properties/search', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(requestBody),
			});

			if (!response.ok) {
				throw new Error('Error al buscar propiedades');
			}

			const data: PropertySearchResponse = await response.json();

			if (!data.success) {
				throw new Error(data.error || 'Error desconocido');
			}

			return data.data;
		},
		enabled,
		staleTime: 1000 * 60 * 5,
		gcTime: 1000 * 60 * 10,
	});
}

interface UseOwnerPropertiesParams {
	ownerId: string;
	enabled?: boolean;
}

export function useOwnerProperties({ ownerId, enabled = true }: UseOwnerPropertiesParams) {
	const { database } = useDatabase();

	return useQuery({
		queryKey: ['properties', 'owner', database, ownerId],
		queryFn: async () => {
			const response = await fetch(`/api/properties/owner?ownerId=${ownerId}&dbName=${database}`);

			if (!response.ok) {
				throw new Error('Error al obtener propiedades del propietario');
			}

			const data = await response.json();

			if (!data.success) {
				throw new Error(data.error || 'Error desconocido');
			}

			return data.data;
		},
		enabled: enabled && !!ownerId,
		staleTime: 1000 * 60 * 5,
		gcTime: 1000 * 60 * 10,
	});
}
