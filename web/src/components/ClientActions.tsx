import { useState } from 'react';
import type { Client } from '../api/types';
import { Button } from './Button';

interface ClientActionsProps {
  client: Client;
  disabled: boolean;
  onEdit: (client: Client) => void;
  onDelete: (client: Client) => void;
}

// The confirmation is inline (no window.confirm) so it is accessible, styleable and works on mobile.
export function ClientActions({ client, disabled, onEdit, onDelete }: ClientActionsProps) {
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <div
        role="group"
        aria-label={`Confirmar exclusão de ${client.name}`}
        className="flex flex-col gap-2"
      >
        <p className="text-sm text-slate-700">Excluir {client.name}?</p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            variant="danger"
            disabled={disabled}
            onClick={() => {
              setConfirming(false);
              onDelete(client);
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
      <Button variant="secondary" disabled={disabled} onClick={() => onEdit(client)}>
        Editar
      </Button>
      <Button variant="secondary" disabled={disabled} onClick={() => setConfirming(true)}>
        Excluir
      </Button>
    </div>
  );
}
