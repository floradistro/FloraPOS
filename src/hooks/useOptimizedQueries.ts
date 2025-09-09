import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CategoriesService } from '../services/categories-service';

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

      const response = await fetch(`/api/proxy/flora-im/products?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch products: ${response.status}`);
      }

      const result = await response.json();
      return {
        success: true,
        data: result.success ? result.data : [],
        meta: result.meta || { total: 0, pages: 1, page: 1, per_page: 100 }
      };
    },
    staleTime: isDevelopment ? 0 : 1000 * 60 * 5, // No cache in dev
    gcTime: isDevelopment ? 0 : 1000 * 60 * 10, // No cache in dev
    refetchOnWindowFocus: isDevelopment ? true : false, // Always refetch in dev
    retry: isDevelopment ? 0 : 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 5000),
  });
}

// Categories with longer cache time (they rarely change)
export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => CategoriesService.getCategories(),
    staleTime: isDevelopment ? 0 : 1000 * 60 * 120, // No cache in dev
    gcTime: isDevelopment ? 0 : 1000 * 60 * 30, // No cache in dev
    refetchOnWindowFocus: isDevelopment ? true : false,
    retry: isDevelopment ? 0 : 1,
  });
}

// Customer data
export function useCustomers(searchQuery?: string) {
  return useQuery({
    queryKey: ['customers', searchQuery],
    queryFn: async () => {
      // getUsers doesn't accept parameters, so we'll get all users and filter client-side
      const users = await usersService.getUsers();
      if (searchQuery) {
        return users.filter(user => 
          user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.email?.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      return users;
    },
    staleTime: isDevelopment ? 0 : 1000 * 60 * 15, // No cache in dev
    gcTime: isDevelopment ? 0 : 1000 * 60 * 15, // No cache in dev
    enabled: !!searchQuery, // Only run if we have a search query
  });
}

// Individual customer details
export function useCustomer(customerId: number) {
  return useQuery({
    queryKey: ['customer', customerId],
    queryFn: () => usersService.getUserById(customerId),
    staleTime: isDevelopment ? 0 : 1000 * 60 * 10, // No cache in dev
    gcTime: isDevelopment ? 0 : 1000 * 60 * 20, // No cache in dev
    enabled: !!customerId,
  });
}

// Order creation mutation with optimistic updates
export function useCreateOrder() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (orderData: any) => {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });
      
      if (!response.ok) {
        throw new Error(`Order creation failed: ${response.status}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch relevant queries after successful order
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
    onError: (error) => {
      console.error('Order creation failed:', error);
    },
  });
}

// Inventory refresh mutation (for manual refresh buttons)
export function useRefreshInventory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      // Invalidate all inventory-related queries
      await queryClient.invalidateQueries({ queryKey: ['products'] });
      await queryClient.invalidateQueries({ queryKey: ['inventory'] });
      
      // Wait for refetch to complete
      await queryClient.refetchQueries({ queryKey: ['products'] });
    },
    onError: (error) => {
      console.error('Inventory refresh failed:', error);
    },
  });
}

// Optimized cache utilities
export function useOptimizedCache() {
  const queryClient = useQueryClient();
  
  return {
    // Smart invalidation - only invalidate what's needed
    invalidateProducts: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    
    invalidateCustomers: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
    
    // Prefetch data for better UX
    prefetchCustomer: (customerId: number) => {
      queryClient.prefetchQuery({
        queryKey: ['customer', customerId],
        queryFn: () => usersService.getUserById(customerId),
        staleTime: isDevelopment ? 0 : 1000 * 60 * 10,
      });
    },
    
    // Clear old cache entries to prevent memory buildup
    clearStaleCache: () => {
      queryClient.clear();
    },
  };
}
