import { useState } from 'react';
import { Button } from './Button';

interface QuoteActionsProps {
  disabled: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

// The confirmation is inline (no window.confirm) so it is accessible, styleable and works on mobile.
export function QuoteActions({ disabled, onEdit, onDelete }: QuoteActionsProps) {
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <div
        role="group"
        aria-label="Confirmar exclusão do orçamento"
        className="flex flex-col gap-2 rounded-md bg-white p-4 shadow-sm"
      >
        <p className="text-sm text-slate-700">
          Excluir este orçamento? Os contatos registrados também serão excluídos.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            variant="danger"
            disabled={disabled}
            onClick={() => {
              setConfirming(false);
              onDelete();
            }}
          >
            Confirmar exclusão
          </Button>
          <Button variant="secondary" onClick={() => setConfirming(false)}>
            Cancelar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <Button variant="secondary" disabled={disabled} onClick={onEdit}>
        Editar
      </Button>
      <Button variant="secondary" disabled={disabled} onClick={() => setConfirming(true)}>
        Excluir
      </Button>
    </div>
  );
}
