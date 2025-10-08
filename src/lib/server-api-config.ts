/**
 * Server-side API Configuration
 * Used in API routes to determine which API endpoint to use based on client preferences
 */

export type ApiEnvironment = 'production' | 'staging' | 'docker';

// URLs from environment variables
const PRODUCTION_URL = process.env.NEXT_PUBLIC_PRODUCTION_API_URL || '';
const DOCKER_URL = process.env.NEXT_PUBLIC_DOCKER_API_URL || '';
// Staging URL is optional - defaults to production if not set
const STAGING_URL = process.env.NEXT_PUBLIC_STAGING_API_URL || PRODUCTION_URL;

// API Credentials - Production
const CONSUMER_KEY = process.env.NEXT_PUBLIC_WC_CONSUMER_KEY || '';
const CONSUMER_SECRET = process.env.NEXT_PUBLIC_WC_CONSUMER_SECRET || '';

// Staging-specific credentials (optional - defaults to production keys)
const STAGING_CONSUMER_KEY = process.env.NEXT_PUBLIC_STAGING_WC_CONSUMER_KEY || CONSUMER_KEY;
const STAGING_CONSUMER_SECRET = process.env.NEXT_PUBLIC_STAGING_WC_CONSUMER_SECRET || CONSUMER_SECRET;

// Log warnings instead of throwing errors (errors will be handled at request time)
if (!PRODUCTION_URL || !DOCKER_URL) {
  console.warn('⚠️ MISSING ENV VARS: NEXT_PUBLIC_PRODUCTION_API_URL and NEXT_PUBLIC_DOCKER_API_URL should be set');
}

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
  
  // Default to staging from environment variable
  const DEFAULT_ENV = process.env.NEXT_PUBLIC_API_ENVIRONMENT as ApiEnvironment || 'staging';
  return DEFAULT_ENV;
}

/**
 * Get base URL for the specified environment
 */
export function getApiBaseUrl(env: ApiEnvironment = 'staging'): string {
  if (env === 'docker') return DOCKER_URL || 'http://localhost:8080';
  if (env === 'staging') return STAGING_URL || PRODUCTION_URL || 'https://api.floradistro.com';
  return PRODUCTION_URL || 'https://api.floradistro.com';
}

/**
 * Get full API URL with wp-json path
 */
export function getApiUrl(path: string, env: ApiEnvironment = 'staging'): string {
  const base = getApiBaseUrl(env);
  return `${base}/wp-json${path}`;
}

/**
 * Get API credentials for specified environment
 */
export function getApiCredentials(env?: ApiEnvironment) {
  const environment = env || 'staging';
  
  if (environment === 'staging') {
    return {
      consumerKey: STAGING_CONSUMER_KEY || CONSUMER_KEY || 'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5',
      consumerSecret: STAGING_CONSUMER_SECRET || CONSUMER_SECRET || 'cs_38194e74c7ddc5d72b6c32c70485728e7e529678',
    };
  }
  
  return {
    consumerKey: CONSUMER_KEY || 'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5',
    consumerSecret: CONSUMER_SECRET || 'cs_38194e74c7ddc5d72b6c32c70485728e7e529678',
  };
}
