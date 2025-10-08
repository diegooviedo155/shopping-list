"use client"

import { useParams, useRouter } from "next/navigation"
import { CategoryView } from "@/components/category-view"

export default function CategoryPage() {
  const params = useParams()
  const router = useRouter()
  const categoryId = params.categoryId as string

  const handleBack = () => {
    router.push('/')
  }

  return (
    <CategoryView 
      category={categoryId} 
      onBack={handleBack} 
    />
  )
}
