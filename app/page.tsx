'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { HomePage } from "@/components/features/home/HomePage"

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export default function Page() {
  const router = useRouter()

  useEffect(() => {
    // Verificar si hay un access_token en el hash (fallback)
    if (window.location.hash && window.location.hash.includes('access_token')) {
      const hash = window.location.hash
      router.replace('/auth/callback' + hash)
    }
  }, [router])

  return <HomePage />
}
