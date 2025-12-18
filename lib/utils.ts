import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Navigate back in the browser history
 * @param router - Next.js router instance from useRouter()
 * @param fallbackPath - Optional fallback path if there's no history (default: '/')
 */
export function goBack(router: AppRouterInstance, fallbackPath: string = '/') {
  // Check if there's history to go back to
  if (typeof window !== 'undefined' && window.history.length > 1) {
    router.back()
  } else {
    // If no history, navigate to fallback
    router.push(fallbackPath)
  }
}
