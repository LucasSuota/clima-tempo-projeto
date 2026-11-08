import { ApiError } from '../api/client';
import { Button } from './Button';

interface ErrorMessageProps {
  error: Error;
  onRetry?: () => void;
}

export function ErrorMessage({ error, onRetry }: ErrorMessageProps) {
  const text = error instanceof ApiError ? error.detail : 'Erro inesperado';
  return (
    <div role="alert" className="rounded-md border border-red-200 bg-red-50 p-4 text-red-800">
      <p>{text}</p>
      {onRetry && (
        <Button variant="secondary" className="mt-3" onClick={onRetry}>
          Tentar de novo
        </Button>
      )}
    </div>
  );
}
