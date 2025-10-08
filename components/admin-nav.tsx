"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Settings, ShoppingCart } from 'lucide-react'
import { cn } from '@/lib/utils'

export function AdminNav() {
  const pathname = usePathname()

  return (
    <nav className="bg-card border-b border-border px-4 py-4 sticky top-0 z-10">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
            </Link>
          </Button>
          <h1 className="text-lg font-semibold">Administración</h1>
        </div>
      </div>
    </nav>
  )
}
