"use client"

import { useToast as useRadixToast } from "@/hooks/use-toast"

export function useToast() {
  const { toast } = useRadixToast()

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
    showSuccess,
    showError,
    showInfo,
  }
}
