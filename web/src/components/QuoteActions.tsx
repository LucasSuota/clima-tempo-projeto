import { useState } from 'react';
import { Button } from './Button';

interface QuoteActionsProps {
  disabled: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

export function QuoteActions({ disabled, onEdit, onDelete }: QuoteActionsProps) {
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <div
        role="group"
        aria-label="Confirmar exclusão do orçamento"
        className="flex flex-col gap-3 rounded-[8px] border border-[#DDE5EC] bg-white p-5"
      >
        <p className="text-sm font-medium text-[#0F1F2B]">
          Excluir este orçamento? Os contatos registrados também serão excluídos.
        </p>
        <div className="flex flex-wrap gap-3">
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
    <div className="flex flex-wrap gap-3">
      <Button variant="secondary" disabled={disabled} onClick={onEdit}>
        Editar
      </Button>
      <Button variant="secondary" disabled={disabled} onClick={() => setConfirming(true)}>
        Excluir
      </Button>
    </div>
  );
}
