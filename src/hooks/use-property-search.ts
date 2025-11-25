import { useQuery } from '@tanstack/react-query';
import type { PropertyFilters, PropertySearchResponse } from '@/types/property';
import { useSession } from '@/contexts/SessionProvider';

interface UsePropertySearchParams {
	filters: PropertyFilters;
	enabled?: boolean;
}

export function usePropertySearch({ filters, enabled = true }: UsePropertySearchParams) {
	const { session } = useSession();

	return useQuery({
		queryKey: ['properties', 'search', filters],
		queryFn: async () => {
			const requestBody = {
				filters,
				dbName: session.databaseToSearch,
				ownerSettings: session.ownerSettings || {},
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
