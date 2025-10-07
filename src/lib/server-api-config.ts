/**
 * Server-side API Configuration
 * Used in API routes to determine which API endpoint to use based on client preferences
 */

export type ApiEnvironment = 'production' | 'staging' | 'docker';

// URLs from environment variables - NO FALLBACKS
const PRODUCTION_URL = process.env.NEXT_PUBLIC_PRODUCTION_API_URL!;
const STAGING_URL = process.env.NEXT_PUBLIC_STAGING_API_URL!;
const DOCKER_URL = process.env.NEXT_PUBLIC_DOCKER_API_URL!;

// Validate required environment variables
if (!PRODUCTION_URL || !STAGING_URL || !DOCKER_URL) {
  throw new Error('❌ MISSING REQUIRED ENV VARS: NEXT_PUBLIC_PRODUCTION_API_URL, NEXT_PUBLIC_STAGING_API_URL, and NEXT_PUBLIC_DOCKER_API_URL must be set');
}

// API Credentials - NO FALLBACKS
const CONSUMER_KEY = process.env.NEXT_PUBLIC_WC_CONSUMER_KEY!;
const CONSUMER_SECRET = process.env.NEXT_PUBLIC_WC_CONSUMER_SECRET!;

if (!CONSUMER_KEY || !CONSUMER_SECRET) {
  throw new Error('❌ MISSING REQUIRED ENV VARS: NEXT_PUBLIC_WC_CONSUMER_KEY and NEXT_PUBLIC_WC_CONSUMER_SECRET must be set');
}

/**
 * Get API environment from request headers or localStorage cookie
 */
export function getApiEnvironmentFromRequest(request: Request): ApiEnvironment {
  // Check for custom header (sent by client)
  const headers = new Headers(request.headers);
  const envHeader = headers.get('x-api-environment');
  
  if (envHeader === 'docker' || envHeader === 'staging' || envHeader === 'production') {
    return envHeader;
  }
  
  // Check cookies as fallback
  const cookies = headers.get('cookie') || '';
  const apiEnvMatch = cookies.match(/flora_pos_api_environment=([^;]+)/);
  if (apiEnvMatch) {
    const env = apiEnvMatch[1];
    if (env === 'docker' || env === 'staging' || env === 'production') {
      return env;
    }
  }
  
  // Default to docker for local development
  return 'docker';
}

/**
 * Get base URL for the specified environment
 */
export function getApiBaseUrl(env: ApiEnvironment = 'production'): string {
  if (env === 'docker') return DOCKER_URL;
  if (env === 'staging') return STAGING_URL;
  return PRODUCTION_URL;
}

/**
 * Get full API URL with wp-json path
 */
export function getApiUrl(path: string, env: ApiEnvironment = 'production'): string {
  const base = getApiBaseUrl(env);
  return `${base}/wp-json${path}`;
}

/**
 * Get API credentials
 */
export function getApiCredentials() {
  return {
    consumerKey: CONSUMER_KEY,
    consumerSecret: CONSUMER_SECRET,
  };
}
