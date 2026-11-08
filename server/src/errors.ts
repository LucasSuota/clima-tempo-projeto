export interface FieldError {
  field: string;
  message: string;
}

export class DomainError extends Error {
  constructor(
    readonly detail: string,
    readonly status: number,
    readonly errors: FieldError[] = [],
  ) {
    super(detail);
    this.name = new.target.name;
  }
}

export class ValidationError extends DomainError {
  constructor(errors: FieldError[] = []) {
    super('Dados inválidos', 422, errors);
  }
}
