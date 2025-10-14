import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CategoriesService } from '../services/categories-service';
import { apiFetch } from '../lib/api-fetch';
import { usersService, WordPressUser } from '../services/users-service';

/**
 * Optimized React Query hooks for server state management
 * Smart caching strategies for production-ready performance
 */

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

      const response = await apiFetch(`/api/proxy/flora-im/products?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }

      const data = await response.json();
      return data.success ? data.data : [];
    },
    staleTime: 30000, // 30 seconds
    gcTime: 300000, // 5 minutes
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

// Categories (reusing existing service)
export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => CategoriesService.getCategories(),
    staleTime: 600000, // 10 minutes - categories rarely change
    gcTime: 1800000, // 30 minutes
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

// Customers
export function useCustomers(searchQuery?: string) {
  return useQuery({
    queryKey: ['customers', searchQuery],
    queryFn: () => usersService.getUsers(false),
    staleTime: 300000, // 5 minutes
    gcTime: 900000, // 15 minutes
    refetchOnWindowFocus: false,
    retry: 1,
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
    staleTime: 60000, // 1 minute
    gcTime: 300000, // 5 minutes
    refetchOnWindowFocus: false,
    retry: 2,
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
    staleTime: 5000, // 5 seconds - inventory is critical
    gcTime: 30000, // 30 seconds
    refetchOnWindowFocus: true, // Always refetch inventory on focus
    retry: 1,
  });
}

// Mutation for updating inventory with optimistic updates
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
    onMutate: async (newData) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['inventory', newData.productId, newData.locationId] });
      
      // Snapshot the previous value
      const previousInventory = queryClient.getQueryData(['inventory', newData.productId, newData.locationId]);
      
      // Optimistically update to the new value
      queryClient.setQueryData(['inventory', newData.productId, newData.locationId], (old: any) => ({
        ...old,
        quantity: newData.newStock
      }));
      
      // Return context with the previous value
      return { previousInventory };
    },
    onError: (err, newData, context) => {
      // Rollback to previous value on error
      if (context?.previousInventory) {
        queryClient.setQueryData(
          ['inventory', newData.productId, newData.locationId],
          context.previousInventory
        );
      }
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch inventory queries
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    }
  });
}
