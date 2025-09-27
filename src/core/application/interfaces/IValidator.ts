export interface ValidationResult {
  isValid: boolean
  errors: string[]
}

export interface IValidator<T> {
  validate(data: T): ValidationResult
}
