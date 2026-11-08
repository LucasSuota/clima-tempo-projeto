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

export class InvalidStatusTransitionError extends DomainError {
  constructor(from: string, to: string) {
    super(`Transição de status não permitida: de ${from} para ${to}`, 422);
  }
}

export class FollowUpNotAllowedError extends DomainError {
  constructor() {
    super('Não é possível registrar contato em orçamento em rascunho', 422);
  }
}

export class QuoteNotFoundError extends DomainError {
  constructor() {
    super('Orçamento não encontrado', 404);
  }
}
