import React, { useState, useRef, useEffect } from 'react'
import { motion, PanInfo, useMotionValue, useTransform } from 'framer-motion'
import { ItemCard } from '../ItemCard'
import { Button, Icon } from '../../atoms'
import { cn } from '@/lib/utils'
import { Trash2, ArrowRight } from 'lucide-react'
import { ShoppingItem } from '../../../../core/domain/entities/ShoppingItem'

export interface SwipeableItemCardProps {
  item: ShoppingItem
  isDragging?: boolean
  showDragHandle?: boolean
  showStatus?: boolean
  showMoveButton?: boolean
  onToggleCompleted?: (id: string) => void
  onMoveToStatus?: (id: string, newStatus: string) => void
  onDelete?: (id: string) => void
  onDragStart?: () => void
  onDragEnd?: () => void
  className?: string
}

const SWIPE_THRESHOLD = -80 // Píxeles necesarios para activar el swipe
const MAX_SWIPE = -160 // Máximo swipe permitido (más espacio para dos botones)

export const SwipeableItemCard = React.forwardRef<HTMLDivElement, SwipeableItemCardProps>(
  ({
    item,
    isDragging = false,
    showDragHandle = true,
    showStatus = true,
    showMoveButton = true,
    onToggleCompleted,
    onMoveToStatus,
    onDelete,
    onDragStart,
    onDragEnd,
    className
  }, ref) => {
    const [isSwipeOpen, setIsSwipeOpen] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [isSwipeActive, setIsSwipeActive] = useState(false)
    const x = useMotionValue(0)
    const opacity = useTransform(x, [-160, 0], [1, 0])
    const scale = useTransform(x, [-160, 0], [1, 0.9])
    
    // Determinar el estado opuesto para el botón de mover
    const currentStatus = item.status.getValue()
    const oppositeStatus = currentStatus === 'este-mes' ? 'proximo-mes' : 'este-mes'
    const oppositeStatusLabel = oppositeStatus === 'este-mes' ? 'Este mes' : 'Próximo mes'

    const handlePanStart = () => {
      setIsSwipeActive(true)
    }

    const handlePan = (event: any, info: PanInfo) => {
      const { offset } = info
      
      // Solo permitir swipe hacia la izquierda y limitar el máximo
      if (offset.x < 0) {
        const clampedX = Math.max(offset.x, MAX_SWIPE)
        x.set(clampedX)
      }
    }

    const handlePanEnd = (event: any, info: PanInfo) => {
      const { offset, velocity } = info
      
      setIsSwipeActive(false)
      
      // Si el swipe es suficiente o la velocidad es alta
      if (offset.x < SWIPE_THRESHOLD || velocity.x < -500) {
        setIsSwipeOpen(true)
        x.set(-120) // Posición abierta para mostrar ambos botones
      } else {
        // Volver a la posición original
        x.set(0)
        setIsSwipeOpen(false)
      }
    }

    const handleDelete = () => {
      if (onDelete) {
        setIsDeleting(true)
        onDelete(item.id)
      }
    }

    const handleMoveToStatus = () => {
      if (onMoveToStatus) {
        onMoveToStatus(item.id, oppositeStatus)
        closeSwipe()
      }
    }

    const closeSwipe = () => {
      x.set(0)
      setIsSwipeOpen(false)
    }

    // Cerrar swipe si se hace clic fuera
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (isSwipeOpen) {
          closeSwipe()
        }
      }

      if (isSwipeOpen) {
        document.addEventListener('click', handleClickOutside)
        return () => document.removeEventListener('click', handleClickOutside)
      }
    }, [isSwipeOpen])

    return (
      <div className="relative overflow-hidden rounded-lg">
        {/* Botones de acción detrás */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-blue-500 to-red-500 flex items-center justify-end z-0"
          style={{
            opacity,
            scale
          }}
        >
          <div className="flex items-center gap-2 pr-4">
            {/* Botón de mover al mes opuesto */}
            <motion.div
              className="flex flex-col items-center gap-1"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Button
                variant="secondary"
                size="sm"
                onClick={handleMoveToStatus}
                className="h-12 w-12 p-0 rounded-full bg-blue-500 hover:bg-blue-600 text-white shadow-lg"
                aria-label={`Mover a ${oppositeStatusLabel}`}
              >
                <Icon icon={ArrowRight} size="md" />
              </Button>
              <span className="text-xs text-white font-medium">{oppositeStatusLabel}</span>
            </motion.div>
            
            {/* Botón de eliminar */}
            <motion.div
              className="flex flex-col items-center gap-1"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={isDeleting}
                className="h-12 w-12 p-0 rounded-full shadow-lg"
                aria-label="Eliminar producto"
              >
                <Icon icon={Trash2} size="md" />
              </Button>
              <span className="text-xs text-white font-medium">Eliminar</span>
            </motion.div>
          </div>
        </motion.div>

        {/* Card principal */}
        <motion.div
          ref={ref}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.1}
          onPanStart={handlePanStart}
          onPan={handlePan}
          onPanEnd={handlePanEnd}
          style={{ x }}
          className="relative z-10 bg-background"
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
        >
          <ItemCard
            item={item}
            isDragging={isDragging}
            showDragHandle={showDragHandle}
            showStatus={showStatus}
            showMoveButton={false} // Ocultar botón de mover del ItemCard (ahora está en swipe)
            showDeleteButton={false} // Ocultar botón de eliminar del ItemCard (ahora está en swipe)
            onToggleCompleted={onToggleCompleted}
            onMoveToStatus={onMoveToStatus}
            onDelete={onDelete}
            className={cn(
              'transition-all duration-200',
              isSwipeOpen && 'shadow-lg',
              isDeleting && 'opacity-50'
            )}
          />
        </motion.div>

        {/* Indicador de swipe */}
        {!isSwipeOpen && !isSwipeActive && (
          <motion.div
            className="absolute right-2 top-1/2 transform -translate-y-1/2 z-20 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="flex flex-col items-center space-y-1 text-muted-foreground">
              <div className="w-1 h-1 bg-current rounded-full"></div>
              <div className="w-1 h-1 bg-current rounded-full"></div>
              <div className="w-1 h-1 bg-current rounded-full"></div>
            </div>
          </motion.div>
        )}

        {/* Indicador de swipe activo */}
        {isSwipeActive && (
          <motion.div
            className="absolute right-2 top-1/2 transform -translate-y-1/2 z-20 pointer-events-none"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            <div className="text-blue-500 text-xs font-medium">← Desliza para acciones</div>
          </motion.div>
        )}
      </div>
    )
  }
)

SwipeableItemCard.displayName = 'SwipeableItemCard'