/**
 * Centralized API Client
 * Standardized approach for all API calls in POSV1
 */

import { ApiConfig as ApiEnvironmentConfig } from './api-config';

// Use environment variables - NO FALLBACKS
const API_BASE_URL = process.env.NEXT_PUBLIC_PRODUCTION_API_URL!;

if (!API_BASE_URL) {
  throw new Error('❌ MISSING REQUIRED ENV VAR: NEXT_PUBLIC_PRODUCTION_API_URL must be set in .env.local');
}

const WC_CONSUMER_KEY = process.env.NEXT_PUBLIC_WC_CONSUMER_KEY!;
const WC_CONSUMER_SECRET = process.env.NEXT_PUBLIC_WC_CONSUMER_SECRET!;

if (!WC_CONSUMER_KEY || !WC_CONSUMER_SECRET) {
  throw new Error('❌ MISSING REQUIRED ENV VARS: NEXT_PUBLIC_WC_CONSUMER_KEY and NEXT_PUBLIC_WC_CONSUMER_SECRET must be set');
}

/**
 * Track last used environment to detect changes
 */
let lastApiEnvironment: string | null = null;

/**
 * Get common headers including API environment
 */
function getCommonHeaders(): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  // Add API environment header for server-side routing
  if (typeof window !== 'undefined') {
    const apiEnv = ApiEnvironmentConfig.getEnvironment();
    headers['x-api-environment'] = apiEnv;
    
    // Clear cache if environment changed
    if (lastApiEnvironment !== null && lastApiEnvironment !== apiEnv) {
      console.log(`🔄 API environment changed from ${lastApiEnvironment} to ${apiEnv} - clearing cache`);
      ApiClient.getInstance().clearCache();
    }
    lastApiEnvironment = apiEnv;
  }
  
  return headers;
}

export interface ApiConfig {
  timeout?: number;
  retries?: number;
  cacheTime?: number;
  useAuth?: boolean;
}

export class ApiClient {
  private static instance: ApiClient;
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private inFlightRequests = new Map<string, Promise<any>>();

  private constructor() {}

  static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient();
    }
    return ApiClient.instance;
  }

  /**
   * Internal API calls (to our own endpoints)
   */
  async get<T>(endpoint: string, config: ApiConfig = {}): Promise<T> {
    const url = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return this.makeRequest<T>(url, { 
      method: 'GET',
      headers: getCommonHeaders()
    }, config);
  }

  async post<T>(endpoint: string, data?: any, config: ApiConfig = {}): Promise<T> {
    const url = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return this.makeRequest<T>(url, {
      method: 'POST',
      headers: getCommonHeaders(),
      body: data ? JSON.stringify(data) : undefined
    }, config);
  }

  async put<T>(endpoint: string, data?: any, config: ApiConfig = {}): Promise<T> {
    const url = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return this.makeRequest<T>(url, {
      method: 'PUT',
      headers: getCommonHeaders(),
      body: data ? JSON.stringify(data) : undefined
    }, config);
  }

  async delete<T>(endpoint: string, config: ApiConfig = {}): Promise<T> {
    const url = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return this.makeRequest<T>(url, { 
      method: 'DELETE',
      headers: getCommonHeaders()
    }, config);
  }

  /**
   * External Flora API calls (bypassing our proxy)
   */
  async flora<T>(endpoint: string, config: ApiConfig = {}): Promise<T> {
    const url = `${API_BASE_URL}/wp-json${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    const params = new URLSearchParams({
      consumer_key: WC_CONSUMER_KEY,
      consumer_secret: WC_CONSUMER_SECRET,
      _t: Date.now().toString()
    });

    return this.makeRequest<T>(`${url}?${params.toString()}`, {
      method: 'GET',
      headers: { 
        'Content-Type': 'application/json',
        'User-Agent': 'POSV1/1.0'
      }
    }, config);
  }

  /**
   * Core request method with caching, retries, and error handling
   */
  private async makeRequest<T>(
    url: string, 
    fetchOptions: RequestInit, 
    config: ApiConfig = {}
  ): Promise<T> {
    const {
      timeout = 10000,
      retries = 3,
      cacheTime = 0,
      useAuth = false
    } = config;

    const cacheKey = `${url}:${JSON.stringify(fetchOptions)}`;

    // Check cache first
    if (cacheTime > 0 && fetchOptions.method === 'GET') {
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < cached.ttl) {
        return cached.data;
      }
    }

    // Check for in-flight duplicate requests (deduplication)
    if (fetchOptions.method === 'GET') {
      const inFlight = this.inFlightRequests.get(cacheKey);
      if (inFlight) {
        if (process.env.NODE_ENV === 'development') {
          console.log(`♻️ Reusing in-flight request for: ${url}`);
        }
        return inFlight as Promise<T>;
      }
    }

    // Create the request promise and store it for deduplication
    const requestPromise = this.executeRequest<T>(url, fetchOptions, config, cacheKey);
    
    if (fetchOptions.method === 'GET') {
      this.inFlightRequests.set(cacheKey, requestPromise);
    }

    try {
      const result = await requestPromise;
      return result;
    } finally {
      // Clean up in-flight request after completion
      if (fetchOptions.method === 'GET') {
        this.inFlightRequests.delete(cacheKey);
      }
    }
  }

  /**
   * Execute the actual request with retries
   */
  private async executeRequest<T>(
    url: string,
    fetchOptions: RequestInit,
    config: ApiConfig,
    cacheKey: string
  ): Promise<T> {
    const {
      timeout = 10000,
      retries = 3,
      cacheTime = 0,
      useAuth = false
    } = config;

    // Add authentication if needed
    if (useAuth) {
      const token = localStorage.getItem('pos_token');
      if (token) {
        fetchOptions.headers = {
          ...fetchOptions.headers,
          Authorization: `Basic ${token}`
        };
      }
    }

    let lastError: Error;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(url, {
          ...fetchOptions,
          signal: controller.signal,
          cache: 'no-store'
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        // Cache successful GET requests
        if (cacheTime > 0 && fetchOptions.method === 'GET') {
          this.cache.set(cacheKey, {
            data,
            timestamp: Date.now(),
            ttl: cacheTime
          });
        }

        return data;

      } catch (error) {
        lastError = error as Error;
        
        if (attempt < retries) {
          // Exponential backoff
          await new Promise(resolve => 
            setTimeout(resolve, Math.min(1000 * Math.pow(2, attempt - 1), 5000))
          );
        }
      }
    }

    throw lastError!;
  }

  /**
   * Clear cache for specific pattern or all
   */
  clearCache(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
      return;
    }

    for (const key of Array.from(this.cache.keys())) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Batch operations
   */
  async batch<T>(requests: Array<() => Promise<T>>): Promise<T[]> {
    return Promise.all(requests.map(req => req()));
  }

  /**
   * Blueprint pricing optimization with aggressive caching
   */
  async getBlueprintPricing(products: Array<{id: number, categoryIds: number[]}>): Promise<any> {
    return this.post('/api/pricing/batch-blueprint', { products }, {
      cacheTime: 5 * 60 * 1000 // Cache for 5 minutes for blueprint pricing
    });
  }
}

// Export singleton instance
export const apiClient = ApiClient.getInstance();

// Convenience methods
export const api = {
  get: <T>(endpoint: string, config?: ApiConfig) => apiClient.get<T>(endpoint, config),
  post: <T>(endpoint: string, data?: any, config?: ApiConfig) => apiClient.post<T>(endpoint, data, config),
  put: <T>(endpoint: string, data?: any, config?: ApiConfig) => apiClient.put<T>(endpoint, data, config),
  delete: <T>(endpoint: string, config?: ApiConfig) => apiClient.delete<T>(endpoint, config),
  flora: <T>(endpoint: string, config?: ApiConfig) => apiClient.flora<T>(endpoint, config),
  batch: <T>(requests: Array<() => Promise<T>>) => apiClient.batch(requests),
  clearCache: (pattern?: string) => apiClient.clearCache(pattern),
  blueprintPricing: (products: Array<{id: number, categoryIds: number[]}>) => 
    apiClient.getBlueprintPricing(products)
};
