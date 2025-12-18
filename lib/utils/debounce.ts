// Utilidad para debouncing de funciones

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null
      func(...args)
    }

    if (timeout) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(later, wait)
  }
}

// Debounce con cancelación
export function debounceWithCancel<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): { debounced: (...args: Parameters<T>) => void; cancel: () => void } {
  let timeout: NodeJS.Timeout | null = null

  const debounced = (...args: Parameters<T>) => {
    const later = () => {
      timeout = null
      func(...args)
    }

    if (timeout) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(later, wait)
  }

  const cancel = () => {
    if (timeout) {
      clearTimeout(timeout)
      timeout = null
    }
  }

  return { debounced, cancel }
}

