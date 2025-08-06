/**
 * Reusable hook for API calls with built-in error handling, caching, and retry logic
 */

import { useCallback } from 'react'
import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query'
import { handleApiResponse, AppError, createNetworkError } from '@/lib/error-handling'
import { log } from '@/lib/logging'

export interface ApiCallOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  headers?: Record<string, string>
  body?: any
  timeout?: number
  retries?: number
  enableLogging?: boolean
  logContext?: Record<string, any>
}

export interface UseApiCallOptions<T> extends ApiCallOptions {
  queryKey?: any[]
  enabled?: boolean
  staleTime?: number
  cacheTime?: number
  onSuccess?: (data: T) => void
  onError?: (error: AppError) => void
}

export interface UseApiMutationOptions<T, V> extends ApiCallOptions {
  onSuccess?: (data: T, variables: V) => void
  onError?: (error: AppError, variables: V) => void
  onSettled?: (data: T | undefined, error: AppError | null, variables: V) => void
}

// ============================================================================
// API Call Utility
// ============================================================================

async function makeApiCall<T>(
  url: string,
  options: ApiCallOptions = {}
): Promise<T> {
  const {
    method = 'GET',
    headers = {},
    body,
    timeout = 30000,
    enableLogging = true,
    logContext = {}
  } = options

  const startTime = performance.now()
  const timer = enableLogging ? log.timer(`API ${method} ${url}`, logContext) : null

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    const requestOptions: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      signal: controller.signal
    }

    if (body && method !== 'GET') {
      requestOptions.body = typeof body === 'string' ? body : JSON.stringify(body)
    }

    if (enableLogging) {
      log.info(`Starting API call: ${method} ${url}`, {
        ...logContext,
        method,
        endpoint: url,
        hasBody: !!body
      })
    }

    const response = await fetch(url, requestOptions)
    clearTimeout(timeoutId)

    const duration = performance.now() - startTime
    
    if (enableLogging) {
      timer?.end()
      log.apiCall(method, url, duration, response.status, logContext)
    }

    return await handleApiResponse<T>(response, {
      ...logContext,
      method,
      endpoint: url,
      duration
    })
  } catch (error) {
    const duration = performance.now() - startTime
    
    if (enableLogging) {
      timer?.end()
    }

    if (error instanceof DOMException && error.name === 'AbortError') {
      const timeoutError = createNetworkError(`Request timeout after ${timeout}ms`, {
        ...logContext,
        method,
        endpoint: url,
        duration,
        timeout
      })
      
      if (enableLogging) {
        log.error(`API call timeout: ${method} ${url}`, logContext, timeoutError)
      }
      
      throw timeoutError
    }

    if (error instanceof AppError) {
      throw error
    }

    const networkError = createNetworkError(
      error instanceof Error ? error.message : 'Network request failed',
      {
        ...logContext,
        method,
        endpoint: url,
        duration
      }
    )

    if (enableLogging) {
      log.error(`API call failed: ${method} ${url}`, logContext, networkError)
    }

    throw networkError
  }
}

// ============================================================================
// Query Hook
// ============================================================================

export function useApiQuery<T>(
  url: string | null,
  options: UseApiCallOptions<T> = {}
) {
  const {
    queryKey = [url],
    enabled = !!url,
    staleTime = 5 * 60 * 1000, // 5 minutes
    cacheTime = 10 * 60 * 1000, // 10 minutes
    onSuccess,
    onError,
    ...apiOptions
  } = options

  return useQuery<T, AppError>({
    queryKey,
    queryFn: () => {
      if (!url) throw new Error('URL is required')
      return makeApiCall<T>(url, apiOptions)
    },
    enabled,
    staleTime,
    gcTime: cacheTime,
    retry: (failureCount, error) => {
      // Don't retry on client errors (4xx)
      if (error instanceof AppError && error.statusCode >= 400 && error.statusCode < 500) {
        return false
      }
      return failureCount < (apiOptions.retries ?? 3)
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    onSuccess,
    onError
  } as UseQueryOptions<T, AppError>)
}

// ============================================================================
// Mutation Hook
// ============================================================================

export function useApiMutation<T, V = any>(
  url: string,
  options: UseApiMutationOptions<T, V> = {}
) {
  const queryClient = useQueryClient()
  const {
    onSuccess,
    onError,
    onSettled,
    ...apiOptions
  } = options

  return useMutation<T, AppError, V>({
    mutationFn: (variables: V) => {
      const requestOptions = {
        ...apiOptions,
        body: variables
      }
      return makeApiCall<T>(url, requestOptions)
    },
    onSuccess: (data, variables) => {
      onSuccess?.(data, variables)
    },
    onError: (error, variables) => {
      onError?.(error, variables)
    },
    onSettled: (data, error, variables) => {
      onSettled?.(data, error, variables)
    }
  } as UseMutationOptions<T, AppError, V>)
}

// ============================================================================
// Imperative API Call Hook
// ============================================================================

export function useImperativeApiCall() {
  const makeCall = useCallback(async <T>(
    url: string,
    options: ApiCallOptions = {}
  ): Promise<T> => {
    return makeApiCall<T>(url, options)
  }, [])

  return { makeCall }
}

// ============================================================================
// Specialized Hooks
// ============================================================================

export function useApiGet<T>(url: string | null, options: Omit<UseApiCallOptions<T>, 'method'> = {}) {
  return useApiQuery<T>(url, { ...options, method: 'GET' })
}

export function useApiPost<T, V = any>(url: string, options: Omit<UseApiMutationOptions<T, V>, 'method'> = {}) {
  return useApiMutation<T, V>(url, { ...options, method: 'POST' })
}

export function useApiPut<T, V = any>(url: string, options: Omit<UseApiMutationOptions<T, V>, 'method'> = {}) {
  return useApiMutation<T, V>(url, { ...options, method: 'PUT' })
}

export function useApiDelete<T, V = any>(url: string, options: Omit<UseApiMutationOptions<T, V>, 'method'> = {}) {
  return useApiMutation<T, V>(url, { ...options, method: 'DELETE' })
}

// ============================================================================
// Cache Management Utilities
// ============================================================================

export function useApiCache() {
  const queryClient = useQueryClient()

  const invalidateQueries = useCallback((queryKey: any[]) => {
    return queryClient.invalidateQueries({ queryKey })
  }, [queryClient])

  const setQueryData = useCallback(<T>(queryKey: any[], data: T) => {
    queryClient.setQueryData(queryKey, data)
  }, [queryClient])

  const getQueryData = useCallback(<T>(queryKey: any[]): T | undefined => {
    return queryClient.getQueryData<T>(queryKey)
  }, [queryClient])

  const removeQueries = useCallback((queryKey: any[]) => {
    queryClient.removeQueries({ queryKey })
  }, [queryClient])

  const prefetchQuery = useCallback(async <T>(
    queryKey: any[],
    queryFn: () => Promise<T>,
    staleTime?: number
  ) => {
    return queryClient.prefetchQuery({
      queryKey,
      queryFn,
      staleTime
    })
  }, [queryClient])

  return {
    invalidateQueries,
    setQueryData,
    getQueryData,
    removeQueries,
    prefetchQuery
  }
}