import React from 'react'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onClear?: () => void
  showClearButton?: boolean
  placeholder?: string
}

export function SearchInput({ 
  onClear, 
  showClearButton = true, 
  placeholder = "Buscar...",
  className,
  value,
  ...props 
}: SearchInputProps) {
  const hasValue = value && String(value).length > 0

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
      <Input
        {...props}
        value={value}
        placeholder={placeholder}
        className={cn(
          "pl-10 pr-10 h-10",
          className
        )}
      />
      {showClearButton && hasValue && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-muted"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}
