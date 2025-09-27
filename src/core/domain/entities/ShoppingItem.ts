import { ItemName } from '../value-objects/ItemName'
import { ItemStatus } from '../value-objects/ItemStatus'
import { Category } from '../value-objects/Category'

export interface ShoppingItemProps {
  id: string
  name: ItemName
  category: Category
  status: ItemStatus
  completed: boolean
  orderIndex: number
  createdAt: Date
  updatedAt: Date
}

export class ShoppingItem {
  private constructor(private props: ShoppingItemProps) {}

  static create(props: Omit<ShoppingItemProps, 'id' | 'createdAt' | 'updatedAt'>): ShoppingItem {
    const now = new Date()
    return new ShoppingItem({
      ...props,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    })
  }

  static fromPersistence(props: ShoppingItemProps): ShoppingItem {
    return new ShoppingItem(props)
  }

  // Getters
  get id(): string {
    return this.props.id
  }

  get name(): ItemName {
    return this.props.name
  }

  get category(): Category {
    return this.props.category
  }

  get status(): ItemStatus {
    return this.props.status
  }

  get completed(): boolean {
    return this.props.completed
  }

  get orderIndex(): number {
    return this.props.orderIndex
  }

  get createdAt(): Date {
    return this.props.createdAt
  }

  get updatedAt(): Date {
    return this.props.updatedAt
  }

  // Business Methods
  markAsCompleted(): void {
    this.props.completed = true
    this.props.updatedAt = new Date()
  }

  markAsPending(): void {
    this.props.completed = false
    this.props.updatedAt = new Date()
  }

  updateStatus(newStatus: ItemStatus): void {
    this.props.status = newStatus
    this.props.updatedAt = new Date()
  }

  updateOrderIndex(newIndex: number): void {
    this.props.orderIndex = newIndex
    this.props.updatedAt = new Date()
  }

  updateName(newName: ItemName): void {
    this.props.name = newName
    this.props.updatedAt = new Date()
  }

  // Serialization
  toJSON(): Record<string, any> {
    return {
      id: this.props.id,
      name: this.props.name.value,
      category: this.props.category.value,
      status: this.props.status.value,
      completed: this.props.completed,
      orderIndex: this.props.orderIndex,
      createdAt: this.props.createdAt.toISOString(),
      updatedAt: this.props.updatedAt.toISOString(),
    }
  }

  // Equality
  equals(other: ShoppingItem): boolean {
    return this.props.id === other.props.id
  }
}
