"use client"

import { motion, AnimatePresence } from 'framer-motion'
import { RefreshCw } from 'lucide-react'

interface PullToRefreshIndicatorProps {
  pullDistance: number
  isRefreshing: boolean
  threshold?: number
}

/**
 * Indicador visual de pull-to-refresh.
 * Aparece en la cima de la página cuando el usuario arrastra hacia abajo.
 */
export function PullToRefreshIndicator({
  pullDistance,
  isRefreshing,
  threshold = 36, // mitad del threshold del hook
}: PullToRefreshIndicatorProps) {
  const isVisible = pullDistance > 4 || isRefreshing
  const progress = Math.min(pullDistance / threshold, 1)
  const rotation = progress * 180

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="ptr"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: pullDistance > 0 ? pullDistance : 40, opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="flex items-center justify-center overflow-hidden"
        >
          <motion.div
            animate={isRefreshing ? { rotate: 360 } : { rotate: rotation }}
            transition={
              isRefreshing
                ? { repeat: Infinity, duration: 0.7, ease: 'linear' }
                : { type: 'spring', stiffness: 200 }
            }
            className="text-muted-foreground"
          >
            <RefreshCw
              className="w-5 h-5"
              style={{ opacity: 0.4 + progress * 0.6 }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
