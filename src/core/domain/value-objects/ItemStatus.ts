export enum ItemStatusValue {
  THIS_MONTH = 'este-mes',
  NEXT_MONTH = 'proximo-mes',
}

export class ItemStatus {
  private readonly value: ItemStatusValue

  constructor(status: string) {
    if (!Object.values(ItemStatusValue).includes(status as ItemStatusValue)) {
      throw new Error(`Invalid item status: ${status}`)
    }

    this.value = status as ItemStatusValue
  }

  static thisMonth(): ItemStatus {
    return new ItemStatus(ItemStatusValue.THIS_MONTH)
  }

  static nextMonth(): ItemStatus {
    return new ItemStatus(ItemStatusValue.NEXT_MONTH)
  }

  getValue(): ItemStatusValue {
    return this.value
  }

  isThisMonth(): boolean {
    return this.value === ItemStatusValue.THIS_MONTH
  }

  isNextMonth(): boolean {
    return this.value === ItemStatusValue.NEXT_MONTH
  }

  equals(other: ItemStatus): boolean {
    return this.value === other.value
  }

  toString(): string {
    return this.value
  }
}
