/**
 * API Configuration Manager
 * Handles switching between Docker (local), Staging, and Production API endpoints
 */

export type ApiEnvironment = 'production' | 'staging' | 'docker';

const STORAGE_KEY = 'flora_pos_api_environment';

// URLs from environment variables
const PRODUCTION_URL = process.env.NEXT_PUBLIC_PRODUCTION_API_URL!;
const DOCKER_URL = process.env.NEXT_PUBLIC_DOCKER_API_URL!;
// Staging URL is optional - defaults to production if not set
const STAGING_URL = process.env.NEXT_PUBLIC_STAGING_API_URL || PRODUCTION_URL;

// Validate required environment variables at startup
if (!PRODUCTION_URL || !DOCKER_URL) {
  throw new Error('❌ MISSING REQUIRED ENV VARS: NEXT_PUBLIC_PRODUCTION_API_URL and NEXT_PUBLIC_DOCKER_API_URL must be set in .env.local');
}

// Log staging URL status
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  if (!process.env.NEXT_PUBLIC_STAGING_API_URL) {
    console.warn('⚠️ NEXT_PUBLIC_STAGING_API_URL not set - using production URL for staging');
  }
}

// API Credentials from environment variables - NO FALLBACKS
const CONSUMER_KEY = process.env.NEXT_PUBLIC_WC_CONSUMER_KEY!;
const CONSUMER_SECRET = process.env.NEXT_PUBLIC_WC_CONSUMER_SECRET!;

if (!CONSUMER_KEY || !CONSUMER_SECRET) {
  throw new Error('❌ MISSING REQUIRED ENV VARS: NEXT_PUBLIC_WC_CONSUMER_KEY and NEXT_PUBLIC_WC_CONSUMER_SECRET must be set in .env.local');
}

// Get default environment from build-time environment variable - NO FALLBACK
const DEFAULT_ENV = process.env.NEXT_PUBLIC_API_ENVIRONMENT as ApiEnvironment || (() => {
  throw new Error('❌ MISSING REQUIRED ENV VAR: NEXT_PUBLIC_API_ENVIRONMENT must be set in .env.local');
})();
const BUILD_ENV = process.env.NEXT_PUBLIC_ENVIRONMENT || 'local';
const IS_PRODUCTION_BUILD = BUILD_ENV === 'production';

// Log environment info on module load (development only)
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║           Flora POS - API Environment Config              ║');
  console.log('╠════════════════════════════════════════════════════════════╣');
  console.log(`║ Build Environment: ${BUILD_ENV.toUpperCase().padEnd(40)} ║`);
  console.log(`║ Default API: ${DEFAULT_ENV.toUpperCase().padEnd(46)} ║`);
  console.log(`║ Toggle Enabled: ${(!IS_PRODUCTION_BUILD ? 'YES' : 'NO').padEnd(44)} ║`);
  console.log(`║ Docker URL: ${DOCKER_URL.padEnd(46)} ║`);
  console.log(`║ Staging URL: ${STAGING_URL.padEnd(44)} ║`);
  console.log(`║ Production URL: ${PRODUCTION_URL.padEnd(39)} ║`);
  console.log('╚════════════════════════════════════════════════════════════╝');
}

export class ApiConfig {
  /**
   * Get the current API environment setting
   * Priority:
   * 1. If production build -> always use 'production' (no toggle)
   * 2. If local build -> check localStorage for toggle (defaults to DEFAULT_ENV)
   * 3. Server-side -> use DEFAULT_ENV
   */
  static getEnvironment(): ApiEnvironment {
    // Server-side or production build -> use default from env vars
    if (typeof window === 'undefined') {
      return DEFAULT_ENV;
    }
    
    // Production builds are LOCKED to production API (safety guardrail)
    if (IS_PRODUCTION_BUILD) {
      return 'production';
    }
    
    // Local development -> check localStorage toggle, default to env var
    const stored = localStorage.getItem(STORAGE_KEY);
    return (stored === 'docker' || stored === 'staging' || stored === 'production') ? stored : DEFAULT_ENV;
  }

  /**
   * Set the API environment
   * Only works in local development - production builds are locked
   */
  static setEnvironment(env: ApiEnvironment): void {
    if (typeof window === 'undefined') return;
    
    // Production builds cannot switch environments (safety guardrail)
    if (IS_PRODUCTION_BUILD) {
      console.warn('⚠️ Cannot switch API environment in production build');
      return;
    }
    
    localStorage.setItem(STORAGE_KEY, env);
    console.log(`🔄 API Environment switched to: ${env.toUpperCase()}`);
    const url = env === 'docker' ? DOCKER_URL : env === 'staging' ? STAGING_URL : PRODUCTION_URL;
    console.log(`🔄 New base URL: ${url}`);
  }

  /**
   * Get the base URL for the current environment
   */
  static getBaseUrl(): string {
    const env = this.getEnvironment();
    if (env === 'docker') return DOCKER_URL;
    if (env === 'staging') return STAGING_URL;
    return PRODUCTION_URL;
  }

  /**
   * Get the full API URL with wp-json path
   */
  static getApiUrl(path: string = ''): string {
    const base = this.getBaseUrl();
    const wpJson = '/wp-json';
    return path ? `${base}${wpJson}${path}` : `${base}${wpJson}`;
  }

  /**
   * Get API credentials
   */
  static getCredentials() {
    return {
      consumerKey: CONSUMER_KEY,
      consumerSecret: CONSUMER_SECRET,
    };
  }

  /**
   * Check if currently using Docker API
   */
  static isDocker(): boolean {
    return this.getEnvironment() === 'docker';
  }

  /**
   * Check if currently using Staging API
   */
  static isStaging(): boolean {
    return this.getEnvironment() === 'staging';
  }

  /**
   * Check if currently using Production API
   */
  static isProduction(): boolean {
    return this.getEnvironment() === 'production';
  }

  /**
   * Get formatted display name
   */
  static getDisplayName(): string {
    const env = this.getEnvironment();
    const buildInfo = IS_PRODUCTION_BUILD ? ' [LOCKED]' : '';
    if (env === 'docker') {
      return `Docker (${DOCKER_URL})${buildInfo}`;
    }
    if (env === 'staging') {
      return `Staging (${STAGING_URL})${buildInfo}`;
    }
    return `Production${buildInfo}`;
  }

  /**
   * Check if environment toggle is enabled (only in local builds)
   */
  static canToggleEnvironment(): boolean {
    return !IS_PRODUCTION_BUILD;
  }

  /**
   * Get build environment info
   */
  static getBuildInfo() {
    return {
      environment: BUILD_ENV,
      isProduction: IS_PRODUCTION_BUILD,
      canToggle: !IS_PRODUCTION_BUILD,
      defaultEnv: DEFAULT_ENV,
      currentEnv: this.getEnvironment(),
    };
  }

  /**
   * Get status indicator
   */
  static getStatus(): { color: string; label: string; url: string } {
    const env = this.getEnvironment();
    if (env === 'docker') {
      return {
        color: 'orange',
        label: 'Docker',
        url: DOCKER_URL,
      };
    }
    if (env === 'staging') {
      return {
        color: 'yellow',
        label: 'Staging',
        url: STAGING_URL,
      };
    }
    return {
      color: 'blue',
      label: 'Production',
      url: PRODUCTION_URL,
    };
  }
}

/**
 * Server-side API configuration
 * Used in API routes where localStorage is not available
 */
export class ServerApiConfig {
  /**
   * Get the API environment from request headers or default to production
   */
  static getEnvironment(headers?: Headers): ApiEnvironment {
    // Check for custom header that client can send
    const envHeader = headers?.get('x-api-environment');
    return (envHeader === 'docker' || envHeader === 'staging' || envHeader === 'production') ? envHeader : 'production';
  }

  /**
   * Get the base URL for the specified environment
   */
  static getBaseUrl(env: ApiEnvironment = 'production'): string {
    if (env === 'docker') return DOCKER_URL;
    if (env === 'staging') return STAGING_URL;
    return PRODUCTION_URL;
  }

  /**
   * Get the full API URL with wp-json path
   */
  static getApiUrl(path: string = '', env: ApiEnvironment = 'production'): string {
    const base = this.getBaseUrl(env);
    const wpJson = '/wp-json';
    return path ? `${base}${wpJson}${path}` : `${base}${wpJson}`;
  }

  /**
   * Get API credentials
   */
  static getCredentials() {
    return {
      consumerKey: CONSUMER_KEY,
      consumerSecret: CONSUMER_SECRET,
    };
  }
}
