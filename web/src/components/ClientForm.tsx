import { useState, type FormEvent } from 'react';
import { createClient } from '../api/clients';
import { useSubmit } from '../hooks/useSubmit';
import { Button } from './Button';
import { FormField } from './FormField';

const KNOWN_FIELDS = ['name', 'email', 'phone'];

interface ClientFormProps {
  onSaved: () => void;
  onCancel: () => void;
}

export function ClientForm({ onSaved, onCancel }: ClientFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const { submitting, fieldErrors, message, run } = useSubmit(KNOWN_FIELDS);

  const canSubmit = name.trim() !== '' && !submitting;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    // Empty optional fields are left out instead of sent as empty strings.
    const input = {
      name: name.trim(),
      ...(email.trim() !== '' && { email: email.trim() }),
      ...(phone.trim() !== '' && { phone: phone.trim() }),
    };
    const saved = await run(() => createClient(input));
    if (saved) onSaved();
  }

  return (
    <form onSubmit={handleSubmit} className="mb-6 space-y-4 rounded-md bg-white p-4 shadow-sm">
      <h2 className="text-lg font-semibold">Novo cliente</h2>
      {message && (
        <p role="alert" className="rounded-md bg-red-50 p-3 text-red-800">
          {message}
        </p>
      )}
      <FormField label="Nome" required error={fieldErrors.name}>
        <input className="field-input" value={name} onChange={(e) => setName(e.target.value)} />
      </FormField>
      <FormField label="E-mail" error={fieldErrors.email}>
        <input
          type="email"
          className="field-input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </FormField>
      <FormField label="Telefone" error={fieldErrors.phone}>
        <input
          type="tel"
          className="field-input"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
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
