export type ItemStatusValue = 'este-mes' | 'proximo-mes'

export class ItemStatus {
  private static readonly VALID_STATUSES: ItemStatusValue[] = ['este-mes', 'proximo-mes']

  private constructor(private readonly value: ItemStatusValue) {}

  static create(status: string): ItemStatus {
    if (!ItemStatus.VALID_STATUSES.includes(status as ItemStatusValue)) {
      throw new Error(`Invalid item status: ${status}`)
    }
    return new ItemStatus(status as ItemStatusValue)
  }

  static esteMes(): ItemStatus {
    return new ItemStatus('este-mes')
  }

  static proximoMes(): ItemStatus {
    return new ItemStatus('proximo-mes')
  }

  getValue(): ItemStatusValue {
    return this.value
  }

  equals(other: ItemStatus): boolean {
    return this.value === other.value
  }

  toString(): string {
    return this.value
  }

  static isValid(status: string): boolean {
    return ItemStatus.VALID_STATUSES.includes(status as ItemStatusValue)
  }
}
