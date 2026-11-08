import { useState, type FormEvent } from 'react';
import { listClients } from '../api/clients';
import { listOwners } from '../api/owners';
import { createQuote, updateQuote } from '../api/quotes';
import type { Quote } from '../api/types';
import { useAsync } from '../hooks/useAsync';
import { useSubmit } from '../hooks/useSubmit';
import { parseMoneyInput } from '../forms';
import { QUOTE_STATUS_LABELS } from '../format';
import { Button } from './Button';
import { ErrorMessage } from './ErrorMessage';
import { FormField } from './FormField';
import { Spinner } from './Spinner';

const KNOWN_FIELDS = ['clientId', 'ownerId', 'description', 'total', 'status', 'sentAt'];
const INITIAL_STATUSES = ['draft', 'sent'] as const;

type InitialStatus = (typeof INITIAL_STATUSES)[number];

interface QuoteFormProps {
  /** When present the form edits this quote; the caller remounts it (key) to switch quotes. */
  quote?: Quote;
  onSaved: (quote: Quote) => void;
  onCancel: () => void;
}

export function QuoteForm({ quote, onSaved, onCancel }: QuoteFormProps) {
  const clients = useAsync(listClients);
  const owners = useAsync(listOwners);
  const [clientId, setClientId] = useState(quote ? String(quote.client.id) : '');
  const [ownerId, setOwnerId] = useState(quote ? String(quote.owner.id) : '');
  const [description, setDescription] = useState(quote?.description ?? '');
  const [totalText, setTotalText] = useState(quote ? String(quote.total).replace('.', ',') : '');
  const [status, setStatus] = useState<InitialStatus>('draft');
  const [sentAt, setSentAt] = useState('');
  const { submitting, fieldErrors, message, run } = useSubmit(KNOWN_FIELDS);

  const total = parseMoneyInput(totalText);
  const totalFormatError =
    totalText.trim() !== '' && total === null
      ? 'Valor inválido. Use vírgula nos centavos, ex.: 1.500,00'
      : undefined;
  const canSubmit =
    clientId !== '' && ownerId !== '' && description.trim() !== '' && total !== null && !submitting;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (total === null) return;
    let saved: Quote | null = null;
    await run(async () => {
      const common = {
        clientId: Number(clientId),
        ownerId: Number(ownerId),
        description: description.trim(),
        total,
      };
      // Status and send date are not editable: they change only through the status form.
      saved = quote
        ? await updateQuote(quote.id, common)
        : await createQuote({
            ...common,
            status,
            // The server refuses `sentAt` on a draft, so it only goes with `sent`.
            ...(status === 'sent' && sentAt !== '' && { sentAt }),
          });
    });
    if (saved) onSaved(saved);
  }

  if (clients.error) return <ErrorMessage error={clients.error} onRetry={clients.reload} />;
  if (owners.error) return <ErrorMessage error={owners.error} onRetry={owners.reload} />;
  if (!clients.data || !owners.data) return <Spinner />;

  const missing = [
    owners.data.items.length === 0 && { text: 'Cadastre um responsável', href: '#/responsaveis' },
    clients.data.items.length === 0 && { text: 'Cadastre um cliente', href: '#/clientes' },
  ].filter((item) => item !== false);

  return (
    <form onSubmit={handleSubmit} className="mb-6 space-y-4 rounded-md bg-white p-4 shadow-sm">
      <h2 className="text-lg font-semibold">{quote ? 'Editar orçamento' : 'Novo orçamento'}</h2>
      {missing.length > 0 && (
        <p role="alert" className="rounded-md bg-amber-50 p-3 text-amber-900">
          Para criar um orçamento é preciso ter responsável e cliente.{' '}
          {missing.map((item) => (
            <a key={item.href} href={item.href} className="mr-2 underline">
              {item.text}
            </a>
          ))}
        </p>
      )}
      {message && (
        <p role="alert" className="rounded-md bg-red-50 p-3 text-red-800">
          {message}
        </p>
      )}
      <FormField label="Cliente" required error={fieldErrors.clientId}>
        <select
          className="field-input"
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
        >
          <option value="">Selecione…</option>
          {clients.data.items.map((client) => (
            <option key={client.id} value={client.id}>
              {client.name}
            </option>
          ))}
        </select>
      </FormField>
      <FormField label="Responsável" required error={fieldErrors.ownerId}>
        <select
          className="field-input"
          value={ownerId}
          onChange={(e) => setOwnerId(e.target.value)}
        >
          <option value="">Selecione…</option>
          {owners.data.items.map((owner) => (
            <option key={owner.id} value={owner.id}>
              {owner.name} ({owner.role})
            </option>
          ))}
        </select>
      </FormField>
      <FormField label="Descrição" required error={fieldErrors.description}>
        <textarea
          className="field-input"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </FormField>
      <FormField label="Valor (R$)" required error={fieldErrors.total ?? totalFormatError}>
        <input
          inputMode="decimal"
          placeholder="1.500,00"
          className="field-input"
          value={totalText}
          onChange={(e) => setTotalText(e.target.value)}
        />
      </FormField>
      {!quote && (
        <>
          <FormField label="Status" error={fieldErrors.status}>
            <select
              className="field-input"
              value={status}
              onChange={(e) => setStatus(e.target.value as InitialStatus)}
            >
              {INITIAL_STATUSES.map((option) => (
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
        </>
      )}
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
