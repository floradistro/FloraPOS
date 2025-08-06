/**
 * Shared Error Handling Utilities
 * Provides centralized error types, handling functions, and utilities
 */

// ============================================================================
// Error Types
// ============================================================================

export enum ErrorType {
  NETWORK = 'NETWORK_ERROR',
  VALIDATION = 'VALIDATION_ERROR',
  AUTHENTICATION = 'AUTHENTICATION_ERROR',
  AUTHORIZATION = 'AUTHORIZATION_ERROR',
  NOT_FOUND = 'NOT_FOUND_ERROR',
  RATE_LIMIT = 'RATE_LIMIT_ERROR',
  SERVER = 'SERVER_ERROR',
  CLIENT = 'CLIENT_ERROR',
  TIMEOUT = 'TIMEOUT_ERROR',
  UNKNOWN = 'UNKNOWN_ERROR'
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface ErrorContext {
  userId?: string
  storeId?: string
  productId?: string
  orderId?: string
  customerId?: string
  endpoint?: string
  method?: string
  userAgent?: string
  timestamp?: string
  sessionId?: string
  [key: string]: any
}

export class AppError extends Error {
  public readonly type: ErrorType
  public readonly severity: ErrorSeverity
  public readonly context: ErrorContext
  public readonly code: string
  public readonly statusCode: number
  public readonly isOperational: boolean
  public readonly timestamp: string

  constructor(
    message: string,
    type: ErrorType = ErrorType.UNKNOWN,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    statusCode: number = 500,
    context: ErrorContext = {},
    isOperational: boolean = true
  ) {
    super(message)
    
    this.name = 'AppError'
    this.type = type
    this.severity = severity
    this.context = context
    this.code = this.generateErrorCode(type, severity)
    this.statusCode = statusCode
    this.isOperational = isOperational
    this.timestamp = new Date().toISOString()

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError)
    }
  }

  private generateErrorCode(type: ErrorType, severity: ErrorSeverity): string {
    const typeCode = type.split('_')[0].substring(0, 3).toUpperCase()
    const severityCode = severity.substring(0, 1).toUpperCase()
    const timestamp = Date.now().toString().slice(-6)
    return `${typeCode}_${severityCode}_${timestamp}`
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      type: this.type,
      severity: this.severity,
      code: this.code,
      statusCode: this.statusCode,
      context: this.context,
      timestamp: this.timestamp,
      stack: this.stack
    }
  }
}

// ============================================================================
// Error Factory Functions
// ============================================================================

export const createNetworkError = (
  message: string,
  context: ErrorContext = {}
): AppError => {
  return new AppError(
    message,
    ErrorType.NETWORK,
    ErrorSeverity.HIGH,
    0,
    context
  )
}

export const createValidationError = (
  message: string,
  context: ErrorContext = {}
): AppError => {
  return new AppError(
    message,
    ErrorType.VALIDATION,
    ErrorSeverity.MEDIUM,
    400,
    context
  )
}

export const createAuthError = (
  message: string,
  context: ErrorContext = {}
): AppError => {
  return new AppError(
    message,
    ErrorType.AUTHENTICATION,
    ErrorSeverity.HIGH,
    401,
    context
  )
}

export const createNotFoundError = (
  resource: string,
  context: ErrorContext = {}
): AppError => {
  return new AppError(
    `${resource} not found`,
    ErrorType.NOT_FOUND,
    ErrorSeverity.MEDIUM,
    404,
    context
  )
}

export const createRateLimitError = (
  context: ErrorContext = {}
): AppError => {
  return new AppError(
    'Rate limit exceeded',
    ErrorType.RATE_LIMIT,
    ErrorSeverity.MEDIUM,
    429,
    context
  )
}

export const createServerError = (
  message: string,
  context: ErrorContext = {}
): AppError => {
  return new AppError(
    message,
    ErrorType.SERVER,
    ErrorSeverity.HIGH,
    500,
    context
  )
}

// ============================================================================
// Error Handling Functions
// ============================================================================

export interface ErrorHandlerOptions {
  shouldThrow?: boolean
  shouldLog?: boolean
  fallbackValue?: any
  retryable?: boolean
  maxRetries?: number
  onError?: (error: AppError) => void
}

export async function handleAsyncError<T>(
  operation: () => Promise<T>,
  options: ErrorHandlerOptions = {}
): Promise<T | null> {
  const {
    shouldThrow = false,
    shouldLog = true,
    fallbackValue = null,
    retryable = false,
    maxRetries = 3,
    onError
  } = options

  let lastError: AppError
  const attempts = retryable ? maxRetries : 1

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = normalizeError(error)
      
      if (shouldLog) {
        logError(lastError, { attempt, maxAttempts: attempts })
      }

      if (onError) {
        onError(lastError)
      }

      // Don't retry on certain error types
      if (retryable && attempt < attempts && isRetryableError(lastError)) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000)
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }

      break
    }
  }

  if (shouldThrow) {
    throw lastError!
  }

  return fallbackValue
}

export function handleSyncError<T>(
  operation: () => T,
  options: ErrorHandlerOptions = {}
): T | null {
  const {
    shouldThrow = false,
    shouldLog = true,
    fallbackValue = null,
    onError
  } = options

  try {
    return operation()
  } catch (error) {
    const appError = normalizeError(error)
    
    if (shouldLog) {
      logError(appError)
    }

    if (onError) {
      onError(appError)
    }

    if (shouldThrow) {
      throw appError
    }

    return fallbackValue
  }
}

// ============================================================================
// Error Utilities
// ============================================================================

export function normalizeError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error
  }

  if (error instanceof Error) {
    // Try to determine error type from common patterns
    const message = error.message.toLowerCase()
    
    if (message.includes('network') || message.includes('fetch')) {
      return createNetworkError(error.message)
    }
    
    if (message.includes('validation') || message.includes('invalid')) {
      return createValidationError(error.message)
    }
    
    if (message.includes('unauthorized') || message.includes('authentication')) {
      return createAuthError(error.message)
    }
    
    if (message.includes('not found')) {
      return createNotFoundError(error.message)
    }
    
    return new AppError(error.message, ErrorType.UNKNOWN)
  }

  if (typeof error === 'string') {
    return new AppError(error, ErrorType.UNKNOWN)
  }

  return new AppError('An unknown error occurred', ErrorType.UNKNOWN)
}

export function isRetryableError(error: AppError): boolean {
  const retryableTypes = [
    ErrorType.NETWORK,
    ErrorType.TIMEOUT,
    ErrorType.RATE_LIMIT,
    ErrorType.SERVER
  ]
  
  // Don't retry client errors (4xx) except rate limiting
  if (error.statusCode >= 400 && error.statusCode < 500 && error.type !== ErrorType.RATE_LIMIT) {
    return false
  }
  
  return retryableTypes.includes(error.type)
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof AppError) {
    return error.message
  }
  
  if (error instanceof Error) {
    return error.message
  }
  
  if (typeof error === 'string') {
    return error
  }
  
  return 'An unknown error occurred'
}

export function getErrorContext(error: unknown): ErrorContext {
  if (error instanceof AppError) {
    return error.context
  }
  
  return {}
}

// ============================================================================
// Response Error Handling
// ============================================================================

export async function handleApiResponse<T>(
  response: Response,
  context: ErrorContext = {}
): Promise<T> {
  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`
    
    try {
      const errorData = await response.json()
      if (errorData.message) {
        errorMessage = errorData.message
      } else if (errorData.error) {
        errorMessage = errorData.error
      }
    } catch {
      // Fallback to status text if JSON parsing fails
    }

    const errorType = getErrorTypeFromStatus(response.status)
    const severity = getSeverityFromStatus(response.status)
    
    throw new AppError(
      errorMessage,
      errorType,
      severity,
      response.status,
      { ...context, endpoint: response.url, method: 'unknown' }
    )
  }

  try {
    return await response.json()
  } catch (error) {
    throw new AppError(
      'Failed to parse response JSON',
      ErrorType.CLIENT,
      ErrorSeverity.MEDIUM,
      500,
      context
    )
  }
}

function getErrorTypeFromStatus(status: number): ErrorType {
  if (status === 401) return ErrorType.AUTHENTICATION
  if (status === 403) return ErrorType.AUTHORIZATION
  if (status === 404) return ErrorType.NOT_FOUND
  if (status === 429) return ErrorType.RATE_LIMIT
  if (status >= 400 && status < 500) return ErrorType.CLIENT
  if (status >= 500) return ErrorType.SERVER
  return ErrorType.UNKNOWN
}

function getSeverityFromStatus(status: number): ErrorSeverity {
  if (status === 401 || status === 403) return ErrorSeverity.HIGH
  if (status >= 500) return ErrorSeverity.HIGH
  if (status === 429) return ErrorSeverity.MEDIUM
  return ErrorSeverity.LOW
}

// ============================================================================
// Logging Integration
// ============================================================================

function logError(error: AppError, meta: Record<string, any> = {}) {
  // This will be replaced by the proper logging service
  const logData = {
    ...error.toJSON(),
    ...meta
  }
  
  // For now, use console with structured logging
  if (error.severity === ErrorSeverity.CRITICAL || error.severity === ErrorSeverity.HIGH) {
    console.error('🚨 ERROR:', logData)
  } else if (error.severity === ErrorSeverity.MEDIUM) {
    console.warn('⚠️ WARNING:', logData)
  } else {
    console.info('ℹ️ INFO:', logData)
  }
}

// ============================================================================
// Error Recovery Utilities
// ============================================================================

export interface RetryOptions {
  maxRetries: number
  baseDelay: number
  maxDelay: number
  exponentialBase: number
  jitter: boolean
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    exponentialBase = 2,
    jitter = true
  } = options

  let lastError: AppError

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = normalizeError(error)
      
      if (attempt > maxRetries || !isRetryableError(lastError)) {
        throw lastError
      }

      let delay = Math.min(baseDelay * Math.pow(exponentialBase, attempt - 1), maxDelay)
      
      if (jitter) {
        delay = delay * (0.5 + Math.random() * 0.5)
      }

      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw lastError!
}

export function createErrorBoundaryHandler(componentName: string) {
  return (error: Error, errorInfo: { componentStack: string }) => {
    const appError = new AppError(
      `Error in ${componentName}: ${error.message}`,
      ErrorType.CLIENT,
      ErrorSeverity.HIGH,
      500,
      {
        componentName,
        componentStack: errorInfo.componentStack,
        originalError: error.name
      }
    )
    
    logError(appError)
  }
}