'use client'

import { useEffect, useRef, useCallback } from 'react'

interface UseInfiniteScrollOptions {
  onLoadMore: () => void
  hasMore: boolean
  isLoading: boolean
  threshold?: number
}

export function useInfiniteScroll({
  onLoadMore,
  hasMore,
  isLoading,
  threshold = 100
}: UseInfiniteScrollOptions) {
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)

  const setLoadMoreRef = useCallback((node: HTMLDivElement | null) => {
    loadMoreRef.current = node
  }, [])

  useEffect(() => {
    if (isLoading || !hasMore) return

    const element = loadMoreRef.current
    if (!element) return

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (entry.isIntersecting && hasMore && !isLoading) {
          onLoadMore()
        }
      },
      {
        rootMargin: `${threshold}px`,
        threshold: 0
      }
    )

    observerRef.current.observe(element)

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [onLoadMore, hasMore, isLoading, threshold])

  return { setLoadMoreRef }
}
