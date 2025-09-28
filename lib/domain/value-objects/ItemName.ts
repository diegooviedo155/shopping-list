export class ItemName {
  private constructor(private readonly value: string) {}

  static create(name: string): ItemName {
    if (!name || name.trim().length === 0) {
      throw new Error('Item name cannot be empty')
    }
    
    if (name.length > 100) {
      throw new Error('Item name cannot exceed 100 characters')
    }

    return new ItemName(name.trim())
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
