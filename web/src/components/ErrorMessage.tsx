import { ApiError } from '../api/client';
import { Button } from './Button';

interface ErrorMessageProps {
  error: Error;
  onRetry?: () => void;
}

export function ErrorMessage({ error, onRetry }: ErrorMessageProps) {
  const text = error instanceof ApiError ? error.detail : 'Erro inesperado';
  return (
    <div
      role="alert"
      className="flex flex-col items-start gap-3 rounded-[8px] border border-[#A12A2A] bg-[#FDECEC] p-5 text-sm font-medium text-[#A12A2A]"
    >
      <p>{text}</p>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry} className="!text-sm">
          Tentar de novo
        </Button>
      )}
    </div>
  );
}
