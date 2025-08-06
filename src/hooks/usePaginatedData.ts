import { useState, useCallback, useMemo } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'

export interface PaginationOptions {
  pageSize: number
  initialPage?: number
  enabled?: boolean
  staleTime?: number
  gcTime?: number
}

export interface PaginatedResult<T> {
  items: T[]
  hasNextPage: boolean
  isFetching: boolean
  isLoading: boolean
  loadMore: () => void
  refetch: () => void
  totalItems: number
  currentPage: number
  error: Error | null
}

export function usePaginatedData<T>(
  queryKey: string[],
  fetchFn: (page: number, pageSize: number) => Promise<{ items: T[]; total: number; hasMore: boolean }>,
  options: PaginationOptions = { pageSize: 20 }
): PaginatedResult<T> {
  const {
    pageSize = 20,
    initialPage = 1,
    enabled = true,
    staleTime = 5 * 60 * 1000,
    gcTime = 10 * 60 * 1000
  } = options

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isLoading,
    refetch,
    error
  } = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam = initialPage }) => fetchFn(pageParam, pageSize),
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.hasMore ? allPages.length + 1 : undefined
    },
    initialPageParam: initialPage,
    enabled,
    staleTime,
    gcTime,
    refetchOnWindowFocus: false,
    retry: 2
  })

  const items = useMemo(() => {
    return data?.pages.flatMap(page => page.items) ?? []
  }, [data])

  const totalItems = useMemo(() => {
    return data?.pages[0]?.total ?? 0
  }, [data])

  const currentPage = useMemo(() => {
    return data?.pages.length ?? 0
  }, [data])

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetching) {
      fetchNextPage()
    }
  }, [hasNextPage, isFetching, fetchNextPage])

  return {
    items,
    hasNextPage: !!hasNextPage,
    isFetching,
    isLoading,
    loadMore,
    refetch,
    totalItems,
    currentPage,
    error: error as Error | null
  }
}