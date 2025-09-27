"use client"

import { useCallback, useMemo } from 'react'
import type { DropResult } from '@hello-pangea/dnd'
import type { ItemStatus } from '@/lib/types/database'

interface UseDragDropProps {
  onReorderItems: (status: ItemStatus, sourceIndex: number, destIndex: number) => Promise<void>
  activeTab: ItemStatus
}

export function useDragDrop({ onReorderItems, activeTab }: UseDragDropProps) {
  const onDragEnd = useCallback(async (result: DropResult) => {
    if (!result.destination) return

    const sourceIndex = result.source.index
    const destIndex = result.destination.index

    if (sourceIndex === destIndex) return

    try {
      await onReorderItems(activeTab, sourceIndex, destIndex)
    } catch (error) {
      console.error('Error reordering items:', error)
    }
  }, [onReorderItems, activeTab])

  const dragDropProps = useMemo(() => ({
    onDragEnd,
  }), [onDragEnd])

  return dragDropProps
}
