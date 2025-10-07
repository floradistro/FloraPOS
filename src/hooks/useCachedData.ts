import { useQuery } from '@tanstack/react-query';
import { CategoriesService } from '../services/categories-service';
import { Category } from '../components/ui/CategoryFilter';

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
          throw new Error(`Locations API error: ${response.status}`);
        }

        const result = await response.json();
        return result.success ? result.data : [];
      } catch (error) {
        return [];
      }
    },
    staleTime: isDevelopment ? 0 : 1000 * 60 * 240, // No cache in dev
    gcTime: isDevelopment ? 0 : 1000 * 60 * 60, // No cache in dev
    refetchOnWindowFocus: isDevelopment ? true : false,
    retry: isDevelopment ? 0 : 1,
  });
}

/**
 * Hook for caching tax rates by location
 * Tax rates change infrequently
 */
export function useTaxRates(locationName?: string) {
  return useQuery({
    queryKey: ['tax-rates', locationName],
    queryFn: () => {
      // Static tax rate mapping (rarely changes)
      const locationMapping: { [key: string]: { id: number, rate: number, name: string } } = {
        'Charlotte Monroe': { id: 19, rate: 0.0875, name: 'NC Sales Tax + Local' },
        'Charlotte Central': { id: 20, rate: 0.0875, name: 'NC Sales Tax + Local' },
        'Blowing Rock': { id: 21, rate: 0.085, name: 'NC Sales Tax + Local' },
        'Warehouse': { id: 23, rate: 0.08, name: 'NC Sales Tax' },
        'Main Location': { id: 25, rate: 0.08, name: 'Sales Tax' },
        'Default': { id: 25, rate: 0.08, name: 'Sales Tax' }
      };

      return locationMapping[locationName || 'Default'] || locationMapping['Default'];
    },
    staleTime: isDevelopment ? 0 : 1000 * 60 * 60 * 24, // No cache in dev
    gcTime: isDevelopment ? 0 : 1000 * 60 * 60 * 2, // No cache in dev
    refetchOnWindowFocus: isDevelopment ? true : false,
    retry: 0, // No retries needed for static data
    enabled: !!locationName, // Only run if locationName is provided
  });
}

/**
 * Hook for caching blueprint assignments
 * Assignments change infrequently but need to be fresh
 */
export function useBlueprintAssignments() {
  return useQuery({
    queryKey: ['blueprint-assignments'],
    queryFn: async () => {
      try {
        const response = await apiFetch('/api/proxy/blueprints/assignments', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': isDevelopment ? 'no-cache, no-store, must-revalidate' : 'public, max-age=300',
          },
        });

        if (!response.ok) {
          throw new Error(`Blueprint assignments API error: ${response.status}`);
        }

        const result = await response.json();
        return result.success ? result.data : [];
      } catch (error) {
        return [];
      }
    },
    staleTime: isDevelopment ? 0 : 1000 * 60 * 30, // No cache in dev
    gcTime: isDevelopment ? 0 : 1000 * 60 * 15, // No cache in dev
    refetchOnWindowFocus: isDevelopment ? true : false,
    retry: isDevelopment ? 0 : 1,
  });
}
