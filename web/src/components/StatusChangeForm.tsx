import { useState, type FormEvent } from 'react';
import { changeQuoteStatus } from '../api/quotes';
import { QUOTE_STATUSES, type Quote, type QuoteStatus } from '../api/types';
import { QUOTE_STATUS_LABELS } from '../format';
import { useSubmit } from '../hooks/useSubmit';
import { Button } from './Button';
import { FormField } from './FormField';

const KNOWN_FIELDS = ['status', 'sentAt'];

interface StatusChangeFormProps {
  quote: Quote;
  onChanged: () => void;
}

// Offers every status but the current one and lets the server refuse invalid transitions (§7).
export function StatusChangeForm({ quote, onChanged }: StatusChangeFormProps) {
  const [status, setStatus] = useState<QuoteStatus | ''>('');
  const [sentAt, setSentAt] = useState('');
  const { submitting, fieldErrors, message, run } = useSubmit(KNOWN_FIELDS);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (status === '') return;
    const saved = await run(() =>
      changeQuoteStatus(quote.id, {
        status,
        ...(status === 'sent' && sentAt !== '' && { sentAt }),
      }),
    );
    if (!saved) return;
    setStatus('');
    setSentAt('');
    onChanged();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-md bg-white p-4 shadow-sm">
      <h2 className="text-lg font-semibold">Mudar status</h2>
      {message && (
        <p role="alert" className="rounded-md bg-red-50 p-3 text-red-800">
          {message}
        </p>
      )}
      <FormField label="Novo status" required error={fieldErrors.status}>
        <select
          className="field-input"
          value={status}
          onChange={(e) => setStatus(e.target.value as QuoteStatus | '')}
        >
          <option value="">Selecione…</option>
          {QUOTE_STATUSES.filter((option) => option !== quote.status).map((option) => (
            <option key={option} value={option}>
              {QUOTE_STATUS_LABELS[option]}
            </option>
          ))}
        </select>
      </FormField>
      {status === 'sent' && (
        <FormField label="Data de envio" error={fieldErrors.sentAt}>
          <input
            type="date"
            className="field-input"
            value={sentAt}
            onChange={(e) => setSentAt(e.target.value)}
          />
        </FormField>
      )}
      <Button type="submit" disabled={status === '' || submitting}>
        {submitting ? 'Salvando...' : 'Mudar status'}
      </Button>
    </form>
  );
}
