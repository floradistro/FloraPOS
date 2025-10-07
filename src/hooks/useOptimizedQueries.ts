import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CategoriesService } from '../services/categories-service';
import { apiFetch } from '../lib/api-fetch';
import { usersService, WordPressUser } from '../services/users-service';

/**
 * Optimized React Query hooks for server state management
 * These replace manual fetch calls with proper caching and error handling
 */

const isDevelopment = process.env.NODE_ENV === 'development';

// Products with inventory (main product grid data)
export function useProducts(searchQuery?: string, categoryFilter?: string) {
  return useQuery({
    queryKey: ['products', searchQuery, categoryFilter],
    queryFn: async () => {
      // Use direct API call to flora-im products endpoint
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (categoryFilter) params.append('category', categoryFilter);
      params.append('per_page', '100');
      params.append('page', '1');
      params.append('_t', Date.now().toString());

      const response = await apiFetch(`/api/proxy/flora-im/products?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }

      const data = await response.json();
      return data.success ? data.data : [];
    },
    staleTime: isDevelopment ? 0 : 1000 * 60 * 5, // No cache in dev, 5 min in prod
    gcTime: isDevelopment ? 0 : 1000 * 60 * 15, // No cache in dev
    refetchOnWindowFocus: isDevelopment ? true : false, // Always refetch in dev
    retry: isDevelopment ? 0 : 1,
    refetchInterval: isDevelopment ? false : 1000 * 60 * 2, // No background refetch in dev
  });
}

// Categories (reusing existing service)
export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => CategoriesService.getCategories(),
    staleTime: isDevelopment ? 0 : 1000 * 60 * 10, // No cache in dev
    gcTime: isDevelopment ? 0 : 1000 * 60 * 30, // No cache in dev
    refetchOnWindowFocus: isDevelopment ? true : false, // Always refetch in dev
    retry: isDevelopment ? 0 : 1,
    refetchInterval: isDevelopment ? false : 1000 * 60 * 5, // No background refetch in dev
  });
}

// Customers
export function useCustomers(searchQuery?: string) {
  return useQuery({
    queryKey: ['customers', searchQuery],
    queryFn: () => usersService.getUsers(searchQuery || ''),
    staleTime: isDevelopment ? 0 : 1000 * 60 * 15, // No cache in dev
    gcTime: isDevelopment ? 0 : 1000 * 60 * 30, // No cache in dev
    refetchOnWindowFocus: isDevelopment, // Always refetch in dev
    retry: isDevelopment ? 0 : 1,
    refetchInterval: isDevelopment ? undefined : 1000 * 60 * 5, // No background refetch in dev
  });
}

// Orders (for orders view)
export function useOrders(filters?: {
  status?: string;
  page?: number;
  perPage?: number;
  locationId?: string;
  dateFrom?: string;
  dateTo?: string;
}) {
  return useQuery({
    queryKey: ['orders', filters],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: (filters?.page || 1).toString(),
        per_page: (filters?.perPage || 50).toString(),
        status: filters?.status || 'any',
        orderby: 'date',
        order: 'desc',
      });

      if (filters?.locationId) params.append('location_id', filters.locationId);
      if (filters?.dateFrom) params.append('date_from', filters.dateFrom);
      if (filters?.dateTo) params.append('date_to', filters.dateTo);

      const response = await apiFetch(`/api/orders?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }

      const data = await response.json();
      return data;
    },
    staleTime: isDevelopment ? 0 : 1000 * 60 * 2, // No cache in dev
    gcTime: isDevelopment ? 0 : 1000 * 60 * 15, // No cache in dev
    refetchOnWindowFocus: isDevelopment, // Always refetch in dev
    retry: isDevelopment ? 0 : 2,
    refetchInterval: isDevelopment ? undefined : 1000 * 60, // No background refetch in dev
  });
}

// Inventory for specific product/location
export function useInventory(productId?: number, locationId?: number) {
  return useQuery({
    queryKey: ['inventory', productId, locationId],
    queryFn: async () => {
      if (!productId || !locationId) return null;
      
      const params = new URLSearchParams({
        product_id: productId.toString(),
        location_id: locationId.toString(),
      });

      const response = await apiFetch(`/api/proxy/flora-im/inventory?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch inventory');
      }

      const data = await response.json();
      return data;
    },
    enabled: !!productId && !!locationId,
    staleTime: isDevelopment ? 0 : 1000 * 60 * 1, // No cache in dev
    gcTime: isDevelopment ? 0 : 1000 * 60 * 5, // No cache in dev
    refetchOnWindowFocus: isDevelopment, // Always refetch in dev
    retry: isDevelopment ? 0 : 1,
  });
}

// Mutation for updating inventory
export function useInventoryUpdate() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ productId, locationId, newStock }: { 
      productId: number; 
      locationId: number; 
      newStock: number;
    }) => {
      const response = await apiFetch('/api/proxy/flora-im/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: productId,
          location_id: locationId,
          quantity: newStock
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update inventory');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    }
  });
}
