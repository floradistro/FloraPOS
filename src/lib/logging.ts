/**
 * Centralized Logging Service
 * Replaces console.log with structured, configurable logging
 */

// ============================================================================
// Types and Interfaces
// ============================================================================

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  CRITICAL = 4
}

export interface LogContext {
  userId?: string
  storeId?: string
  sessionId?: string
  requestId?: string
  component?: string
  function?: string
  endpoint?: string
  method?: string
  duration?: number
  [key: string]: any
}

export interface LogEntry {
  level: LogLevel
  message: string
  context: LogContext
  timestamp: string
  environment: string
  version?: string
  error?: {
    name: string
    message: string
    stack?: string
  }
}

export interface LoggerConfig {
  level: LogLevel
  environment: string
  enableConsole: boolean
  enableRemote: boolean
  remoteEndpoint?: string
  batchSize: number
  flushInterval: number
  maxRetries: number
  enablePerformanceLogging: boolean
  enableUserTracking: boolean
}

// ============================================================================
// Logger Class
// ============================================================================

class Logger {
  private config: LoggerConfig
  private logBuffer: LogEntry[] = []
  private flushTimer?: NodeJS.Timeout
  private sessionId: string
  private requestCounter = 0

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      level: LogLevel.INFO,
      environment: process.env.NODE_ENV || 'development',
      enableConsole: true,
      enableRemote: process.env.NODE_ENV === 'production',
      batchSize: 10,
      flushInterval: 5000,
      maxRetries: 3,
      enablePerformanceLogging: true,
      enableUserTracking: false,
      ...config
    }

    this.sessionId = this.generateSessionId()
    this.startFlushTimer()
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  private startFlushTimer() {
    if (this.config.enableRemote) {
      this.flushTimer = setInterval(() => {
        this.flush()
      }, this.config.flushInterval)
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.config.level
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    context: LogContext = {},
    error?: Error
  ): LogEntry {
    return {
      level,
      message,
      context: {
        ...context,
        sessionId: this.sessionId,
        requestId: this.generateRequestId()
      },
      timestamp: new Date().toISOString(),
      environment: this.config.environment,
      version: process.env.npm_package_version,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : undefined
    }
  }

  private generateRequestId(): string {
    return `req_${++this.requestCounter}_${Date.now()}`
  }

  private formatConsoleMessage(entry: LogEntry): string {
    const levelEmojis = {
      [LogLevel.DEBUG]: '🐛',
      [LogLevel.INFO]: 'ℹ️',
      [LogLevel.WARN]: '⚠️',
      [LogLevel.ERROR]: '🚨',
      [LogLevel.CRITICAL]: '💥'
    }

    const emoji = levelEmojis[entry.level]
    const timestamp = new Date(entry.timestamp).toLocaleTimeString()
    const context = Object.keys(entry.context).length > 0 
      ? JSON.stringify(entry.context, null, 2)
      : ''

    return `${emoji} [${timestamp}] ${entry.message}${context ? '\nContext: ' + context : ''}`
  }

  private logToConsole(entry: LogEntry) {
    if (!this.config.enableConsole) return

    const formattedMessage = this.formatConsoleMessage(entry)

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(formattedMessage)
        break
      case LogLevel.INFO:
        console.info(formattedMessage)
        break
      case LogLevel.WARN:
        console.warn(formattedMessage)
        break
      case LogLevel.ERROR:
      case LogLevel.CRITICAL:
        console.error(formattedMessage)
        if (entry.error?.stack) {
          console.error('Stack trace:', entry.error.stack)
        }
        break
    }
  }

  private addToBuffer(entry: LogEntry) {
    if (this.config.enableRemote) {
      this.logBuffer.push(entry)
      
      if (this.logBuffer.length >= this.config.batchSize) {
        this.flush()
      }
    }
  }

  private async flush() {
    if (this.logBuffer.length === 0 || !this.config.remoteEndpoint) return

    const logsToSend = [...this.logBuffer]
    this.logBuffer = []

    try {
      await this.sendLogsToRemote(logsToSend)
    } catch (error) {
      // Put logs back in buffer for retry
      this.logBuffer.unshift(...logsToSend)
      console.error('Failed to send logs to remote endpoint:', error)
    }
  }

  private async sendLogsToRemote(logs: LogEntry[], retryCount = 0): Promise<void> {
    if (!this.config.remoteEndpoint || retryCount >= this.config.maxRetries) {
      return
    }

    try {
      const response = await fetch(this.config.remoteEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ logs })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
    } catch (error) {
      if (retryCount < this.config.maxRetries - 1) {
        const delay = Math.pow(2, retryCount) * 1000
        setTimeout(() => {
          this.sendLogsToRemote(logs, retryCount + 1)
        }, delay)
      } else {
        throw error
      }
    }
  }

  private log(level: LogLevel, message: string, context: LogContext = {}, error?: Error) {
    if (!this.shouldLog(level)) return

    const entry = this.createLogEntry(level, message, context, error)
    
    this.logToConsole(entry)
    this.addToBuffer(entry)
  }

  // ============================================================================
  // Public API
  // ============================================================================

  debug(message: string, context: LogContext = {}) {
    this.log(LogLevel.DEBUG, message, context)
  }

  info(message: string, context: LogContext = {}) {
    this.log(LogLevel.INFO, message, context)
  }

  warn(message: string, context: LogContext = {}) {
    this.log(LogLevel.WARN, message, context)
  }

  error(message: string, context: LogContext = {}, error?: Error) {
    this.log(LogLevel.ERROR, message, context, error)
  }

  critical(message: string, context: LogContext = {}, error?: Error) {
    this.log(LogLevel.CRITICAL, message, context, error)
  }

  // ============================================================================
  // Specialized Logging Methods
  // ============================================================================

  performance(operation: string, duration: number, context: LogContext = {}) {
    if (!this.config.enablePerformanceLogging) return

    this.info(`Performance: ${operation}`, {
      ...context,
      duration,
      type: 'performance'
    })
  }

  apiCall(method: string, endpoint: string, duration: number, status: number, context: LogContext = {}) {
    const level = status >= 400 ? LogLevel.ERROR : LogLevel.INFO
    this.log(level, `API Call: ${method} ${endpoint}`, {
      ...context,
      method,
      endpoint,
      duration,
      status,
      type: 'api'
    })
  }

  userAction(action: string, userId?: string, context: LogContext = {}) {
    if (!this.config.enableUserTracking) return

    this.info(`User Action: ${action}`, {
      ...context,
      userId,
      type: 'user_action'
    })
  }

  businessMetric(metric: string, value: number, context: LogContext = {}) {
    this.info(`Business Metric: ${metric}`, {
      ...context,
      metric,
      value,
      type: 'business_metric'
    })
  }

  securityEvent(event: string, severity: 'low' | 'medium' | 'high' | 'critical', context: LogContext = {}) {
    const level = severity === 'critical' ? LogLevel.CRITICAL : 
                  severity === 'high' ? LogLevel.ERROR :
                  severity === 'medium' ? LogLevel.WARN : LogLevel.INFO

    this.log(level, `Security Event: ${event}`, {
      ...context,
      severity,
      type: 'security'
    })
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  setLevel(level: LogLevel) {
    this.config.level = level
  }

  setContext(context: LogContext) {
    // Add persistent context that will be included in all future logs
    Object.assign(this.config, { defaultContext: context })
  }

  async flushNow(): Promise<void> {
    await this.flush()
  }

  destroy() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer)
    }
    this.flush() // Final flush
  }

  // ============================================================================
  // Timer Utilities
  // ============================================================================

  timer(operation: string, context: LogContext = {}) {
    const startTime = performance.now()
    
    return {
      end: () => {
        const duration = performance.now() - startTime
        this.performance(operation, duration, context)
        return duration
      }
    }
  }

  async timeAsync<T>(
    operation: string,
    fn: () => Promise<T>,
    context: LogContext = {}
  ): Promise<T> {
    const timer = this.timer(operation, context)
    try {
      const result = await fn()
      timer.end()
      return result
    } catch (error) {
      const duration = timer.end()
      this.error(`${operation} failed after ${duration}ms`, context, error as Error)
      throw error
    }
  }

  timeSync<T>(
    operation: string,
    fn: () => T,
    context: LogContext = {}
  ): T {
    const timer = this.timer(operation, context)
    try {
      const result = fn()
      timer.end()
      return result
    } catch (error) {
      const duration = timer.end()
      this.error(`${operation} failed after ${duration}ms`, context, error as Error)
      throw error
    }
  }
}

// ============================================================================
// Singleton Instance and Factory
// ============================================================================

let loggerInstance: Logger | null = null

export function createLogger(config: Partial<LoggerConfig> = {}): Logger {
  return new Logger(config)
}

export function getLogger(): Logger {
  if (!loggerInstance) {
    loggerInstance = new Logger({
      level: process.env.NODE_ENV === 'development' ? LogLevel.DEBUG : LogLevel.INFO,
      remoteEndpoint: process.env.LOGGING_ENDPOINT
    })
  }
  return loggerInstance
}

// ============================================================================
// Convenience Exports
// ============================================================================

const logger = getLogger()

export const log = {
  debug: (message: string, context?: LogContext) => logger.debug(message, context),
  info: (message: string, context?: LogContext) => logger.info(message, context),
  warn: (message: string, context?: LogContext) => logger.warn(message, context),
  error: (message: string, context?: LogContext, error?: Error) => logger.error(message, context, error),
  critical: (message: string, context?: LogContext, error?: Error) => logger.critical(message, context, error),
  performance: (operation: string, duration: number, context?: LogContext) => logger.performance(operation, duration, context),
  apiCall: (method: string, endpoint: string, duration: number, status: number, context?: LogContext) => logger.apiCall(method, endpoint, duration, status, context),
  userAction: (action: string, userId?: string, context?: LogContext) => logger.userAction(action, userId, context),
  businessMetric: (metric: string, value: number, context?: LogContext) => logger.businessMetric(metric, value, context),
  securityEvent: (event: string, severity: 'low' | 'medium' | 'high' | 'critical', context?: LogContext) => logger.securityEvent(event, severity, context),
  timer: (operation: string, context?: LogContext) => logger.timer(operation, context),
  timeAsync: <T>(operation: string, fn: () => Promise<T>, context?: LogContext) => logger.timeAsync(operation, fn, context),
  timeSync: <T>(operation: string, fn: () => T, context?: LogContext) => logger.timeSync(operation, fn, context)
}

export default logger
export { Logger }