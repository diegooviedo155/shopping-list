"use client"

import React, { useState, useRef, useEffect } from 'react'
import { motion, useMotionValue, useTransform, useSpring, PanInfo } from 'framer-motion'
import { Button, OptimisticCheckbox } from '../../atoms'
import { ShoppingItem } from '../../../../core/domain/entities/ShoppingItem'
import { cn } from '@/lib/utils'
import { Trash2, Calendar, GripVertical } from 'lucide-react'

interface IonicSwipeItemProps {
  item: ShoppingItem
  onDelete: (id: string) => void
  onMoveToNextMonth: (id: string) => void
  onToggleCompleted: (id: string) => void
  className?: string
}

export function IonicSwipeItem({ 
  item, 
  onDelete, 
  onMoveToNextMonth, 
  onToggleCompleted,
  className 
}: IonicSwipeItemProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  
  const x = useMotionValue(0)
  const xSpring = useSpring(x, { stiffness: 300, damping: 30 })
  
  // Transform values for different elements
  const itemTranslateX = useTransform(xSpring, [0, -160], [0, 0])
  const actionsOpacity = useTransform(xSpring, [0, -30, -160], [0, 0.5, 1])
  const itemScale = useTransform(xSpring, [0, -160], [1, 1])
  const itemOpacity = useTransform(xSpring, [0, -160], [1, 1])

  // Handle pan gestures
  const handlePan = (event: any, info: PanInfo) => {
    const currentX = x.get()
    const newX = currentX + info.delta.x
    
    // Constrain movement to left only and limit distance
    const constrainedX = Math.min(0, Math.max(-160, newX))
    x.set(constrainedX)
  }

  const handlePanEnd = (event: any, info: PanInfo) => {
    const currentX = x.get()
    const velocity = info.velocity.x
    
    // More sensitive thresholds for closing
    const shouldOpen = currentX < -80 || velocity < -100
    const shouldClose = currentX > -100 || velocity > 0
    
    if (shouldOpen) {
      x.set(-160)
      setIsOpen(true)
    } else {
      // Always close if not opening
      x.set(0)
      setIsOpen(false)
    }
    
    setIsDragging(false)
  }

  const handlePanStart = () => {
    setIsDragging(true)
  }

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        if (isOpen) {
          x.set(0)
          setIsOpen(false)
        }
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, x])

  // Force close on any global click when open
  useEffect(() => {
    const handleGlobalClick = () => {
      if (isOpen) {
        x.set(0)
        setIsOpen(false)
      }
    }

    if (isOpen) {
      // Small delay to prevent immediate closure
      const timeoutId = setTimeout(() => {
        document.addEventListener('click', handleGlobalClick, { once: true })
      }, 100)
      
      return () => {
        clearTimeout(timeoutId)
        document.removeEventListener('click', handleGlobalClick)
      }
    }
  }, [isOpen, x])

  // Close when item changes
  useEffect(() => {
    if (isOpen) {
      x.set(0)
      setIsOpen(false)
    }
  }, [item.id])

  // Force close on any click
  useEffect(() => {
    const handleGlobalClick = () => {
      if (isOpen) {
        x.set(0)
        setIsOpen(false)
      }
    }

    document.addEventListener('click', handleGlobalClick)
    return () => document.removeEventListener('click', handleGlobalClick)
  }, [isOpen, x])

  const handleDelete = () => {
    onDelete(item.id)
    x.set(0)
    setIsOpen(false)
  }

  const handleMoveToNextMonth = () => {
    onMoveToNextMonth(item.id)
    x.set(0)
    setIsOpen(false)
  }

  const handleToggleCompleted = () => {
    onToggleCompleted(item.id)
  }

  return (
    <div ref={containerRef} className={cn("relative overflow-hidden", className)}>
      {/* Actions Background - Horizontal Menu */}
      <motion.div
        className="absolute right-0 top-0 bottom-0 flex items-center"
        style={{
          translateX: useTransform(xSpring, [0, -160], [160, 0]),
          opacity: actionsOpacity,
          borderRadius: useTransform(xSpring, [0, -160], ['0', '0 0.5rem 0.5rem 0']),
        }}
      >
        <div className="flex items-center gap-0 h-full">
          {/* Delete Button */}
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            className="h-full w-20 p-0 rounded-none shadow-lg bg-red-500 hover:bg-red-600 border-r border-red-400"
          >
            <Trash2 size={16} />
          </Button>
          
          {/* Move to Next Month Button */}
          <Button
            variant="secondary"
            size="sm"
            onClick={handleMoveToNextMonth}
            className="h-full w-20 p-0 rounded-none shadow-lg bg-orange-500 hover:bg-orange-600 text-white"
          >
            <Calendar size={16} />
          </Button>
        </div>
      </motion.div>

      {/* Main Item */}
      <motion.div
        className="relative bg-card border border-border shadow-sm"
        style={{
          translateX: itemTranslateX,
          scale: itemScale,
          opacity: itemOpacity,
          borderRadius: useTransform(xSpring, [0, -128], ['0.5rem', '0.5rem 0 0 0.5rem']),
        }}
        onPan={handlePan}
        onPanStart={handlePanStart}
        onPanEnd={handlePanEnd}
        drag="x"
        dragConstraints={{ left: -160, right: 0 }}
        dragElastic={0.1}
        whileDrag={{ 
          scale: 1.02,
          boxShadow: "0 10px 25px rgba(0,0,0,0.1)"
        }}
      >
        <div className="flex items-center p-4 gap-3">
          {/* Drag Handle */}
          <div className="flex-shrink-0 text-muted-foreground">
            <GripVertical size={16} />
          </div>

          {/* Optimistic Checkbox */}
          <OptimisticCheckbox
            checked={item.completed}
            onToggle={onToggleCompleted}
            itemId={item.id}
            aria-label={item.completed ? 'Marcar como pendiente' : 'Marcar como completado'}
            className="flex-shrink-0"
          />

          {/* Item Content */}
          <div className="flex-1 min-w-0">
            <div className={cn(
              "text-sm font-medium transition-colors",
              item.completed 
                ? "text-muted-foreground line-through" 
                : "text-foreground"
            )}>
              {item.name.getValue()}
            </div>
            <div className="text-xs text-muted-foreground capitalize">
              {item.category.getValue()}
            </div>
          </div>

          {/* Status Badge */}
          <div className={cn(
            "px-2 py-1 rounded-full text-xs font-medium",
            item.status.getValue() === 'este-mes'
              ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
              : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
          )}>
            {item.status.getValue() === 'este-mes' ? 'Este mes' : 'Próximo mes'}
          </div>
        </div>

        {/* Swipe Indicator */}
        <motion.div
          className="absolute left-0 top-0 bottom-0 w-1 bg-primary/50"
          style={{
            scaleY: useTransform(xSpring, [0, -120], [0, 1]),
            opacity: useTransform(xSpring, [0, -30, -120], [0, 0.5, 1]),
          }}
        />
      </motion.div>
    </div>
  )
}
