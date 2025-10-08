"use client"

import { useCallback, useMemo } from 'react'
import type { DropResult } from '@hello-pangea/dnd'

interface UseDragDropProps {
  onReorderItems: (status: string, sourceIndex: number, destIndex: number) => Promise<void>
  activeTab: string
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
    }
  }, [onReorderItems, activeTab])

  const dragDropProps = useMemo(() => ({
    onDragEnd,
  }), [onDragEnd])

  return dragDropProps
}
