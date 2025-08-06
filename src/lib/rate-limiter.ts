/**
 * Advanced Rate Limiter
 * Redis-backed rate limiting with fallback to in-memory storage
 */

import Redis from 'ioredis'

interface RateLimitOptions {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum requests per window
  keyGenerator?: (identifier: string) => string
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
  onLimitReached?: (identifier: string, limit: RateLimitInfo) => void
}

interface RateLimitInfo {
  totalHits: number
  totalHitsInWindow: number
  remainingPoints: number
  msBeforeNext: number
  isFirstInWindow: boolean
}

interface RateLimitResult {
  allowed: boolean
  limit: number
  remaining: number
  resetTime: number
  totalHits: number
}

class RateLimiter {
  private redis: Redis | null = null
  private memoryStore = new Map<string, { count: number; resetTime: number; totalHits: number }>()
  private options: Required<RateLimitOptions>

  constructor(options: RateLimitOptions) {
    this.options = {
      keyGenerator: (id: string) => `rate_limit:${id}`,
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
      onLimitReached: () => {},
      ...options
    }

    this.initializeRedis()
  }

  /**
   * Initialize Redis connection if available
   */
  private async initializeRedis(): Promise<void> {
    if (!process.env.REDIS_URL) {
      console.log('Rate Limiter: Using in-memory storage (Redis not configured)')
      return
    }

    try {
      this.redis = new Redis(process.env.REDIS_URL, {
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true
      })

      this.redis.on('error', (error) => {
        console.error('Redis connection error:', error)
        this.redis = null // Fallback to memory
      })

      this.redis.on('connect', () => {
        console.log('Rate Limiter: Connected to Redis')
      })

      await this.redis.connect()
    } catch (error) {
      console.error('Failed to connect to Redis:', error)
      this.redis = null
    }
  }

  /**
   * Check rate limit using Redis
   */
  private async checkRedisRateLimit(key: string): Promise<RateLimitResult> {
    if (!this.redis) {
      throw new Error('Redis not available')
    }

    const now = Date.now()
    const window = this.options.windowMs
    const windowStart = now - window

    const pipeline = this.redis.pipeline()
    
    // Remove expired entries
    pipeline.zremrangebyscore(key, 0, windowStart)
    
    // Count current requests in window
    pipeline.zcard(key)
    
    // Add current request
    pipeline.zadd(key, now, `${now}-${Math.random()}`)
    
    // Set expiration
    pipeline.expire(key, Math.ceil(window / 1000))
    
    // Get total hits (for statistics)
    pipeline.get(`${key}:total`)

    const results = await pipeline.exec()
    
    if (!results || results.some(([err]) => err)) {
      throw new Error('Redis pipeline failed')
    }

    const currentCount = (results[1][1] as number) + 1 // +1 for the request we just added
    const totalHits = parseInt((results[4][1] as string) || '0') + 1

    // Update total hits counter
    await this.redis.incr(`${key}:total`)
    await this.redis.expire(`${key}:total`, Math.ceil(window / 1000) * 2) // Keep total longer

    const allowed = currentCount <= this.options.maxRequests
    const remaining = Math.max(0, this.options.maxRequests - currentCount)
    const resetTime = now + window

    if (!allowed) {
      this.options.onLimitReached(key, {
        totalHits,
        totalHitsInWindow: currentCount,
        remainingPoints: remaining,
        msBeforeNext: window,
        isFirstInWindow: currentCount === 1
      })
    }

    return {
      allowed,
      limit: this.options.maxRequests,
      remaining,
      resetTime,
      totalHits
    }
  }

  /**
   * Check rate limit using in-memory storage
   */
  private checkMemoryRateLimit(key: string): RateLimitResult {
    const now = Date.now()
    const record = this.memoryStore.get(key)

    if (!record || now > record.resetTime) {
      const newRecord = {
        count: 1,
        resetTime: now + this.options.windowMs,
        totalHits: (record?.totalHits || 0) + 1
      }
      this.memoryStore.set(key, newRecord)

      return {
        allowed: true,
        limit: this.options.maxRequests,
        remaining: this.options.maxRequests - 1,
        resetTime: newRecord.resetTime,
        totalHits: newRecord.totalHits
      }
    }

    record.count++
    record.totalHits++
    this.memoryStore.set(key, record)

    const allowed = record.count <= this.options.maxRequests
    const remaining = Math.max(0, this.options.maxRequests - record.count)

    if (!allowed) {
      this.options.onLimitReached(key, {
        totalHits: record.totalHits,
        totalHitsInWindow: record.count,
        remainingPoints: remaining,
        msBeforeNext: record.resetTime - now,
        isFirstInWindow: false
      })
    }

    return {
      allowed,
      limit: this.options.maxRequests,
      remaining,
      resetTime: record.resetTime,
      totalHits: record.totalHits
    }
  }

  /**
   * Check if request is within rate limit
   */
  async checkLimit(identifier: string): Promise<RateLimitResult> {
    const key = this.options.keyGenerator(identifier)

    try {
      if (this.redis) {
        return await this.checkRedisRateLimit(key)
      } else {
        return this.checkMemoryRateLimit(key)
      }
    } catch (error) {
      console.error('Rate limit check failed:', error)
      // Fallback to memory if Redis fails
      return this.checkMemoryRateLimit(key)
    }
  }

  /**
   * Reset rate limit for an identifier
   */
  async resetLimit(identifier: string): Promise<void> {
    const key = this.options.keyGenerator(identifier)

    try {
      if (this.redis) {
        await this.redis.del(key, `${key}:total`)
      } else {
        this.memoryStore.delete(key)
      }
    } catch (error) {
      console.error('Failed to reset rate limit:', error)
    }
  }

  /**
   * Get current rate limit status without incrementing
   */
  async getStatus(identifier: string): Promise<RateLimitResult | null> {
    const key = this.options.keyGenerator(identifier)

    try {
      if (this.redis) {
        const now = Date.now()
        const windowStart = now - this.options.windowMs
        
        await this.redis.zremrangebyscore(key, 0, windowStart)
        const currentCount = await this.redis.zcard(key)
        const totalHits = parseInt(await this.redis.get(`${key}:total`) || '0')

        return {
          allowed: currentCount < this.options.maxRequests,
          limit: this.options.maxRequests,
          remaining: Math.max(0, this.options.maxRequests - currentCount),
          resetTime: now + this.options.windowMs,
          totalHits
        }
      } else {
        const record = this.memoryStore.get(key)
        if (!record) return null

        const now = Date.now()
        if (now > record.resetTime) {
          this.memoryStore.delete(key)
          return null
        }

        return {
          allowed: record.count < this.options.maxRequests,
          limit: this.options.maxRequests,
          remaining: Math.max(0, this.options.maxRequests - record.count),
          resetTime: record.resetTime,
          totalHits: record.totalHits
        }
      }
    } catch (error) {
      console.error('Failed to get rate limit status:', error)
      return null
    }
  }

  /**
   * Clean up expired entries (for memory storage)
   */
  cleanup(): void {
    if (this.redis) return // Redis handles cleanup automatically

    const now = Date.now()
    for (const [key, record] of this.memoryStore.entries()) {
      if (now > record.resetTime) {
        this.memoryStore.delete(key)
      }
    }
  }

  /**
   * Close Redis connection
   */
  async close(): Promise<void> {
    if (this.redis) {
      await this.redis.quit()
      this.redis = null
    }
  }
}

// Predefined rate limiters for different use cases
export const rateLimiters = {
  // General API rate limiter
  api: new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
    keyGenerator: (id) => `api:${id}`
  }),

  // Authentication rate limiter (stricter)
  auth: new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    keyGenerator: (id) => `auth:${id}`,
    onLimitReached: (id, info) => {
      console.warn(`Auth rate limit exceeded for ${id}:`, info)
    }
  }),

  // File upload rate limiter
  upload: new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,
    keyGenerator: (id) => `upload:${id}`
  }),

  // Search rate limiter
  search: new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 50,
    keyGenerator: (id) => `search:${id}`
  }),

  // Order processing rate limiter
  orders: new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 20,
    keyGenerator: (id) => `orders:${id}`
  })
}

/**
 * Get client identifier from request
 */
export function getClientIdentifier(request: Request): string {
  // Try to get IP from various headers
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const cfConnectingIp = request.headers.get('cf-connecting-ip')
  
  const ip = forwarded?.split(',')[0] || realIp || cfConnectingIp || 'unknown'
  
  // Add user agent for additional uniqueness
  const userAgent = request.headers.get('user-agent') || 'unknown'
  const userAgentHash = userAgent.substring(0, 50)
  
  return `${ip}:${userAgentHash}`
}

/**
 * Express-style middleware for rate limiting
 */
export function createRateLimitMiddleware(limiter: RateLimiter) {
  return async (request: Request) => {
    const identifier = getClientIdentifier(request)
    const result = await limiter.checkLimit(identifier)
    
    return {
      allowed: result.allowed,
      headers: {
        'X-RateLimit-Limit': result.limit.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': Math.ceil(result.resetTime / 1000).toString(),
        'X-RateLimit-Total': result.totalHits.toString()
      }
    }
  }
}

// Cleanup interval for memory storage
if (typeof window === 'undefined') {
  setInterval(() => {
    Object.values(rateLimiters).forEach(limiter => limiter.cleanup())
  }, 5 * 60 * 1000) // Every 5 minutes
}

export { RateLimiter }