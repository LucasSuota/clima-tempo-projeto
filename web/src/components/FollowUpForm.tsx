import { useState, type FormEvent } from 'react';
import { createFollowUp } from '../api/follow-ups';
import { useSubmit } from '../hooks/useSubmit';
import { Button } from './Button';
import { FormField } from './FormField';

const KNOWN_FIELDS = ['contactedAt', 'description'];

interface FollowUpFormProps {
  quoteId: number;
  onSaved: () => void;
}

// No draft check here: the server refuses it and its message shows in the banner (§7).
export function FollowUpForm({ quoteId, onSaved }: FollowUpFormProps) {
  const [contactedAt, setContactedAt] = useState('');
  const [description, setDescription] = useState('');
  const { submitting, fieldErrors, message, run } = useSubmit(KNOWN_FIELDS);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const saved = await run(() =>
      createFollowUp(quoteId, {
        // An empty date means "today", which the server decides in its own timezone.
        ...(contactedAt !== '' && { contactedAt }),
        ...(description.trim() !== '' && { description: description.trim() }),
      }),
    );
    if (!saved) return;
    setContactedAt('');
    setDescription('');
    onSaved();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-md bg-white p-4 shadow-sm">
      <h2 className="text-lg font-semibold">Registrar contato</h2>
      {message && (
        <p role="alert" className="rounded-md bg-red-50 p-3 text-red-800">
          {message}
        </p>
      )}
      <FormField label="Data do contato (vazio = hoje)" error={fieldErrors.contactedAt}>
        <input
          type="date"
          className="field-input"
          value={contactedAt}
          onChange={(e) => setContactedAt(e.target.value)}
        />
      </FormField>
      <FormField label="Descrição" error={fieldErrors.description}>
        <textarea
          className="field-input"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </FormField>
      <Button type="submit" disabled={submitting}>
        {submitting ? 'Salvando...' : 'Registrar contato'}
      </Button>
    </form>
  );
}
