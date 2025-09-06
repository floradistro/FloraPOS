/**
 * Standardized Data Fetching Patterns for POSV1
 * Provides consistent approaches for different data scenarios
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './api-client';

// Standard query keys for consistent caching
export const queryKeys = {
  products: (filters?: any) => ['products', filters],
  product: (id: number) => ['product', id],
  categories: () => ['categories'],
  customers: (filters?: any) => ['customers', filters],
  customer: (id: number) => ['customer', id],
  orders: (filters?: any) => ['orders', filters],
  order: (id: number) => ['order', id],
  inventory: (locationId?: number) => ['inventory', locationId],
  blueprintPricing: (productIds: number[]) => ['blueprint-pricing', productIds],
  rewards: (userId: number) => ['rewards', userId],
} as const;

// Standard cache times - DEVELOPMENT MODE (MINIMAL CACHING)
export const cacheTimes = {
  static: 10 * 1000,           // 10 seconds (was 30 minutes) - DEV MODE
  dynamic: 1 * 1000,           // 1 second (was 5 minutes) - DEV MODE
  realtime: 0,                 // No cache (was 30 seconds) - DEV MODE
  critical: 0,                 // No cache - orders, payments
} as const;

/**
 * Standard product fetching with consistent error handling
 */
export function useProducts(filters?: any) {
  return useQuery({
    queryKey: queryKeys.products(filters),
    queryFn: () => api.get('/api/proxy/flora-im/products', { 
      cacheTime: cacheTimes.dynamic,
      retries: 3 
    }),
    staleTime: cacheTimes.dynamic,
    gcTime: cacheTimes.dynamic * 2,
    refetchOnWindowFocus: false,
  });
}

/**
 * Standard categories with long cache
 */
export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories(),
    queryFn: () => api.get('/api/proxy/woocommerce/products/categories?per_page=100&hide_empty=false', {
      cacheTime: cacheTimes.static,
      retries: 2
    }),
    staleTime: cacheTimes.static,
    gcTime: cacheTimes.static * 2,
    refetchOnWindowFocus: false,
  });
}

/**
 * Optimized blueprint pricing with minimal cache
 */
export function useBlueprintPricing(products: Array<{id: number, categoryIds: number[]}>) {
  return useQuery({
    queryKey: queryKeys.blueprintPricing(products.map(p => p.id)),
    queryFn: () => api.blueprintPricing(products),
    staleTime: cacheTimes.realtime,
    gcTime: cacheTimes.realtime * 2,
    refetchOnWindowFocus: false,
    enabled: products.length > 0,
  });
}

/**
 * Standard mutation pattern with optimistic updates
 */
export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderData: any) => api.post('/api/orders', orderData),
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.orders() });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
    onError: (error) => {
      console.error('Order creation failed:', error);
    },
  });
}

/**
 * Batch invalidation for related data
 */
export function useDataInvalidation() {
  const queryClient = useQueryClient();

  return {
    invalidateProducts: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
    invalidateOrders: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    invalidateCustomers: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
    invalidateAll: () => {
      queryClient.clear();
      api.clearCache();
    }
  };
}

/**
 * Standard loading states for consistency
 */
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface StandardResponse<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Wrapper for consistent response format
 */
export function useStandardQuery<T>(
  queryKey: any[],
  queryFn: () => Promise<T>,
  options?: {
    cacheTime?: number;
    retries?: number;
    enabled?: boolean;
  }
): StandardResponse<T> {
  const query = useQuery({
    queryKey,
    queryFn,
    staleTime: options?.cacheTime || cacheTimes.dynamic,
    gcTime: (options?.cacheTime || cacheTimes.dynamic) * 2,
    retry: options?.retries || 2,
    enabled: options?.enabled ?? true,
    refetchOnWindowFocus: false,
  });

  return {
    data: query.data || null,
    loading: query.isLoading,
    error: query.error?.message || null,
    refetch: query.refetch
  };
}
