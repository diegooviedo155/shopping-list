export class ItemName {
  private readonly value: string

  constructor(name: string) {
    if (!name || name.trim().length === 0) {
      throw new Error('Item name cannot be empty')
    }

    if (name.length < 2) {
      throw new Error('Item name must be at least 2 characters long')
    }

    if (name.length > 100) {
      throw new Error('Item name cannot exceed 100 characters')
    }

    this.value = name.trim()
  }

  getValue(): string {
    return this.value
  }

  equals(other: ItemName): boolean {
    return this.value === other.value
  }

  toString(): string {
    return this.value
  }
}
