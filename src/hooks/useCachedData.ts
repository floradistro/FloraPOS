import { useQuery } from '@tanstack/react-query';
import { CategoriesService } from '../services/categories-service';
import { Category } from '../components/ui/CategoryFilter';
import { apiFetch } from '../lib/api-fetch';

/**
 * Hook for caching categories data with long stale time
 * Categories rarely change so we can cache them longer
 */
const isDevelopment = process.env.NODE_ENV === 'development';

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => CategoriesService.getCategories(),
    staleTime: isDevelopment ? 0 : 1000 * 60 * 120, // No cache in dev
    gcTime: isDevelopment ? 0 : 1000 * 60 * 30, // No cache in dev
    refetchOnWindowFocus: isDevelopment ? true : false, // Always refetch in dev
    retry: isDevelopment ? 0 : 1,
    refetchInterval: isDevelopment ? false : 1000 * 60 * 10, // No background refetch in dev
  });
}

/**
 * Hook for caching user location data
 * Location data changes infrequently
 */
export function useUserLocations() {
  return useQuery({
    queryKey: ['user-locations'],
    queryFn: async () => {
      try {
        const response = await apiFetch('/api/proxy/flora-im/locations', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': isDevelopment ? 'no-cache, no-store, must-revalidate' : 'public, max-age=600',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch locations');
        }

        const data = await response.json();
        return data.success ? data.data : [];
      } catch (error) {
        console.error('Error fetching locations:', error);
        return [];
      }
    },
    staleTime: isDevelopment ? 0 : 1000 * 60 * 240, // No cache in dev
    gcTime: isDevelopment ? 0 : 1000 * 60 * 120, // No cache in dev
    refetchOnWindowFocus: isDevelopment ? true : false, // Always refetch in dev
    retry: isDevelopment ? 0 : 1,
    refetchInterval: isDevelopment ? false : 1000 * 60 * 30, // No background refetch in dev
  });
}

/**
 * Hook for caching tax rates
 * Tax rates change very infrequently
 */
export function useTaxRates() {
  return useQuery({
    queryKey: ['tax-rates'],
    queryFn: async () => {
      try {
        const response = await apiFetch('/api/proxy/flora-im/taxes', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': isDevelopment ? 'no-cache, no-store, must-revalidate' : 'public, max-age=3600',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch tax rates');
        }

        const data = await response.json();
        return data.success ? data.data : [];
      } catch (error) {
        console.error('Error fetching tax rates:', error);
        return [];
      }
    },
    staleTime: isDevelopment ? 0 : 1000 * 60 * 60 * 24, // No cache in dev
    gcTime: isDevelopment ? 0 : 1000 * 60 * 60 * 4, // No cache in dev
    refetchOnWindowFocus: isDevelopment ? true : false, // Always refetch in dev
    retry: isDevelopment ? 0 : 1,
    refetchInterval: isDevelopment ? false : 1000 * 60 * 60, // No background refetch in dev
  });
}

/**
 * Hook for caching blueprint pricing assignments
 * Blueprint assignments change occasionally
 */
export function useBlueprintAssignments() {
  return useQuery({
    queryKey: ['blueprint-assignments'],
    queryFn: async () => {
      try {
        const response = await apiFetch('/api/pricing/rules/blueprint', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': isDevelopment ? 'no-cache, no-store, must-revalidate' : 'public, max-age=300',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch blueprint assignments');
        }

        const data = await response.json();
        return data;
      } catch (error) {
        console.error('Error fetching blueprint assignments:', error);
        return { assignments: [] };
      }
    },
    staleTime: isDevelopment ? 0 : 1000 * 60 * 30, // No cache in dev
    gcTime: isDevelopment ? 0 : 1000 * 60 * 15, // No cache in dev
    refetchOnWindowFocus: isDevelopment ? true : false, // Always refetch in dev
    retry: isDevelopment ? 0 : 1,
    refetchInterval: isDevelopment ? false : 1000 * 60 * 5, // No background refetch in dev
  });
}
