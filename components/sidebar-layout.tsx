"use client"

import * as React from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

interface SidebarLayoutProps {
  children: React.ReactNode
  title?: string
  description?: string
  showBackButton?: boolean
  onBack?: () => void
  headerActions?: React.ReactNode
}

export function SidebarLayout({ 
  children, 
  title, 
  description, 
  showBackButton = false, 
  onBack,
  headerActions 
}: SidebarLayoutProps) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-4 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          
          {/* Back Button */}
          {showBackButton && onBack && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="h-8 w-8 p-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          
          {/* Title and Description */}
          {(title || description) && (
            <div className="flex-1 min-w-0">
              {title && (
                <h1 className="text-lg font-semibold truncate">{title}</h1>
              )}
              {description && (
                <p className="text-sm text-muted-foreground truncate">{description}</p>
              )}
            </div>
          )}
          
          {/* Actions */}
          {headerActions && (
            <div className="ml-auto">
              {headerActions}
            </div>
          )}
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
