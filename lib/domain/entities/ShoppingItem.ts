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
    return new ShoppingItem({
      ...props,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  }

  static fromPersistence(props: ShoppingItemProps): ShoppingItem {
    return new ShoppingItem(props)
  }

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

  toggleCompleted(): void {
    this.props.completed = !this.props.completed
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

  toPersistence(): ShoppingItemProps {
    return { ...this.props }
  }
}
