"use client"

import { motion, AnimatePresence } from 'framer-motion'
import { usePathname } from 'next/navigation'

export const pageVariants = {
  initial: {
    opacity: 0,
    y: 20,
    scale: 0.98
  },
  in: {
    opacity: 1,
    y: 0,
    scale: 1
  },
  out: {
    opacity: 0,
    y: -20,
    scale: 1.02
  }
}

export const pageTransition = {
  type: 'tween',
  ease: 'anticipate',
  duration: 0.4
}

export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
}

export const staggerItem = {
  initial: {
    opacity: 0,
    y: 20
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: 'easeOut'
    }
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.2
    }
  }
}

export const dragVariants = {
  initial: {
    scale: 1,
    rotate: 0,
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
  },
  drag: {
    scale: 1.05,
    rotate: 2,
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
    zIndex: 1000
  },
  dragEnd: {
    scale: 1,
    rotate: 0,
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    transition: {
      duration: 0.2,
      ease: 'easeOut'
    }
  }
}

export function usePageTransitions() {
  const pathname = usePathname()

  const PageTransition = ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <motion.div
      key={pathname}
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
      className={className}
    >
      {children}
    </motion.div>
  )

  const StaggerContainer = ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className={className}
    >
      {children}
    </motion.div>
  )

  const StaggerItem = ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <motion.div
      variants={staggerItem}
      className={className}
    >
      {children}
    </motion.div>
  )

  return {
    PageTransition,
    StaggerContainer,
    StaggerItem,
    pageVariants,
    pageTransition,
    staggerContainer,
    staggerItem,
    dragVariants
  }
}
