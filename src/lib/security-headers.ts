/**
 * Security Headers Utility
 * Centralized security header management for API routes
 */

import { NextResponse } from 'next/server'

export interface SecurityConfig {
  enableCSP?: boolean
  enableHSTS?: boolean
  enableRateLimiting?: boolean
  corsOrigins?: string[]
}

/**
 * Default security headers for API responses
 */
export const DEFAULT_SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0'
}

/**
 * Content Security Policy for API responses
 */
export const API_CSP = "default-src 'none'; frame-ancestors 'none';"

/**
 * Strict Transport Security header
 */
export const HSTS_HEADER = 'max-age=63072000; includeSubDomains; preload'

/**
 * Apply security headers to a NextResponse
 */
export function applySecurityHeaders(
  response: NextResponse,
  config: SecurityConfig = {}
): NextResponse {
  const {
    enableCSP = true,
    enableHSTS = process.env.NODE_ENV === 'production',
    corsOrigins = []
  } = config

  // Apply default security headers
  Object.entries(DEFAULT_SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  // Apply Content Security Policy
  if (enableCSP) {
    response.headers.set('Content-Security-Policy', API_CSP)
  }

  // Apply HSTS in production
  if (enableHSTS) {
    response.headers.set('Strict-Transport-Security', HSTS_HEADER)
  }

  // Apply CORS headers if origins are specified
  if (corsOrigins.length > 0) {
    response.headers.set('Access-Control-Allow-Origin', corsOrigins.join(', '))
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    response.headers.set('Access-Control-Max-Age', '86400')
  }

  return response
}

/**
 * Create a secure JSON response
 */
export function createSecureResponse(
  data: any,
  status: number = 200,
  config: SecurityConfig = {}
): NextResponse {
  const response = NextResponse.json(data, { status })
  return applySecurityHeaders(response, config)
}

/**
 * Create a secure error response
 */
export function createSecureErrorResponse(
  message: string,
  status: number = 500,
  config: SecurityConfig = {}
): NextResponse {
  const response = NextResponse.json(
    { 
      error: message,
      timestamp: new Date().toISOString(),
      status 
    },
    { status }
  )
  return applySecurityHeaders(response, config)
}

/**
 * Rate limiting store (in-memory for development, use Redis for production)
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

/**
 * Simple rate limiting implementation
 */
export function checkRateLimit(
  identifier: string,
  limit: number = 100,
  windowMs: number = 60000 // 1 minute
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now()
  const key = `rate_limit:${identifier}`
  
  let record = rateLimitStore.get(key)
  
  if (!record || now > record.resetTime) {
    record = {
      count: 1,
      resetTime: now + windowMs
    }
    rateLimitStore.set(key, record)
    return {
      allowed: true,
      remaining: limit - 1,
      resetTime: record.resetTime
    }
  }
  
  if (record.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: record.resetTime
    }
  }
  
  record.count++
  rateLimitStore.set(key, record)
  
  return {
    allowed: true,
    remaining: limit - record.count,
    resetTime: record.resetTime
  }
}

/**
 * Apply rate limiting to a request
 */
export function applyRateLimit(
  request: Request,
  limit: number = 100,
  windowMs: number = 60000
): { allowed: boolean; headers: Record<string, string> } {
  // Use IP address or user ID as identifier
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0] : 'unknown'
  const userAgent = request.headers.get('user-agent') || 'unknown'
  const identifier = `${ip}:${userAgent.substring(0, 50)}`
  
  const result = checkRateLimit(identifier, limit, windowMs)
  
  const headers = {
    'X-RateLimit-Limit': limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(result.resetTime / 1000).toString()
  }
  
  return {
    allowed: result.allowed,
    headers
  }
}

/**
 * Validate request origin for CSRF protection
 */
export function validateOrigin(request: Request, allowedOrigins: string[]): boolean {
  const origin = request.headers.get('origin')
  const referer = request.headers.get('referer')
  
  if (!origin && !referer) {
    // Allow requests without origin/referer (e.g., direct API calls)
    return true
  }
  
  const requestOrigin = origin || (referer ? new URL(referer).origin : '')
  
  return allowedOrigins.some(allowed => {
    if (allowed === '*') return true
    if (allowed.startsWith('*.')) {
      const domain = allowed.substring(2)
      return requestOrigin.endsWith(domain)
    }
    return requestOrigin === allowed
  })
}

/**
 * Sanitize input data to prevent XSS
 */
export function sanitizeInput(input: any): any {
  if (typeof input === 'string') {
    return input
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim()
  }
  
  if (Array.isArray(input)) {
    return input.map(sanitizeInput)
  }
  
  if (typeof input === 'object' && input !== null) {
    const sanitized: any = {}
    for (const [key, value] of Object.entries(input)) {
      sanitized[sanitizeInput(key)] = sanitizeInput(value)
    }
    return sanitized
  }
  
  return input
}