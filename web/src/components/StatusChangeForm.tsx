import type { FormEvent } from 'react';
import { changeQuoteStatus } from '../api/quotes';
import { QUOTE_STATUSES, type Quote, type QuoteStatus } from '../api/types';
import { QUOTE_STATUS_LABELS } from '../format';
import { DRAFT_KEYS, isStringRecord } from '../draft-storage';
import { usePersistedState } from '../hooks/usePersistedState';
import { useSubmit } from '../hooks/useSubmit';
import { Button } from './Button';
import { FormField } from './FormField';

const KNOWN_FIELDS = ['status', 'sentAt'] as const;
const EMPTY_VALUES: StatusChangeFormValues = { status: '', sentAt: '' };

interface StatusChangeFormValues {
  status: QuoteStatus | '';
  sentAt: string;
}

function isQuoteStatus(value: string): value is QuoteStatus {
  return (QUOTE_STATUSES as readonly string[]).includes(value);
}

function parseValues(value: unknown): StatusChangeFormValues | null {
  if (!isStringRecord(value, KNOWN_FIELDS)) return null;
  const { status, sentAt } = value;
  if (status === '') return { status: '', sentAt };
  return isQuoteStatus(status) ? { status, sentAt } : null;
}

interface StatusChangeFormProps {
  quote: Quote;
  onChanged: () => void;
}

export function StatusChangeForm({ quote, onChanged }: StatusChangeFormProps) {
  const [values, setValues, discard] = usePersistedState<StatusChangeFormValues>(
    DRAFT_KEYS.statusChangeForm(quote.id),
    EMPTY_VALUES,
    parseValues,
  );
  const { sentAt } = values;
  // A restored status may have become the current one (changed elsewhere meanwhile): not offered.
  const status = values.status === quote.status ? '' : values.status;
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
    discard();
    onChanged();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-5 rounded-[8px] border border-[#DDE5EC] bg-white p-6"
    >
      <h2 className="text-[20px] leading-7 font-semibold text-[#0F1F2B]">Mudar status</h2>
      {message && (
        <p
          role="alert"
          className="rounded-[6px] border border-[#A12A2A] bg-[#FDECEC] p-3 text-sm font-medium text-[#A12A2A]"
        >
          {message}
        </p>
      )}
      <FormField label="Novo status" required error={fieldErrors.status}>
        {(field) => (
          <select
            {...field}
            className="cf-field"
            value={status}
            onChange={(e) => setValues({ ...values, status: e.target.value as QuoteStatus | '' })}
          >
            <option value="">Selecione…</option>
            {QUOTE_STATUSES.filter((option) => option !== quote.status).map((option) => (
              <option key={option} value={option}>
                {QUOTE_STATUS_LABELS[option]}
              </option>
            ))}
          </select>
        )}
      </FormField>
      {status === 'sent' && (
        <FormField label="Data de envio" error={fieldErrors.sentAt}>
          {(field) => (
            <input
              {...field}
              type="date"
              className="cf-field"
              value={sentAt}
              onChange={(e) => setValues({ ...values, sentAt: e.target.value })}
            />
          )}
        </FormField>
      )}
      <div className="flex">
        <Button type="submit" disabled={status === '' || submitting}>
          {submitting ? 'Salvando...' : 'Mudar status'}
        </Button>
      </div>
    </form>
  );
}
