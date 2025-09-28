import { useId } from 'react'

/**
 * Hook para generar IDs estables que funcionan correctamente con SSR
 * Evita problemas de hidratación al usar useId de React
 */
export function useStableId(prefix?: string): string {
  const id = useId()
  return prefix ? `${prefix}-${id}` : id
}
