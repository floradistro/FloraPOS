'use client';

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { errorReporting, reportApiError } from '../lib/errorReporting';

// DEVELOPMENT MODE - NO CACHING AT ALL
const isDevelopment = process.env.NODE_ENV === 'development';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // DISABLE ALL CACHING IN DEVELOPMENT
      staleTime: isDevelopment ? 0 : 1000 * 60 * 5, // 0 in dev, 5 minutes in prod
      gcTime: isDevelopment ? 0 : 1000 * 60 * 30, // 0 in dev, 30 minutes in prod
      refetchOnWindowFocus: isDevelopment ? true : false, // Always refetch in dev
      refetchOnReconnect: true, // Refetch when reconnecting
      refetchOnMount: isDevelopment ? 'always' : true, // Always refetch in dev
      retry: isDevelopment ? false : (failureCount, error: any) => {
        // No retries in development
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return false;
        }
        return failureCount < 2;
      },
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 5000),
      networkMode: 'online',
    },
    mutations: {
      retry: isDevelopment ? false : (failureCount, error: any) => {
        // No retries in development
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return false;
        }
        return failureCount < 1;
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


