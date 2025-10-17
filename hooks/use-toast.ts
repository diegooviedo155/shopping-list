"use client"

import { useToast as useRadixToast } from "@/components/ui/use-toast"

export function useToast() {
  const { toast, toasts } = useRadixToast()

  const showSuccess = (title: string, description?: string) => {
    toast({
      title,
      description,
      variant: "default",
    })
  }

  const showError = (title: string, description?: string) => {
    toast({
      title,
      description,
      variant: "destructive",
    })
  }

  const showInfo = (title: string, description?: string) => {
    toast({
      title,
      description,
      variant: "default",
    })
  }

  return {
    toast,
    toasts,
    showSuccess,
    showError,
    showInfo,
  }
}
