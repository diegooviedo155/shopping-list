export interface Category {
  id: string
  name: string
  slug: string
  color?: string
  icon?: string
  isActive: boolean
  orderIndex: number
  createdAt: Date
  updatedAt: Date
}

export interface CreateCategoryData {
  name: string
  slug: string
  color?: string
  icon?: string
  orderIndex?: number
}

export interface UpdateCategoryData {
  name?: string
  slug?: string
  color?: string
  icon?: string
  isActive?: boolean
  orderIndex?: number
}
