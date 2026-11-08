import type { ApiErrorBody, FieldError } from './types';

const API_BASE = '/api';

export class ApiError extends Error {
  readonly status: number;
  readonly detail: string;
  readonly errors: FieldError[];

  constructor(status: number, detail: string, errors: FieldError[]) {
    super(detail);
    this.name = 'ApiError';
    this.status = status;
    this.detail = detail;
    this.errors = errors;
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH';
  body?: unknown;
}

function isFieldError(value: unknown): value is FieldError {
  return (
    typeof value === 'object' &&
    value !== null &&
    'field' in value &&
    typeof value.field === 'string' &&
    'message' in value &&
    typeof value.message === 'string'
  );
}

function isApiErrorBody(value: unknown): value is ApiErrorBody {
  return (
    typeof value === 'object' &&
    value !== null &&
    'detail' in value &&
    typeof value.detail === 'string' &&
    'errors' in value &&
    Array.isArray(value.errors) &&
    value.errors.every(isFieldError)
  );
}

async function toApiError(response: Response): Promise<ApiError> {
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    // The proxy or a gateway can answer with HTML when the server is down.
    return new ApiError(response.status, 'Erro inesperado do servidor', []);
  }
  if (isApiErrorBody(body)) return new ApiError(response.status, body.detail, body.errors);
  return new ApiError(response.status, 'Erro inesperado do servidor', []);
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body } = options;
  const hasBody = body !== undefined;

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      headers: hasBody ? { 'Content-Type': 'application/json' } : undefined,
      body: hasBody ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, 'Não foi possível conectar ao servidor', []);
  }

  if (!response.ok) throw await toApiError(response);
  if (response.status === 204) return undefined as T;
  // The API is trusted, and zod stays on the server (AGENTS.md §3.2), so the shape is asserted.
  return (await response.json()) as T;
}
