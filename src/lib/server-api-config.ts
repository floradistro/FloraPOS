/**
 * Server-side API Configuration
 * Used in API routes to determine which API endpoint to use based on client preferences
 */

export type ApiEnvironment = 'production' | 'docker';

// URLs from environment variables
const PRODUCTION_URL = process.env.NEXT_PUBLIC_PRODUCTION_API_URL || 'https://api.floradistro.com';
const DOCKER_URL = process.env.NEXT_PUBLIC_DOCKER_API_URL || 'http://localhost:8080';

// API Credentials
const CONSUMER_KEY = process.env.NEXT_PUBLIC_WC_CONSUMER_KEY || '';
const CONSUMER_SECRET = process.env.NEXT_PUBLIC_WC_CONSUMER_SECRET || '';

// Log warnings if credentials missing
if (!CONSUMER_KEY || !CONSUMER_SECRET) {
  console.warn('⚠️ MISSING ENV VARS: NEXT_PUBLIC_WC_CONSUMER_KEY and NEXT_PUBLIC_WC_CONSUMER_SECRET should be set');
}

/**
 * Get API environment from request headers or localStorage cookie
 */
export function getApiEnvironmentFromRequest(request: Request): ApiEnvironment {
  // Check for custom header (sent by client)
  const headers = new Headers(request.headers);
  const envHeader = headers.get('x-api-environment');
  
  if (envHeader === 'docker' || envHeader === 'production') {
    return envHeader;
  }
  
  // Check cookies as fallback
  const cookies = headers.get('cookie') || '';
  const apiEnvMatch = cookies.match(/flora_pos_api_environment=([^;]+)/);
  if (apiEnvMatch) {
    const env = apiEnvMatch[1];
    if (env === 'docker' || env === 'production') {
      return env;
    }
  }
  
  // Default to production
  const DEFAULT_ENV = process.env.NEXT_PUBLIC_API_ENVIRONMENT as ApiEnvironment || 'production';
  return DEFAULT_ENV;
}

/**
 * Get base URL for the specified environment
 */
export function getApiBaseUrl(env: ApiEnvironment = 'production'): string {
  if (env === 'docker') return DOCKER_URL;
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
 * Get API credentials (same for all environments)
 */
export function getApiCredentials(env?: ApiEnvironment) {
  return {
    consumerKey: CONSUMER_KEY,
    consumerSecret: CONSUMER_SECRET,
  };
}
