import { useState } from 'react';
import type { Client } from '../api/types';
import { Button } from './Button';
import { EditIcon, IconButton, TrashIcon } from './IconButton';

interface ClientActionsProps {
  client: Client;
  disabled: boolean;
  onEdit: (client: Client) => void;
  onDelete: (client: Client) => void;
}

export function ClientActions({ client, disabled, onEdit, onDelete }: ClientActionsProps) {
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <div
        role="group"
        aria-label={`Confirmar exclusão de ${client.name}`}
        className="flex items-center justify-end gap-2"
      >
        <span className="text-xs text-[#52646F]">Excluir?</span>
        <Button
          variant="danger"
          disabled={disabled}
          onClick={() => {
            setConfirming(false);
            onDelete(client);
          }}
          className="!px-3 !text-sm"
        >
          Confirmar
        </Button>
        <Button variant="secondary" onClick={() => setConfirming(false)} className="!px-3 !text-sm">
          Não
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-end gap-1">
      <IconButton
        aria-label={`Editar ${client.name}`}
        disabled={disabled}
        onClick={() => onEdit(client)}
      >
        <EditIcon />
      </IconButton>
      <IconButton
        variant="danger"
        aria-label={`Excluir ${client.name}`}
        disabled={disabled}
        onClick={() => setConfirming(true)}
      >
        <TrashIcon />
      </IconButton>
    </div>
  );
}
