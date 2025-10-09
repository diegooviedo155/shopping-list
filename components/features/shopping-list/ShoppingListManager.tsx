"use client"

import { useState, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from 'framer-motion'
import { Button, FloatingActionButton } from '../../atoms'
import { ButtonGroup } from '../../molecules'
import { ItemList } from '../../organisms'
import { PageHeader, PageLayout } from '../../templates'
import { AddProductModal } from '../../modals'
import { usePageTransitions } from '../../../hooks'
import { useUnifiedShopping } from '../../../hooks/use-unified-shopping'
import { useToast } from '../../../hooks/use-toast'
import { LoadingOverlay } from '@/components/loading-states'
import { ErrorBoundary, ShoppingListErrorFallback } from '@/components/error-boundary'
import { cn } from '@/lib/utils'
import { Calendar, CalendarDays } from 'lucide-react'

interface ShoppingListManagerProps {
  onBack: () => void
}

const STATUS_OPTIONS = [
  { value: 'este-mes', label: 'Este mes', icon: <Calendar size={16} /> },
  { value: 'proximo-mes', label: 'Próximo mes', icon: <CalendarDays size={16} /> },
]

export function ShoppingListManager({ onBack }: ShoppingListManagerProps) {
  const {
    items,
    loading,
    error,
    activeTab,
    currentItems,
    completedCount,
    totalCount,
    addItem,
    toggleItemCompleted,
    deleteItem,
    moveItemToStatus,
    reorderItems,
    setActiveTab,
    clearError,
  } = useUnifiedShopping()

  const { showSuccess, showError } = useToast()
  const { StaggerContainer, StaggerItem } = usePageTransitions()

  // Limpiar errores al cambiar de tab
  useEffect(() => {
    if (error) {
      clearError()
    }
  }, [activeTab, error, clearError])

  const handleAddItem = async (data: { name: string; category: string; status: string }) => {
    try {
      await addItem(data.name, data.category as any, data.status as any)
      showSuccess('Producto agregado', `${data.name} se agregó a la lista`)
    } catch (error) {
      showError('Error', 'No se pudo agregar el producto')
    }
  }

  const handleToggleCompleted = async (id: string) => {
    try {
      await toggleItemCompleted(id)
      const item = currentItems.find(item => item.id === id)
      if (item) {
        showSuccess(
          item.completed ? 'Producto completado' : 'Producto pendiente',
          `${item.name} marcado como ${item.completed ? 'completado' : 'pendiente'}`
        )
      }
    } catch (error) {
      showError('Error', 'No se pudo actualizar el producto')
    }
  }

  const handleDeleteItem = async (id: string) => {
    try {
      const item = currentItems.find(item => item.id === id)
      await deleteItem(id)
      if (item) {
        showSuccess('Producto eliminado', `${item.name} se eliminó de la lista`)
      }
    } catch (error) {
      showError('Error', 'No se pudo eliminar el producto')
    }
  }

  const handleMoveToStatus = async (id: string, newStatus: string) => {
    try {
      const item = currentItems.find(item => item.id === id)
      await moveItemToStatus(id, newStatus as any)
      if (item) {
        const statusLabels = { 'este-mes': 'Este mes', 'proximo-mes': 'Próximo mes' }
        showSuccess(
          'Producto movido',
          `${item.name} movido a ${statusLabels[newStatus as keyof typeof statusLabels]}`
        )
      }
    } catch (error) {
      showError('Error', 'No se pudo mover el producto')
    }
  }

  const handleReorder = async (status: string, sourceIndex: number, destIndex: number) => {
    try {
      await reorderItems(status as any, sourceIndex, destIndex)
    } catch (error) {
      showError('Error', 'No se pudo reordenar los productos')
    }
  }

  const header = (
    <PageHeader
      title="Listas de Compras"
      showBackButton
      onBack={onBack}
    />
  )

  return (
    <ErrorBoundary fallback={ShoppingListErrorFallback}>
      <PageLayout header={header}>
        <StaggerContainer>
          {/* Month Tabs */}
          <StaggerItem>
            <motion.div 
              className="mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <ButtonGroup
                options={STATUS_OPTIONS}
                value={activeTab}
                onChange={(value) => setActiveTab(value as any)}
                variant="outline"
                size="sm"
              />
            </motion.div>
          </StaggerItem>


          {/* Items List */}
          <StaggerItem>
            <LoadingOverlay isLoading={loading && currentItems.length === 0}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <ItemList
                  items={currentItems}
                  activeTab={activeTab}
                  onToggleCompleted={handleToggleCompleted}
                  onMoveToStatus={handleMoveToStatus}
                  onDelete={handleDeleteItem}
                  onReorder={handleReorder}
                />
              </motion.div>
            </LoadingOverlay>
          </StaggerItem>
        </StaggerContainer>
        
        {/* Floating Action Button with Modal */}
        <AddProductModal
          onAddItem={handleAddItem}
          isLoading={loading}
          trigger={
            <FloatingActionButton
              size="md"
              position="bottom-right"
            />
          }
        />
      </PageLayout>
    </ErrorBoundary>
  )
}