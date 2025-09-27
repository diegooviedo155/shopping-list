"use client"

import { useState, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from 'framer-motion'
import { Button, Icon } from '../../atoms'
import { ButtonGroup } from '../../molecules'
import { AddItemForm, ItemList } from '../../organisms'
import { PageHeader, PageLayout } from '../../templates'
import { usePageTransitions } from '../../../hooks'
import { useShoppingItems } from '../../../hooks/use-shopping-items-simple'
import { useToast } from '../../../hooks/use-toast'
import { LoadingOverlay } from '@/components/loading-states'
import { ErrorBoundary, ShoppingListErrorFallback } from '@/components/error-boundary'
import { cn } from '@/lib/utils'
import { Calendar, CalendarDays } from 'lucide-react'

interface ShoppingListManagerProps {
  onBack: () => void
}

const STATUS_OPTIONS = [
  { value: 'este-mes', label: 'Este mes', icon: <Icon icon={Calendar} size="sm" /> },
  { value: 'proximo-mes', label: 'Próximo mes', icon: <Icon icon={CalendarDays} size="sm" /> },
]

export function ShoppingListManager({ onBack }: ShoppingListManagerProps) {
  const {
    items,
    loading,
    error,
    createItem,
    toggleItemCompleted,
    deleteItem,
    moveItemToStatus,
    reorderItems,
    getItemsByStatus,
  } = useShoppingItems()

  const { showSuccess, showError } = useToast()
  const { StaggerContainer, StaggerItem } = usePageTransitions()
  const [activeTab, setActiveTab] = useState<'este-mes' | 'proximo-mes'>('este-mes')

  // Limpiar errores al cambiar de tab
  useEffect(() => {
    if (error) {
      // Clear error logic here if needed
    }
  }, [activeTab, error])

  const handleAddItem = async (data: { name: string; category: string; status: string }) => {
    try {
      await createItem(data.name, data.category, data.status)
      showSuccess('Producto agregado', `${data.name} se agregó a la lista`)
    } catch (error) {
      showError('Error', 'No se pudo agregar el producto')
    }
  }

  const handleToggleCompleted = async (id: string) => {
    try {
      await toggleItemCompleted(id)
      const item = items.find(item => item.id === id)
      if (item) {
        showSuccess(
          item.completed ? 'Producto completado' : 'Producto pendiente',
          `${item.name.getValue()} marcado como ${item.completed ? 'completado' : 'pendiente'}`
        )
      }
    } catch (error) {
      showError('Error', 'No se pudo actualizar el producto')
    }
  }

  const handleDeleteItem = async (id: string) => {
    try {
      const item = items.find(item => item.id === id)
      await deleteItem(id)
      if (item) {
        showSuccess('Producto eliminado', `${item.name.getValue()} se eliminó de la lista`)
      }
    } catch (error) {
      showError('Error', 'No se pudo eliminar el producto')
    }
  }

  const handleMoveToStatus = async (id: string, newStatus: string) => {
    try {
      const item = items.find(item => item.id === id)
      await moveItemToStatus(id, newStatus)
      if (item) {
        const statusLabels = { 'este-mes': 'Este mes', 'proximo-mes': 'Próximo mes' }
        showSuccess(
          'Producto movido',
          `${item.name.getValue()} movido a ${statusLabels[newStatus as keyof typeof statusLabels]}`
        )
      }
    } catch (error) {
      showError('Error', 'No se pudo mover el producto')
    }
  }

  const handleReorder = async (status: string, sourceIndex: number, destIndex: number) => {
    try {
      await reorderItems(status, sourceIndex, destIndex)
    } catch (error) {
      showError('Error', 'No se pudo reordenar los productos')
    }
  }

  const currentItems = useMemo(() => {
    return getItemsByStatus(activeTab)
  }, [getItemsByStatus, activeTab])

  const progress = useMemo(() => {
    const completed = currentItems.filter(item => item.completed).length
    const total = currentItems.length
    return { current: completed, total, label: 'completados' }
  }, [currentItems])

  const header = (
    <PageHeader
      title="Listas de Compras"
      progress={progress.total > 0 ? progress : undefined}
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
                onChange={(value) => setActiveTab(value as 'este-mes' | 'proximo-mes')}
                variant="outline"
                size="sm"
              />
            </motion.div>
          </StaggerItem>

          {/* Add Item Form */}
          <StaggerItem>
            <motion.div 
              className="mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <AddItemForm
                onAddItem={handleAddItem}
                isLoading={loading}
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
      </PageLayout>
    </ErrorBoundary>
  )
}