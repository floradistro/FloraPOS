/**
 * Simple in-memory cache for API requests
 * Reduces latency and WordPress load
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

class RequestCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Get cached data or fetch fresh
   */
  async get<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = this.defaultTTL
  ): Promise<T> {
    const cached = this.cache.get(key);
    const now = Date.now();

    // Return cached if still valid
    if (cached && (now - cached.timestamp) < ttl) {
      console.log(`✅ Cache HIT: ${key} (age: ${Math.round((now - cached.timestamp) / 1000)}s)`);
      return cached.data;
    }

    // Fetch fresh data
    console.log(`❌ Cache MISS: ${key} - Fetching...`);
    const data = await fetcher();

    // Store in cache
    this.cache.set(key, {
      data,
      timestamp: now,
    });

    return data;
  }

  /**
   * Manually clear cache entry
   */
  clear(key: string) {
    this.cache.delete(key);
    console.log(`🗑️ Cache cleared: ${key}`);
  }

  /**
   * Clear all cache
   */
  clearAll() {
    this.cache.clear();
    console.log('🗑️ All cache cleared');
  }

  /**
   * Get cache stats
   */
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Singleton instance
export const requestCache = new RequestCache();

