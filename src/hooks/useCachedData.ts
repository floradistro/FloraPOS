import { useQuery } from '@tanstack/react-query';
import { CategoriesService } from '../services/categories-service';
import { Category } from '../components/ui/CategoryFilter';
import { apiFetch } from '../lib/api-fetch';

/**
 * Hook for caching categories data with long stale time
 * Categories rarely change so we can cache them longer
 */
export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => CategoriesService.getCategories(),
    staleTime: 600000, // 10 minutes
    gcTime: 1800000, // 30 minutes
    refetchOnWindowFocus: false,
    retry: 1,
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
    staleTime: 600000, // 10 minutes
    gcTime: 1800000, // 30 minutes
    refetchOnWindowFocus: false,
    retry: 1,
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
    staleTime: 3600000, // 1 hour
    gcTime: 7200000, // 2 hours
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

/**
 * Hook for caching blueprint pricing assignments
 * V3 Native System - Blueprint assignments are now derived from category fields
 * No longer needed as batch-blueprint route handles all pricing logic
 * Kept for backward compatibility but returns empty data
 */
export function useBlueprintAssignments() {
  return useQuery({
    queryKey: ['blueprint-assignments'],
    queryFn: async () => {
      // V3 Native System: Assignments are derived from category field groups
      // This hook is deprecated but kept for backward compatibility
      console.warn('useBlueprintAssignments is deprecated in V3 Native System');
      return { assignments: [] };
    },
    staleTime: 300000, // 5 minutes
    gcTime: 900000, // 15 minutes
    refetchOnWindowFocus: false,
    retry: 1,
  });
}
