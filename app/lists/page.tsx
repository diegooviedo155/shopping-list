"use client"

import { ShoppingListManager } from "@/components/improved/shopping-list-manager"
import { useRouter } from "next/navigation"

export default function ListsPage() {
  const router = useRouter()
  
  return (
    <ShoppingListManager onBack={() => router.push('/')} />
  )
}
