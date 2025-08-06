/**
 * Example Secure API Route
 * Demonstrates the use of encrypted storage and rate limiting
 */

import { NextRequest } from 'next/server'
import { withApiSecurity, getSanitizedBody } from '@/lib/api-security-wrapper'
import { createSecureResponse } from '@/lib/security-headers'

// Example of a protected API route with auth rate limiting
export const POST = withApiSecurity(
  async (request: NextRequest) => {
    const body = await getSanitizedBody(request)
    
    // Simulate some processing
    const result = {
      message: 'Data processed successfully',
      data: body,
      timestamp: new Date().toISOString()
    }
    
    return createSecureResponse(result)
  },
  {
    rateLimiter: 'auth', // Use strict auth rate limiter (5 requests per 15 minutes)
    requireAuth: true,
    allowedOrigins: ['http://localhost:3000'],
    sanitizeInputs: true
  }
)

// Example of a public API route with custom rate limiting
export const GET = withApiSecurity(
  async (request: NextRequest) => {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('query') || ''
    
    // Simulate search results
    const results = {
      query,
      results: [
        { id: 1, title: 'Example Result 1' },
        { id: 2, title: 'Example Result 2' }
      ],
      total: 2,
      timestamp: new Date().toISOString()
    }
    
    return createSecureResponse(results)
  },
  {
    customRateLimit: { limit: 30, windowMs: 60000 }, // 30 requests per minute
    requireAuth: false,
    allowedOrigins: ['http://localhost:3000'],
    sanitizeInputs: false // No body to sanitize for GET requests
  }
)

// Example of a file upload endpoint with upload rate limiting
export const PUT = withApiSecurity(
  async (request: NextRequest) => {
    const body = await getSanitizedBody(request)
    
    // Simulate file processing
    const result = {
      message: 'File uploaded successfully',
      fileId: `file_${Date.now()}`,
      size: body?.size || 0,
      timestamp: new Date().toISOString()
    }
    
    return createSecureResponse(result)
  },
  {
    rateLimiter: 'upload', // Use upload rate limiter (10 requests per minute)
    requireAuth: true,
    allowedOrigins: ['http://localhost:3000'],
    sanitizeInputs: true
  }
)