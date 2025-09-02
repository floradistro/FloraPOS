'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertModal } from '../ui/Modal';
import { errorReporting } from '../../lib/errorReporting';

interface ErrorBoundaryProps {
  children: ReactNode;
  componentName?: string;
  level?: 'critical' | 'standard' | 'light';
  enableRetry?: boolean;
  maxRetries?: number;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onRetry?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
  showAlert: boolean;
}

export class UnifiedErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryTimeoutId: NodeJS.Timeout | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      showAlert: false
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { componentName = 'Unknown', onError, level = 'standard' } = this.props;

    // Report error
    errorReporting.reportError(error, errorInfo, `component:${componentName}`);
    
    // Call custom error handler
    onError?.(error, errorInfo);

    // Update state with error info
    this.setState({
      errorInfo,
      showAlert: level === 'critical'
    });

    // Only log in development
    if (process.env.NODE_ENV === 'development') {
      console.error(`Error in ${componentName}:`, error, errorInfo);
    }
  }

  private handleRetry = () => {
    const { maxRetries = 3, onRetry } = this.props;
    const { retryCount } = this.state;

    if (retryCount < maxRetries) {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: retryCount + 1,
        showAlert: false
      });

      // Call custom retry handler
      onRetry?.();

      // Only log in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`Retrying component (attempt ${retryCount + 1}/${maxRetries})`);
      }
    }
  };

  private handleDismissAlert = () => {
    this.setState({ showAlert: false });
  };

  render() {
    const { 
      children, 
      componentName = 'Component', 
      level = 'standard',
      enableRetry = true,
      maxRetries = 3,
      fallback 
    } = this.props;
    
    const { hasError, error, retryCount, showAlert } = this.state;

    if (hasError && error) {
      // Critical level - show modal alert
      if (level === 'critical' && showAlert) {
        return (
          <>
            {this.renderFallback()}
            <AlertModal
              isOpen={showAlert}
              onClose={this.handleDismissAlert}
              title={`${componentName} Error`}
              message={`A critical error occurred in ${componentName}. Please try refreshing the page.`}
            />
          </>
        );
      }

      // Standard/Light level - show inline error
      return this.renderFallback();
    }

    return children;
  }

  private renderFallback() {
    const { 
      componentName = 'Component', 
      level = 'standard',
      enableRetry = true,
      maxRetries = 3,
      fallback 
    } = this.props;
    
    const { error, retryCount } = this.state;

    // Custom fallback
    if (fallback) {
      return fallback;
    }

    // Light level - minimal error display
    if (level === 'light') {
      return (
        <div className="text-neutral-500 text-sm p-2 text-center">
          {componentName} temporarily unavailable
        </div>
      );
    }

    // Standard/Critical level - detailed error display
    const canRetry = enableRetry && retryCount < maxRetries;

    return (
      <div className="border border-red-200 bg-red-50 rounded-lg p-4 text-center">
        <div className="text-red-800 font-medium mb-2">
          {level === 'critical' ? '⚠️ Critical Error' : '⚠️ Error'}
        </div>
        <div className="text-red-600 text-sm mb-3">
          {componentName} encountered an error and couldn't render.
        </div>
        {process.env.NODE_ENV === 'development' && error && (
          <details className="text-xs text-red-500 mb-3">
            <summary className="cursor-pointer">Error Details</summary>
            <pre className="mt-2 text-left overflow-auto max-h-32">
              {error.stack || error.message}
            </pre>
          </details>
        )}
        {canRetry && (
          <button
            onClick={this.handleRetry}
            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
          >
            Try Again ({retryCount}/{maxRetries})
          </button>
        )}
      </div>
    );
  }
}

// Convenience components for different levels
export const CriticalErrorBoundary: React.FC<{
  children: ReactNode;
  componentName?: string;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}> = ({ children, componentName, onError }) => (
  <UnifiedErrorBoundary
    level="critical"
    componentName={componentName}
    enableRetry={true}
    maxRetries={3}
    onError={onError}
  >
    {children}
  </UnifiedErrorBoundary>
);

export const StandardErrorBoundary: React.FC<{
  children: ReactNode;
  componentName?: string;
  enableRetry?: boolean;
}> = ({ children, componentName, enableRetry = true }) => (
  <UnifiedErrorBoundary
    level="standard"
    componentName={componentName}
    enableRetry={enableRetry}
    maxRetries={2}
  >
    {children}
  </UnifiedErrorBoundary>
);

export const LightErrorBoundary: React.FC<{
  children: ReactNode;
  componentName?: string;
  fallback?: ReactNode;
}> = ({ children, componentName, fallback }) => (
  <UnifiedErrorBoundary
    level="light"
    componentName={componentName}
    enableRetry={false}
    fallback={fallback}
  >
    {children}
  </UnifiedErrorBoundary>
);

// HOC for wrapping components
export function withErrorBoundary<T extends {}>(
  Component: React.ComponentType<T>,
  options: {
    level?: 'critical' | 'standard' | 'light';
    componentName?: string;
    enableRetry?: boolean;
  } = {}
) {
  const { level = 'standard', componentName, enableRetry = true } = options;
  const name = componentName || Component.displayName || Component.name;

  const WrappedComponent = (props: T) => (
    <UnifiedErrorBoundary
      level={level}
      componentName={name}
      enableRetry={enableRetry}
      maxRetries={level === 'critical' ? 3 : 2}
    >
      <Component {...props} />
    </UnifiedErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${name})`;
  return WrappedComponent;
}
