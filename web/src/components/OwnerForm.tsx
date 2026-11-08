import { useState, type FormEvent } from 'react';
import { createOwner } from '../api/owners';
import { useSubmit } from '../hooks/useSubmit';
import { Button } from './Button';
import { FormField } from './FormField';

const KNOWN_FIELDS = ['name', 'role'];

interface OwnerFormProps {
  onSaved: () => void;
  onCancel: () => void;
}

export function OwnerForm({ onSaved, onCancel }: OwnerFormProps) {
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const { submitting, fieldErrors, message, run } = useSubmit(KNOWN_FIELDS);

  const canSubmit = name.trim() !== '' && role.trim() !== '' && !submitting;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const saved = await run(() => createOwner({ name: name.trim(), role: role.trim() }));
    if (saved) onSaved();
  }

  return (
    <form onSubmit={handleSubmit} className="mb-6 space-y-4 rounded-md bg-white p-4 shadow-sm">
      <h2 className="text-lg font-semibold">Novo responsável</h2>
      {message && (
        <p role="alert" className="rounded-md bg-red-50 p-3 text-red-800">
          {message}
        </p>
      )}
      <FormField label="Nome" required error={fieldErrors.name}>
        <input className="field-input" value={name} onChange={(e) => setName(e.target.value)} />
      </FormField>
      <FormField label="Cargo/função" required error={fieldErrors.role}>
        <input className="field-input" value={role} onChange={(e) => setRole(e.target.value)} />
      </FormField>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button type="submit" disabled={!canSubmit}>
          {submitting ? 'Salvando...' : 'Salvar'}
        </Button>
        <Button variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
