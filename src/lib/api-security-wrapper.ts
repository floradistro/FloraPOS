/**
 * API Security Wrapper
 * Higher-order function to wrap API routes with security features
 */

import { NextRequest } from 'next/server'
import { 
  createSecureResponse, 
  createSecureErrorResponse, 
  validateOrigin, 
  sanitizeInput,
  SecurityConfig 
} from './security-headers'
import { rateLimiters, getClientIdentifier, RateLimiter } from './rate-limiter'

export interface ApiSecurityOptions extends SecurityConfig {
  rateLimiter?: RateLimiter | 'api' | 'auth' | 'upload' | 'search' | 'orders'
  allowedOrigins?: string[]
  requireAuth?: boolean
  sanitizeInputs?: boolean
  allowedMethods?: string[]
  customRateLimit?: {
    limit: number
    windowMs: number
  }
}

export type ApiHandler = (
  request: NextRequest,
  context: { params?: any }
) => Promise<Response> | Response

/**
 * Wrap an API route with security features
 */
export function withApiSecurity(
  handler: ApiHandler,
  options: ApiSecurityOptions = {}
) {
  return async (request: NextRequest, context: { params?: any } = {}) => {
    try {
      const {
        rateLimiter = 'api',
        allowedOrigins = ['http://localhost:3000', 'https://your-domain.com'],
        requireAuth = false,
        sanitizeInputs = true,
        allowedMethods = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        customRateLimit,
        ...securityConfig
      } = options

      // Check allowed methods
      if (!allowedMethods.includes(request.method)) {
        return createSecureErrorResponse(
          `Method ${request.method} not allowed`,
          405,
          securityConfig
        )
      }

      // Handle preflight requests
      if (request.method === 'OPTIONS') {
        const response = createSecureResponse('OK', 200, securityConfig)
        response.headers.set('Access-Control-Allow-Methods', allowedMethods.join(', '))
        return response
      }

      // Apply rate limiting
      let limiter: RateLimiter
      if (typeof rateLimiter === 'string') {
        limiter = rateLimiters[rateLimiter]
      } else if (rateLimiter instanceof RateLimiter) {
        limiter = rateLimiter
      } else if (customRateLimit) {
        limiter = new RateLimiter({
          windowMs: customRateLimit.windowMs,
          maxRequests: customRateLimit.limit
        })
      } else {
        limiter = rateLimiters.api
      }

      const identifier = getClientIdentifier(request)
      const rateLimitResult = await limiter.checkLimit(identifier)
      
      if (!rateLimitResult.allowed) {
        const response = createSecureErrorResponse(
          'Rate limit exceeded',
          429,
          securityConfig
        )
        
        // Add rate limit headers
        response.headers.set('X-RateLimit-Limit', rateLimitResult.limit.toString())
        response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString())
        response.headers.set('X-RateLimit-Reset', Math.ceil(rateLimitResult.resetTime / 1000).toString())
        response.headers.set('X-RateLimit-Total', rateLimitResult.totalHits.toString())
        
        return response
      }

      // Validate origin for CSRF protection
      if (request.method !== 'GET' && !validateOrigin(request, allowedOrigins)) {
        return createSecureErrorResponse(
          'Invalid origin',
          403,
          securityConfig
        )
      }

      // Check authentication if required
      if (requireAuth) {
        const authHeader = request.headers.get('authorization')
        const cookieToken = request.cookies.get('flora_auth_token')
        
        if (!authHeader && !cookieToken) {
          return createSecureErrorResponse(
            'Authentication required',
            401,
            securityConfig
          )
        }
      }

      // Sanitize inputs if enabled
      if (sanitizeInputs && (request.method === 'POST' || request.method === 'PUT')) {
        try {
          const contentType = request.headers.get('content-type')
          if (contentType?.includes('application/json')) {
            const body = await request.json()
            const sanitizedBody = sanitizeInput(body)
            
            // Create a new request with sanitized body
            const sanitizedRequest = new NextRequest(request.url, {
              method: request.method,
              headers: request.headers,
              body: JSON.stringify(sanitizedBody)
            })
            
            // Copy over the sanitized body for the handler
            ;(sanitizedRequest as any)._sanitizedBody = sanitizedBody
            request = sanitizedRequest
          }
        } catch (error) {
          return createSecureErrorResponse(
            'Invalid JSON body',
            400,
            securityConfig
          )
        }
      }

      // Execute the original handler
      const response = await handler(request, context)
      
      // If the response is not already a NextResponse, convert it
      if (!(response instanceof Response)) {
        throw new Error('Handler must return a Response object')
      }

      // Add rate limit headers to successful responses
      response.headers.set('X-RateLimit-Limit', rateLimitResult.limit.toString())
      response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString())
      response.headers.set('X-RateLimit-Reset', Math.ceil(rateLimitResult.resetTime / 1000).toString())
      response.headers.set('X-RateLimit-Total', rateLimitResult.totalHits.toString())

      return response

    } catch (error) {
      console.error('API Security Error:', error)
      
      return createSecureErrorResponse(
        process.env.NODE_ENV === 'production' 
          ? 'Internal server error' 
          : error instanceof Error ? error.message : 'Unknown error',
        500,
        options
      )
    }
  }
}

/**
 * Utility to get sanitized body from request
 */
export async function getSanitizedBody(request: NextRequest): Promise<any> {
  // Check if body was already sanitized by the wrapper
  if ((request as any)._sanitizedBody) {
    return (request as any)._sanitizedBody
  }
  
  try {
    const body = await request.json()
    return sanitizeInput(body)
  } catch {
    return null
  }
}

// Re-export commonly used functions from security-headers for API routes
export { createSecureResponse, createSecureErrorResponse } from './security-headers'

/**
 * Example usage:
 * 
 * // Basic usage with predefined rate limiter
 * export const POST = withApiSecurity(
 *   async (request: NextRequest) => {
 *     const body = await getSanitizedBody(request)
 *     // Your API logic here
 *     return createSecureResponse({ success: true })
 *   },
 *   {
 *     rateLimiter: 'auth', // Use predefined auth rate limiter
 *     requireAuth: true,
 *     allowedOrigins: ['https://your-domain.com']
 *   }
 * )
 * 
 * // Custom rate limiting
 * export const GET = withApiSecurity(
 *   async (request: NextRequest) => {
 *     // Your API logic here
 *     return createSecureResponse({ data: 'example' })
 *   },
 *   {
 *     customRateLimit: { limit: 50, windowMs: 60000 },
 *     requireAuth: false
 *   }
 * )
 */