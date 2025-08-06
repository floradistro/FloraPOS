/**
 * React Error Boundaries for better error handling and user experience
 */

'use client'

import React, { Component, ReactNode, ErrorInfo } from 'react'
import { AppError, ErrorType, ErrorSeverity, createErrorBoundaryHandler } from '@/lib/error-handling'
import { log } from '@/lib/logging'

// ============================================================================
// Error Boundary Props and State
// ============================================================================

export interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode | ((error: Error, errorInfo: ErrorInfo) => ReactNode)
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  resetOnPropsChange?: boolean
  resetKeys?: Array<string | number>
  isolate?: boolean
  level?: 'page' | 'section' | 'component'
  name?: string
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  errorId: string | null
}

// ============================================================================
// Main Error Boundary Component
// ============================================================================

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private resetTimeoutId: number | null = null
  private prevResetKeys: Array<string | number> = []

  constructor(props: ErrorBoundaryProps) {
    super(props)
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    }

    this.prevResetKeys = props.resetKeys || []
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
      errorId: `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { onError, name = 'ErrorBoundary', level = 'component' } = this.props
    
    this.setState({ errorInfo })

    // Create structured error for logging
    const appError = new AppError(
      `Error caught by ${name}: ${error.message}`,
      ErrorType.CLIENT,
      level === 'page' ? ErrorSeverity.CRITICAL : 
      level === 'section' ? ErrorSeverity.HIGH : ErrorSeverity.MEDIUM,
      500,
      {
        boundaryName: name,
        boundaryLevel: level,
        componentStack: errorInfo.componentStack,
        errorBoundary: true,
        originalError: {
          name: error.name,
          message: error.message,
          stack: error.stack
        }
      }
    )

    // Log the error
    log.error(`Error Boundary: ${name}`, {
      boundaryName: name,
      boundaryLevel: level,
      componentStack: errorInfo.componentStack
    }, appError)

    // Call the error handler
    const errorHandler = createErrorBoundaryHandler(name)
    errorHandler(error, errorInfo)

    // Call custom error handler if provided
    if (onError) {
      onError(error, errorInfo)
    }

    // Auto-reset after some time for non-critical errors
    if (level !== 'page' && level !== 'section') {
      this.resetTimeoutId = window.setTimeout(() => {
        this.resetErrorBoundary()
      }, 5000)
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const { resetKeys, resetOnPropsChange } = this.props
    const { hasError } = this.state

    // Reset when resetKeys change
    if (hasError && resetKeys && prevProps.resetKeys) {
      const hasResetKeyChanged = resetKeys.some((key, index) => 
        prevProps.resetKeys![index] !== key
      )
      
      if (hasResetKeyChanged) {
        this.resetErrorBoundary()
      }
    }

    // Reset when any props change (if enabled)
    if (hasError && resetOnPropsChange && prevProps !== this.props) {
      this.resetErrorBoundary()
    }
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId)
    }
  }

  resetErrorBoundary = () => {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId)
      this.resetTimeoutId = null
    }

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    })

    log.info(`Error Boundary Reset: ${this.props.name || 'ErrorBoundary'}`, {
      boundaryName: this.props.name,
      boundaryLevel: this.props.level
    })
  }

  render() {
    const { hasError, error, errorInfo, errorId } = this.state
    const { children, fallback, isolate = false, level = 'component', name = 'ErrorBoundary' } = this.props

    if (hasError && error) {
      // Use custom fallback if provided
      if (fallback) {
        if (typeof fallback === 'function') {
          return fallback(error, errorInfo!)
        }
        return fallback
      }

      // Use default fallback based on level
      return (
        <ErrorFallback 
          error={error}
          errorInfo={errorInfo}
          errorId={errorId}
          level={level}
          name={name}
          onReset={this.resetErrorBoundary}
          isolate={isolate}
        />
      )
    }

    return children
  }
}

// ============================================================================
// Default Error Fallback Component
// ============================================================================

interface ErrorFallbackProps {
  error: Error
  errorInfo: ErrorInfo | null
  errorId: string | null
  level: 'page' | 'section' | 'component'
  name: string
  onReset: () => void
  isolate: boolean
}

function ErrorFallback({ 
  error, 
  errorInfo, 
  errorId, 
  level, 
  name, 
  onReset, 
  isolate 
}: ErrorFallbackProps) {
  const isDevelopment = process.env.NODE_ENV === 'development'

  const getErrorIcon = () => {
    switch (level) {
      case 'page': return '💥'
      case 'section': return '⚠️'
      default: return '🐛'
    }
  }

  const getErrorTitle = () => {
    switch (level) {
      case 'page': return 'Application Error'
      case 'section': return 'Section Error'
      default: return 'Component Error'
    }
  }

  const getErrorMessage = () => {
    if (isDevelopment) {
      return error.message
    }
    
    switch (level) {
      case 'page': 
        return 'Something went wrong with the application. Please refresh the page.'
      case 'section':
        return 'This section encountered an error. You can continue using other parts of the app.'
      default:
        return 'This component encountered an error.'
    }
  }

  const containerClasses = isolate 
    ? 'error-boundary-isolated' 
    : level === 'page' 
      ? 'error-boundary-page'
      : level === 'section'
        ? 'error-boundary-section'
        : 'error-boundary-component'

  return (
    <div className={`${containerClasses} p-4 border border-red-200 bg-red-50 rounded-lg`}>
      <div className="flex items-start space-x-3">
        <div className="text-2xl">{getErrorIcon()}</div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-red-800 mb-2">
            {getErrorTitle()}
          </h3>
          <p className="text-red-700 mb-4">
            {getErrorMessage()}
          </p>
          
          {level !== 'page' && (
            <button
              onClick={onReset}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Try Again
            </button>
          )}

          {level === 'page' && (
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Refresh Page
            </button>
          )}

          {isDevelopment && (
            <details className="mt-4">
              <summary className="cursor-pointer text-red-600 font-medium mb-2">
                Error Details (Development Only)
              </summary>
              <div className="bg-red-100 p-3 rounded text-sm font-mono">
                <div className="mb-2">
                  <strong>Error ID:</strong> {errorId}
                </div>
                <div className="mb-2">
                  <strong>Boundary:</strong> {name}
                </div>
                <div className="mb-2">
                  <strong>Message:</strong> {error.message}
                </div>
                {error.stack && (
                  <div className="mb-2">
                    <strong>Stack:</strong>
                    <pre className="whitespace-pre-wrap mt-1 text-xs">
                      {error.stack}
                    </pre>
                  </div>
                )}
                {errorInfo?.componentStack && (
                  <div>
                    <strong>Component Stack:</strong>
                    <pre className="whitespace-pre-wrap mt-1 text-xs">
                      {errorInfo.componentStack}
                    </pre>
                  </div>
                )}
              </div>
            </details>
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Specialized Error Boundaries
// ============================================================================

export function PageErrorBoundary({ children, ...props }: Omit<ErrorBoundaryProps, 'level'>) {
  return (
    <ErrorBoundary level="page" name="PageErrorBoundary" {...props}>
      {children}
    </ErrorBoundary>
  )
}

export function SectionErrorBoundary({ children, ...props }: Omit<ErrorBoundaryProps, 'level'>) {
  return (
    <ErrorBoundary level="section" name="SectionErrorBoundary" {...props}>
      {children}
    </ErrorBoundary>
  )
}

export function ComponentErrorBoundary({ children, ...props }: Omit<ErrorBoundaryProps, 'level'>) {
  return (
    <ErrorBoundary level="component" name="ComponentErrorBoundary" {...props}>
      {children}
    </ErrorBoundary>
  )
}

// ============================================================================
// Higher-Order Component
// ============================================================================

export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary 
      name={`${Component.displayName || Component.name}ErrorBoundary`}
      level="component"
      {...errorBoundaryProps}
    >
      <Component {...props} />
    </ErrorBoundary>
  )

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`
  
  return WrappedComponent
}

// ============================================================================
// Hook for Error Reporting
// ============================================================================

export function useErrorHandler() {
  const reportError = React.useCallback((error: Error, context?: Record<string, any>) => {
    const appError = new AppError(
      error.message,
      ErrorType.CLIENT,
      ErrorSeverity.MEDIUM,
      500,
      {
        ...context,
        reportedManually: true,
        userAgent: navigator.userAgent,
        url: window.location.href
      }
    )

    log.error('Manual error report', context || {}, appError)
  }, [])

  return { reportError }
}