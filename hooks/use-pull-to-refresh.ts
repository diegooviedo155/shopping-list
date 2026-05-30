"use client"

import { useCallback, useEffect, useRef, useState } from 'react'

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void>
  threshold?: number  // px necesarios para activar el refresh
  containerRef?: React.RefObject<HTMLElement | null>
}

interface UsePullToRefreshReturn {
  isPulling: boolean
  pullDistance: number   // 0..threshold, para animar el indicador
  isRefreshing: boolean
  wrapperProps: {
    onTouchStart: (e: React.TouchEvent) => void
    onTouchMove: (e: React.TouchEvent) => void
    onTouchEnd: () => void
  }
}

/**
 * Pull-to-refresh para listas en mobile.
 *
 * Uso:
 * ```tsx
 * const { isPulling, pullDistance, isRefreshing, wrapperProps } = usePullToRefresh({ onRefresh })
 *
 * <div {...wrapperProps} className="overflow-y-auto">
 *   <PullIndicator distance={pullDistance} isRefreshing={isRefreshing} />
 *   {children}
 * </div>
 * ```
 */
export function usePullToRefresh({
  onRefresh,
  threshold = 72,
  containerRef,
}: UsePullToRefreshOptions): UsePullToRefreshReturn {
  const [isPulling, setIsPulling] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const startYRef = useRef(0)
  const pullingRef = useRef(false)
  const isRefreshingRef = useRef(false)

  const canPull = useCallback(() => {
    if (isRefreshingRef.current) return false
    // Solo activar si el scroll del contenedor está en la cima
    const el = containerRef?.current ?? document.documentElement
    return el.scrollTop === 0
  }, [containerRef])

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!canPull()) return
    startYRef.current = e.touches[0].clientY
    pullingRef.current = true
  }, [canPull])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!pullingRef.current) return
    const delta = e.touches[0].clientY - startYRef.current
    if (delta <= 0) {
      pullingRef.current = false
      setIsPulling(false)
      setPullDistance(0)
      return
    }
    // Resistencia: el desplazamiento visual es menor que el gesto real
    const visual = Math.min(delta * 0.5, threshold * 1.2)
    setIsPulling(true)
    setPullDistance(visual)
  }, [threshold])

  const handleTouchEnd = useCallback(async () => {
    if (!pullingRef.current) return
    pullingRef.current = false

    const shouldRefresh = pullDistance >= threshold * 0.5
    setIsPulling(false)
    setPullDistance(0)

    if (!shouldRefresh) return

    isRefreshingRef.current = true
    setIsRefreshing(true)
    try {
      await onRefresh()
    } finally {
      isRefreshingRef.current = false
      setIsRefreshing(false)
    }
  }, [pullDistance, threshold, onRefresh])

  return {
    isPulling,
    pullDistance,
    isRefreshing,
    wrapperProps: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
  }
}
