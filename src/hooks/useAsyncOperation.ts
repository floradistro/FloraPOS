/**
 * Reusable hook for handling async operations with error handling, loading states, and retries
 */

import { useState, useCallback, useRef } from 'react'
import { handleAsyncError, AppError, ErrorHandlerOptions } from '@/lib/error-handling'
import { log } from '@/lib/logging'

export interface AsyncOperationState<T> {
  data: T | null
  loading: boolean
  error: AppError | null
  lastUpdated: Date | null
}

export interface UseAsyncOperationOptions<T> extends ErrorHandlerOptions {
  initialData?: T
  onSuccess?: (data: T) => void
  onError?: (error: AppError) => void
  enableLogging?: boolean
  logContext?: Record<string, any>
}

export interface AsyncOperationResult<T> extends AsyncOperationState<T> {
  execute: (...args: any[]) => Promise<T | null>
  reset: () => void
  retry: () => Promise<T | null>
}

export function useAsyncOperation<T>(
  operation: (...args: any[]) => Promise<T>,
  options: UseAsyncOperationOptions<T> = {}
): AsyncOperationResult<T> {
  const {
    initialData = null,
    onSuccess,
    onError,
    enableLogging = true,
    logContext = {},
    ...errorHandlerOptions
  } = options

  const [state, setState] = useState<AsyncOperationState<T>>({
    data: initialData,
    loading: false,
    error: null,
    lastUpdated: null
  })

  const lastArgsRef = useRef<any[]>([])
  const operationNameRef = useRef<string>(operation.name || 'async-operation')

  const execute = useCallback(async (...args: any[]): Promise<T | null> => {
    lastArgsRef.current = args
    
    setState(prev => ({
      ...prev,
      loading: true,
      error: null
    }))

    const timer = enableLogging ? log.timer(operationNameRef.current, logContext) : null

    try {
      const result = await handleAsyncError(
        () => operation(...args),
        {
          ...errorHandlerOptions,
          shouldThrow: true,
          shouldLog: enableLogging,
          onError: (error) => {
            // errorHandlerOptions.onError?.(error)
            onError?.(error)
          }
        }
      )

      if (result !== null) {
        setState({
          data: result,
          loading: false,
          error: null,
          lastUpdated: new Date()
        })

        if (enableLogging) {
          const duration = timer?.end()
          log.info(`${operationNameRef.current} completed successfully`, {
            ...logContext,
            duration,
            dataSize: typeof result === 'object' ? JSON.stringify(result).length : 0
          })
        }

        onSuccess?.(result)
        return result
      }

      return null
    } catch (error) {
      const appError = error as AppError
      
      setState(prev => ({
        ...prev,
        loading: false,
        error: appError
      }))

      if (enableLogging) {
        const duration = timer?.end()
        log.error(`${operationNameRef.current} failed`, {
          ...logContext,
          duration,
          errorType: appError.type,
          errorCode: appError.code
        }, appError)
      }

      return null
    }
  }, [operation, onSuccess, onError, enableLogging, logContext, errorHandlerOptions])

  const retry = useCallback(() => {
    return execute(...lastArgsRef.current)
  }, [execute])

  const reset = useCallback(() => {
    setState({
      data: initialData,
      loading: false,
      error: null,
      lastUpdated: null
    })
  }, [initialData])

  return {
    ...state,
    execute,
    retry,
    reset
  }
}