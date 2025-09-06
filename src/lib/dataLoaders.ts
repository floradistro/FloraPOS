/**
 * Advanced Data Loaders with Request Deduplication and Caching
 * Provides server-side data loading with client-side hydration
 */

import { Category } from '../types';
import { CategoriesService } from '../services/categories-service';
import { LOCATION_MAPPINGS } from '../constants';

// Request deduplication cache
const requestCache = new Map<string, Promise<any>>();

// Helper for request deduplication
function dedupedRequest<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  if (requestCache.has(key)) {
    return requestCache.get(key) as Promise<T>;
  }

  const promise = fetcher()
    .finally(() => {
      // Clean up cache entry after request completes
      setTimeout(() => {
        requestCache.delete(key);
      }, 100);
    });

  requestCache.set(key, promise);
  return promise;
}

// Categories data loader
export async function loadCategories(): Promise<Category[]> {
  return dedupedRequest('categories', async () => {
    try {
      const categories = await CategoriesService.getCategories();
      return categories;
    } catch (error) {
      console.error('Failed to load categories:', error);
      return [];
    }
  });
}

// Location data loader
export async function loadLocations() {
  return dedupedRequest('locations', async () => {
    try {
      // For now, return the static location mappings
      // In a real implementation, this would fetch from an API
      return Object.entries(LOCATION_MAPPINGS).map(([name, data]) => ({
        id: data.id,
        name,
        taxRate: data.rate,
        taxName: data.name
      }));
    } catch (error) {
      console.error('Failed to load locations:', error);
      return [];
    }
  });
}

// Tax rates data loader
export async function loadTaxRates() {
  return dedupedRequest('tax-rates', async () => {
    try {
      return LOCATION_MAPPINGS;
    } catch (error) {
      console.error('Failed to load tax rates:', error);
      return LOCATION_MAPPINGS;
    }
  });
}

// Data preloader utility for server components
export class DataPreloader {
  private static instance: DataPreloader;
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  static getInstance(): DataPreloader {
    if (!DataPreloader.instance) {
      DataPreloader.instance = new DataPreloader();
    }
    return DataPreloader.instance;
  }

  async preload<T>(
    key: string,
    loader: () => Promise<T>,
    ttl: number = 5 * 60 * 1000 // 5 minutes default
  ): Promise<T> {
    const cached = this.cache.get(key);
    const now = Date.now();

    // Return cached data if still valid
    if (cached && (now - cached.timestamp) < cached.ttl) {
      return cached.data as T;
    }

    // Load fresh data
    try {
      const data = await loader();
      this.cache.set(key, { data, timestamp: now, ttl });
      return data;
    } catch (error) {
      // If we have stale data, return it
      if (cached) {
        console.warn(`Using stale data for ${key} due to error:`, error);
        return cached.data as T;
      }
      throw error;
    }
  }

  // Clear cache entry
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  // Clear all cache
  clear(): void {
    this.cache.clear();
  }
}

// Server-side data loading helpers
export const serverDataLoaders = {
  categories: () => DataPreloader.getInstance().preload('categories', loadCategories, 60 * 60 * 1000), // 1 hour
  locations: () => DataPreloader.getInstance().preload('locations', loadLocations, 24 * 60 * 60 * 1000), // 24 hours
  taxRates: () => DataPreloader.getInstance().preload('tax-rates', loadTaxRates, 24 * 60 * 60 * 1000), // 24 hours
};

// Client-side data hooks that can use server-provided initial data
export interface InitialData {
  categories?: Category[];
  locations?: any[];
  taxRates?: any;
}

// Data hydration helper
export function createDataHydrator<T>(
  key: keyof InitialData,
  serverLoader: () => Promise<T>,
  fallback: T
) {
  return async (initialData?: InitialData): Promise<T> => {
    // Use server-provided data if available
    if (initialData && initialData[key]) {
      return initialData[key] as T;
    }

    // Fallback to server loader
    try {
      return await serverLoader();
    } catch (error) {
      console.error(`Failed to load ${key}:`, error);
      return fallback;
    }
  };
}

// Prefetch utilities for better performance
export const prefetchData = {
  categories: () => loadCategories(),
  locations: () => loadLocations(),
  taxRates: () => loadTaxRates(),
};

// Request coalescing for identical concurrent requests
class RequestCoalescer {
  private pending = new Map<string, Promise<any>>();

  async coalesce<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    if (this.pending.has(key)) {
      return this.pending.get(key) as Promise<T>;
    }

    const promise = fetcher()
      .finally(() => {
        this.pending.delete(key);
      });

    this.pending.set(key, promise);
    return promise;
  }
}

export const requestCoalescer = new RequestCoalescer();
