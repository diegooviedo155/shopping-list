"use client"

import { ShoppingListManager } from "@/components/features/shopping-list/ShoppingListManager"
import { useRouter } from "next/navigation"

export default function ListsPage() {
  const router = useRouter()
  
  return (
    <ShoppingListManager onBack={() => router.push('/')} />
  )
}
