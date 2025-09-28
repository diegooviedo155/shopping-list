export type CategoryValue = 'verduleria' | 'carniceria' | 'panaderia' | 'farmacia' | 'supermercado' | 'otro'

export class Category {
  private static readonly VALID_CATEGORIES: CategoryValue[] = [
    'verduleria',
    'carniceria', 
    'panaderia',
    'farmacia',
    'supermercado',
    'otro'
  ]

  private constructor(private readonly value: CategoryValue) {}

  static create(category: string): Category {
    if (!Category.VALID_CATEGORIES.includes(category as CategoryValue)) {
      throw new Error(`Invalid category: ${category}`)
    }
    return new Category(category as CategoryValue)
  }

  static verduleria(): Category {
    return new Category('verduleria')
  }

  static carniceria(): Category {
    return new Category('carniceria')
  }

  static panaderia(): Category {
    return new Category('panaderia')
  }

  static farmacia(): Category {
    return new Category('farmacia')
  }

  static supermercado(): Category {
    return new Category('supermercado')
  }

  static otro(): Category {
    return new Category('otro')
  }

  getValue(): CategoryValue {
    return this.value
  }

  equals(other: Category): boolean {
    return this.value === other.value
  }

  toString(): string {
    return this.value
  }

  static isValid(category: string): boolean {
    return Category.VALID_CATEGORIES.includes(category as CategoryValue)
  }

  static getAll(): CategoryValue[] {
    return [...Category.VALID_CATEGORIES]
  }
}
