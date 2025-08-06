import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

// JWT_SECRET will be accessed within the middleware function
// to ensure it's available at runtime, not build time

// Routes that require authentication
const protectedRoutes = [
  '/api/stores',
  '/api/users',
  '/api/terminals',
  '/api/orders',
  '/api/reports',
]

// Routes that don't require authentication
const publicRoutes = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/health',
  '/api/stores/public',
]

interface TokenPayload {
  userId: number
  email: string
  role: string
  storeId: string
  terminalId: string
  iat: number
  exp: number
}

function isProtectedRoute(pathname: string): boolean {
  return protectedRoutes.some(route => pathname.startsWith(route))
}

function isPublicRoute(pathname: string): boolean {
  return publicRoutes.some(route => pathname.startsWith(route))
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware for static files and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next()
  }

  // Allow public routes
  if (isPublicRoute(pathname)) {
    return NextResponse.next()
  }

  // Check if route requires authentication
  if (isProtectedRoute(pathname)) {
    const authHeader = request.headers.get('authorization')
    let token: string | null = null
    
    // Try to get token from Authorization header first
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim()
    } else {
      // Fallback to HTTP-only cookie
      const cookieToken = request.cookies.get('flora_auth_token')
      if (cookieToken) {
        token = cookieToken.value
      }
    }

    if (!token) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization token' },
        { status: 401 }
      )
    }

    // Check if token is empty or obviously malformed
    if (!token || token.length < 10) {
      return NextResponse.json(
        { error: 'Invalid token format' },
        { status: 401 }
      )
    }

    try {
      // Check if this is a JWT token or WordPress hash
      if (token.includes('.')) {
        // This looks like a JWT token
        const JWT_SECRET = process.env.JWT_SECRET
        if (!JWT_SECRET) {
          return NextResponse.json(
            { error: 'Server configuration error' },
            { status: 500 }
          )
        }

        // Verify the JWT token using jose
        const secret = new TextEncoder().encode(JWT_SECRET)
        const { payload } = await jwtVerify(token, secret)
        const decoded = payload as unknown as TokenPayload
        
        // Validate required fields for JWT
        if (!decoded.userId || !decoded.email || !decoded.role) {
          return NextResponse.json(
            { error: 'Invalid token payload' },
            { status: 401 }
          )
        }

        // Check if token is expired
        if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
          return NextResponse.json(
            { error: 'Token expired' },
            { status: 401 }
          )
        }

        // Add user info to request headers for JWT tokens
        const requestHeaders = new Headers(request.headers)
        requestHeaders.set('x-user-id', decoded.userId.toString())
        requestHeaders.set('x-user-email', decoded.email)
        requestHeaders.set('x-user-role', decoded.role)
        requestHeaders.set('x-store-id', decoded.storeId || '')
        requestHeaders.set('x-terminal-id', decoded.terminalId || '')

        return NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        })
      } else {
        // This is a WordPress hash token from Addify plugin or a bypass token
        // Accept it if it's properly formatted (basic validation)
        
        // Special bypass token for POS system
        if (token === 'flora-pos-bypass-token') {
          return NextResponse.next()
        }
        
        if (token.length < 32) {
          return NextResponse.json(
            { error: 'Invalid token format' },
            { status: 401 }
          )
        }
        
        // For WordPress hash tokens, just proceed without user info headers
        return NextResponse.next()
      }

    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
} 