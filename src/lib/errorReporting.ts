/**
 * Error Reporting Service
 * Handles error logging, reporting, and analytics
 */

interface ErrorReport {
  error: Error;
  errorInfo?: React.ErrorInfo;
  context?: string;
  userId?: string;
  sessionId?: string;
  timestamp: number;
  url: string;
  userAgent: string;
}

interface ErrorReportingConfig {
  apiEndpoint?: string;
  enableConsoleLogging: boolean;
  enableRemoteLogging: boolean;
  maxRetries: number;
}

class ErrorReportingService {
  private config: ErrorReportingConfig;
  private sessionId: string;
  private userId?: string;

  constructor(config: Partial<ErrorReportingConfig> = {}) {
    this.config = {
      enableConsoleLogging: true,
      enableRemoteLogging: process.env.NODE_ENV === 'production',
      maxRetries: 3,
      ...config
    };
    
    this.sessionId = this.generateSessionId();
    
    // Only setup error handlers on client side
    if (typeof window !== 'undefined') {
      this.setupGlobalErrorHandlers();
    }
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private setupGlobalErrorHandlers(): void {
    // Only setup on client side
    if (typeof window === 'undefined') return;
    
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.reportError(new Error(event.reason), undefined, 'unhandledPromiseRejection');
    });

    // Handle global JavaScript errors
    window.addEventListener('error', (event) => {
      this.reportError(event.error, undefined, 'globalError');
    });
  }

  setUserId(userId: string): void {
    this.userId = userId;
  }

  async reportError(
    error: Error,
    errorInfo?: React.ErrorInfo,
    context?: string
  ): Promise<void> {
    const errorReport: ErrorReport = {
      error,
      errorInfo,
      context,
      userId: this.userId,
      sessionId: this.sessionId,
      timestamp: Date.now(),
      url: typeof window !== 'undefined' ? window.location.href : 'server-side',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server-side',
    };

    // Always log to console in development
    if (this.config.enableConsoleLogging) {
      this.logToConsole(errorReport);
    }

    // Send to remote service in production
    if (this.config.enableRemoteLogging) {
      await this.sendToRemoteService(errorReport);
    }

    // Store locally for offline scenarios
    this.storeLocally(errorReport);
  }

  private logToConsole(errorReport: ErrorReport): void {
    console.group('🚨 Error Report');
    console.error('Error:', errorReport.error);
    console.log('Context:', errorReport.context);
    console.log('User ID:', errorReport.userId);
    console.log('Session ID:', errorReport.sessionId);
    console.log('URL:', errorReport.url);
    
    if (errorReport.errorInfo) {
      console.log('Component Stack:', errorReport.errorInfo.componentStack);
    }
    
    console.groupEnd();
  }

  private async sendToRemoteService(errorReport: ErrorReport): Promise<void> {
    if (!this.config.apiEndpoint) {
      return;
    }

    const payload = {
      message: errorReport.error.message,
      stack: errorReport.error.stack,
      context: errorReport.context,
      userId: errorReport.userId,
      sessionId: errorReport.sessionId,
      timestamp: errorReport.timestamp,
      url: errorReport.url,
      userAgent: errorReport.userAgent,
      componentStack: errorReport.errorInfo?.componentStack,
    };

    try {
      await fetch(this.config.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.warn('Failed to send error report to remote service:', err);
    }
  }

  private storeLocally(errorReport: ErrorReport): void {
    try {
      const errors = JSON.parse(localStorage.getItem('flora-pos-errors') || '[]');
      errors.push({
        message: errorReport.error.message,
        context: errorReport.context,
        timestamp: errorReport.timestamp,
      });
      
      // Keep only last 10 errors
      const recentErrors = errors.slice(-10);
      localStorage.setItem('flora-pos-errors', JSON.stringify(recentErrors));
    } catch (err) {
      // Ignore localStorage errors
    }
  }

  getStoredErrors(): any[] {
    try {
      return JSON.parse(localStorage.getItem('flora-pos-errors') || '[]');
    } catch {
      return [];
    }
  }

  clearStoredErrors(): void {
    try {
      localStorage.removeItem('flora-pos-errors');
    } catch {
      // Ignore
    }
  }
}

// Create singleton instance
export const errorReporting = new ErrorReportingService({
  apiEndpoint: process.env.NEXT_PUBLIC_ERROR_REPORTING_ENDPOINT,
});

// Error boundary helper for specific contexts
export const reportBoundaryError = (
  error: Error,
  errorInfo: React.ErrorInfo,
  boundaryName: string
): void => {
  errorReporting.reportError(error, errorInfo, `errorBoundary:${boundaryName}`);
};

// API error helper
export const reportApiError = (
  error: Error,
  endpoint: string,
  context?: any
): void => {
  const enhancedError = new Error(`API Error: ${error.message}`);
  enhancedError.stack = error.stack;
  
  errorReporting.reportError(
    enhancedError,
    undefined,
    `apiError:${endpoint}:${JSON.stringify(context)}`
  );
};

// User action error helper
export const reportUserActionError = (
  error: Error,
  action: string,
  additionalContext?: any
): void => {
  errorReporting.reportError(
    error,
    undefined,
    `userAction:${action}:${JSON.stringify(additionalContext)}`
  );
};
