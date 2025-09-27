export enum CategoryValue {
  SUPERMARKET = 'supermercado',
  GREENGROCER = 'verduleria',
  BUTCHER = 'carniceria',
}

export class Category {
  private readonly value: CategoryValue

  constructor(category: string) {
    if (!Object.values(CategoryValue).includes(category as CategoryValue)) {
      throw new Error(`Invalid category: ${category}`)
    }

    this.value = category as CategoryValue
  }

  static supermarket(): Category {
    return new Category(CategoryValue.SUPERMARKET)
  }

  static greengrocer(): Category {
    return new Category(CategoryValue.GREENGROCER)
  }

  static butcher(): Category {
    return new Category(CategoryValue.BUTCHER)
  }

  getValue(): CategoryValue {
    return this.value
  }

  isSupermarket(): boolean {
    return this.value === CategoryValue.SUPERMARKET
  }

  isGreengrocer(): boolean {
    return this.value === CategoryValue.GREENGROCER
  }

  isButcher(): boolean {
    return this.value === CategoryValue.BUTCHER
  }

  equals(other: Category): boolean {
    return this.value === other.value
  }

  toString(): string {
    return this.value
  }
}
