import { useState, useEffect, useCallback, useRef } from 'react'

interface UseInfiniteScrollOptions {
  hasMore: boolean
  isLoading: boolean
  onLoadMore: () => void
  threshold?: number
  rootMargin?: string
}

export function useInfiniteScroll({
  hasMore,
  isLoading,
  onLoadMore,
  threshold = 100,
  rootMargin = '100px'
}: UseInfiniteScrollOptions) {
  const [isNearBottom, setIsNearBottom] = useState(false)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)

  const checkIfNearBottom = useCallback(() => {
    if (!sentinelRef.current) return

    const rect = sentinelRef.current.getBoundingClientRect()
    const windowHeight = window.innerHeight
    const isNear = rect.bottom - windowHeight <= threshold

    setIsNearBottom(isNear)

    if (isNear && hasMore && !isLoading) {
      onLoadMore()
    }
  }, [hasMore, isLoading, onLoadMore, threshold])

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return

    // Create intersection observer for more precise detection
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (entry.isIntersecting && hasMore && !isLoading) {
          onLoadMore()
        }
      },
      {
        rootMargin,
        threshold: 0.1
      }
    )

    observerRef.current.observe(sentinel)

    // Fallback scroll listener
    const handleScroll = () => {
      checkIfNearBottom()
    }

    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
      window.removeEventListener('scroll', handleScroll)
    }
  }, [checkIfNearBottom, hasMore, isLoading, onLoadMore, rootMargin])

  // Manual trigger for load more (useful for buttons)
  const loadMore = useCallback(() => {
    if (hasMore && !isLoading) {
      onLoadMore()
    }
  }, [hasMore, isLoading, onLoadMore])

  return {
    sentinelRef,
    isNearBottom,
    loadMore
  }
}
