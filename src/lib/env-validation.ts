/**
 * Environment Variable Validation
 * Validates required environment variables at application startup
 */

interface RequiredEnvVars {
  WOO_API_URL: string;
  WOO_CONSUMER_KEY: string;
  WOO_CONSUMER_SECRET: string;
  JWT_SECRET: string;
  NEXTAUTH_SECRET?: string;
  NODE_ENV: string;
}

interface OptionalEnvVars {
  NEXT_PUBLIC_APP_URL?: string;
  DATABASE_URL?: string;
  REDIS_URL?: string;
  SENTRY_DSN?: string;
  ANALYTICS_ID?: string;
}

class EnvironmentValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EnvironmentValidationError';
  }
}

/**
 * Validates that all required environment variables are present and properly formatted
 */
export function validateEnvironmentVariables(): RequiredEnvVars & OptionalEnvVars {
  const errors: string[] = [];
  
  // Required environment variables
  const requiredVars: (keyof RequiredEnvVars)[] = [
    'WOO_API_URL',
    'WOO_CONSUMER_KEY', 
    'WOO_CONSUMER_SECRET',
    'JWT_SECRET',
    'NODE_ENV'
  ];

  const env: Partial<RequiredEnvVars & OptionalEnvVars> = {};

  // Validate required variables
  for (const varName of requiredVars) {
    const value = process.env[varName];
    
    if (!value || value.trim() === '') {
      errors.push(`Missing required environment variable: ${varName}`);
      continue;
    }

    // Specific validation rules
    switch (varName) {
      case 'WOO_API_URL':
        if (!isValidUrl(value)) {
          errors.push(`Invalid WOO_API_URL format: ${value}`);
        }
        break;
      
      case 'WOO_CONSUMER_KEY':
        if (value.length < 10) {
          errors.push('WOO_CONSUMER_KEY must be at least 10 characters long');
        }
        break;
      
      case 'WOO_CONSUMER_SECRET':
        if (value.length < 10) {
          errors.push('WOO_CONSUMER_SECRET must be at least 10 characters long');
        }
        break;
      
      case 'JWT_SECRET':
        if (value.length < 32) {
          errors.push('JWT_SECRET must be at least 32 characters long for security');
        }
        break;
      
      case 'NODE_ENV':
        if (!['development', 'production', 'test'].includes(value)) {
          errors.push('NODE_ENV must be one of: development, production, test');
        }
        break;
    }

    env[varName] = value;
  }

  // Optional variables with validation
  const optionalVars: (keyof OptionalEnvVars)[] = [
    // 'NEXTAUTH_SECRET',
    'NEXT_PUBLIC_APP_URL',
    'DATABASE_URL',
    'REDIS_URL',
    'SENTRY_DSN',
    'ANALYTICS_ID'
  ];

  for (const varName of optionalVars) {
    const value = process.env[varName];
    
    if (value) {
      switch (varName) {
        case 'NEXT_PUBLIC_APP_URL':
          if (!isValidUrl(value)) {
            errors.push(`Invalid NEXT_PUBLIC_APP_URL format: ${value}`);
          }
          break;
        
        case 'DATABASE_URL':
          if (!value.startsWith('postgresql://') && !value.startsWith('mysql://')) {
            errors.push('DATABASE_URL must start with postgresql:// or mysql://');
          }
          break;
        
        case 'REDIS_URL':
          if (!value.startsWith('redis://') && !value.startsWith('rediss://')) {
            errors.push('REDIS_URL must start with redis:// or rediss://');
          }
          break;
        
        // case 'NEXTAUTH_SECRET':
          if (value.length < 32) {
            errors.push('NEXTAUTH_SECRET must be at least 32 characters long');
          }
          break;
      }
      
      env[varName] = value;
    }
  }

  // Production-specific validations
  if (env.NODE_ENV === 'production') {
    if (!env.NEXTAUTH_SECRET && !env.JWT_SECRET) {
      errors.push('Either NEXTAUTH_SECRET or JWT_SECRET is required in production');
    }
    
    if (env.WOO_API_URL?.includes('localhost') || env.WOO_API_URL?.includes('127.0.0.1')) {
      errors.push('WOO_API_URL should not point to localhost in production');
    }
  }

  if (errors.length > 0) {
    const errorMessage = `Environment validation failed:\n${errors.map(err => `  - ${err}`).join('\n')}`;
    throw new EnvironmentValidationError(errorMessage);
  }

  return env as RequiredEnvVars & OptionalEnvVars;
}

/**
 * Validates URL format
 */
function isValidUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Initialize environment validation
 * Call this at application startup
 */
export function initializeEnvironment(): RequiredEnvVars & OptionalEnvVars {
  try {
    const validatedEnv = validateEnvironmentVariables();
    
    console.log('✅ Environment validation passed');
    console.log(`📍 Environment: ${validatedEnv.NODE_ENV}`);
    console.log(`🔗 WooCommerce API: ${validatedEnv.WOO_API_URL}`);
    
    return validatedEnv;
  } catch (error) {
    console.error('❌ Environment validation failed:');
    console.error(error instanceof Error ? error.message : String(error));
    
    // In production, exit the process if validation fails
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
    
    throw error;
  }
}

// Auto-initialize in production or when explicitly requested
if (process.env.NODE_ENV === 'production' || process.env.VALIDATE_ENV === 'true') {
  initializeEnvironment();
}