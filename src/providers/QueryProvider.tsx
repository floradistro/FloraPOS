'use client';

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { errorReporting, reportApiError } from '../lib/errorReporting';

// Enhanced QueryClient with OPTIMIZED CACHING for PERFORMANCE
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // PERFORMANCE MODE - ENABLE SMART CACHING
      staleTime: 1000 * 60 * 5, // 5 minutes - balance performance and freshness
      gcTime: 1000 * 60 * 30, // 30 minutes cache retention
      refetchOnWindowFocus: false, // Only manual refresh for better UX
      refetchOnReconnect: true, // Refetch when reconnecting
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors (client errors)
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return false;
        }
        // Retry up to 2 times for other errors
        return failureCount < 2;
      },
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 5000), // Max 5 second retry delay
      // Network mode settings
      networkMode: 'online',
    },
    mutations: {
      retry: (failureCount, error: any) => {
        // Don't retry mutations on client errors
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return false;
        }
        return failureCount < 1; // Only 1 retry for mutations
      },
      networkMode: 'online',
    },
  },
});

// Enhanced cache invalidation utilities with request deduplication awareness
export const invalidateInventory = () => {
  queryClient.invalidateQueries({ queryKey: ['products'] });
  queryClient.invalidateQueries({ queryKey: ['inventory'] });
  
};

export const invalidatePricing = () => {
  queryClient.invalidateQueries({ queryKey: ['blueprint-pricing'] });


};

export const invalidateCategories = () => {
  queryClient.invalidateQueries({ queryKey: ['categories'] });

};

export const invalidateUserData = () => {
  queryClient.invalidateQueries({ queryKey: ['user'] });
  queryClient.invalidateQueries({ queryKey: ['customers'] });

};

export const invalidateLocations = () => {
  queryClient.invalidateQueries({ queryKey: ['locations'] });

};

// Smart cache invalidation based on data relationships
export const smartInvalidate = {
  onInventoryChange: () => {
    invalidateInventory();
    // Products depend on inventory
    queryClient.invalidateQueries({ queryKey: ['products'] });
  },
  
  onPricingChange: () => {
    invalidatePricing();
    // Products may show different prices
    queryClient.invalidateQueries({ queryKey: ['products'] });
  },
  
  onCategoryChange: () => {
    invalidateCategories();
    // Products are categorized
    queryClient.invalidateQueries({ queryKey: ['products'] });
  },
  
  onLocationChange: () => {
    invalidateLocations();
    // Tax calculations depend on location
    invalidatePricing();
  },
};

// Export QueryClient instance for advanced usage
export { queryClient };

interface QueryProviderProps {
  children: React.ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
        {children}
    </QueryClientProvider>
  );
}


