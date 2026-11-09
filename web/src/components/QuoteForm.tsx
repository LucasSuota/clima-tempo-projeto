import type { FormEvent } from 'react';
import { listClients } from '../api/clients';
import { listOwners } from '../api/owners';
import { createQuote, updateQuote } from '../api/quotes';
import type { Quote } from '../api/types';
import { DRAFT_KEYS, isStringRecord } from '../draft-storage';
import { useAsync } from '../hooks/useAsync';
import { usePersistedState } from '../hooks/usePersistedState';
import { useSubmit } from '../hooks/useSubmit';
import { parseMoneyInput } from '../forms';
import { QUOTE_STATUS_LABELS } from '../format';
import { Button } from './Button';
import { ErrorMessage } from './ErrorMessage';
import { FormField } from './FormField';
import { Spinner } from './Spinner';

const KNOWN_FIELDS = ['clientId', 'ownerId', 'description', 'total', 'status', 'sentAt'];
const VALUE_KEYS = ['clientId', 'ownerId', 'description', 'totalText', 'status', 'sentAt'] as const;
const INITIAL_STATUSES = ['draft', 'sent'] as const;

type InitialStatus = (typeof INITIAL_STATUSES)[number];

interface QuoteFormValues {
  clientId: string;
  ownerId: string;
  description: string;
  totalText: string;
  status: InitialStatus;
  sentAt: string;
}

function isInitialStatus(value: string): value is InitialStatus {
  return (INITIAL_STATUSES as readonly string[]).includes(value);
}

function parseValues(value: unknown): QuoteFormValues | null {
  if (!isStringRecord(value, VALUE_KEYS)) return null;
  const { clientId, ownerId, description, totalText, status, sentAt } = value;
  // Same key order as the initial values: saveDraft compares both as JSON.
  return isInitialStatus(status)
    ? { clientId, ownerId, description, totalText, status, sentAt }
    : null;
}

interface QuoteFormProps {
  /** When present the form edits this quote; the caller remounts it (key) to switch quotes. */
  quote?: Quote;
  onSaved: (quote: Quote) => void;
  onCancel: () => void;
  inSlideOver?: boolean;
}

/** The id as typed in the form, or '' when the list is loaded and no longer has it. */
function existingId(id: string, items: readonly { id: number }[] | undefined): string {
  if (id === '' || items === undefined) return id;
  return items.some((item) => String(item.id) === id) ? id : '';
}

export function QuoteForm({ quote, onSaved, onCancel, inSlideOver = false }: QuoteFormProps) {
  const clients = useAsync(listClients);
  const owners = useAsync(listOwners);
  const [values, setValues, discard] = usePersistedState<QuoteFormValues>(
    DRAFT_KEYS.quoteForm(quote?.id),
    {
      clientId: quote ? String(quote.client.id) : '',
      ownerId: quote ? String(quote.owner.id) : '',
      description: quote?.description ?? '',
      totalText: quote ? String(quote.total).replace('.', ',') : '',
      status: 'draft',
      sentAt: '',
    },
    parseValues,
  );
  const { description, totalText, status, sentAt } = values;
  // A restored client or owner may have been deleted meanwhile. Until the lists load, nothing is
  // dropped, so the form is not blocked.
  const clientId = existingId(values.clientId, clients.data?.items);
  const ownerId = existingId(values.ownerId, owners.data?.items);
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
      saved = quote
        ? await updateQuote(quote.id, common)
        : await createQuote({
            ...common,
            status,
            ...(status === 'sent' && sentAt !== '' && { sentAt }),
          });
    });
    if (!saved) return;
    discard();
    onSaved(saved);
  }

  function handleCancel() {
    discard();
    onCancel();
  }

  if (clients.error) return <ErrorMessage error={clients.error} onRetry={clients.reload} />;
  if (owners.error) return <ErrorMessage error={owners.error} onRetry={owners.reload} />;
  if (!clients.data || !owners.data) return <Spinner />;

  const clientItems = clients.data.items;
  const ownerItems = owners.data.items;
  const missing = [
    owners.data.items.length === 0 && { text: 'Cadastre um responsável', href: '#/responsaveis' },
    clients.data.items.length === 0 && { text: 'Cadastre um cliente', href: '#/clientes' },
  ].filter((item) => item !== false);

  return (
    <form
      onSubmit={handleSubmit}
      className={
        inSlideOver
          ? 'flex flex-1 flex-col justify-between'
          : 'mb-6 flex flex-col gap-5 rounded-[8px] border border-[#DDE5EC] bg-white p-6'
      }
    >
      <div className={inSlideOver ? 'flex flex-col gap-5 p-6' : 'flex flex-col gap-5'}>
        {!inSlideOver && (
          <h2 className="text-[20px] leading-7 font-semibold text-[#0F1F2B]">
            {quote ? 'Editar orçamento' : 'Novo orçamento'}
          </h2>
        )}
        {missing.length > 0 && (
          <p
            role="alert"
            className="rounded-[6px] border border-[#C3CFD9] bg-[#FFF0E0] p-3 text-sm text-[#A34A06]"
          >
            Para criar um orçamento é preciso ter responsável e cliente.{' '}
            {missing.map((item) => (
              <a key={item.href} href={item.href} className="mr-2 font-semibold underline">
                {item.text}
              </a>
            ))}
          </p>
        )}
        {message && (
          <p
            role="alert"
            className="rounded-[6px] border border-[#A12A2A] bg-[#FDECEC] p-3 text-sm font-medium text-[#A12A2A]"
          >
            {message}
          </p>
        )}
        <FormField label="Cliente" required error={fieldErrors.clientId}>
          {(field) => (
            <select
              {...field}
              className="cf-field"
              value={clientId}
              onChange={(e) => setValues({ ...values, clientId: e.target.value })}
            >
              <option value="">Selecione…</option>
              {clientItems.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          )}
        </FormField>
        <FormField label="Responsável" required error={fieldErrors.ownerId}>
          {(field) => (
            <select
              {...field}
              className="cf-field"
              value={ownerId}
              onChange={(e) => setValues({ ...values, ownerId: e.target.value })}
            >
              <option value="">Selecione…</option>
              {ownerItems.map((owner) => (
                <option key={owner.id} value={owner.id}>
                  {owner.name} ({owner.role})
                </option>
              ))}
            </select>
          )}
        </FormField>
        <FormField label="Descrição" required error={fieldErrors.description}>
          {(field) => (
            <textarea
              {...field}
              className="cf-field !h-auto py-2.5"
              rows={3}
              placeholder="Ex.: Troca de compressor e recarga de gás"
              value={description}
              onChange={(e) => setValues({ ...values, description: e.target.value })}
            />
          )}
        </FormField>
        <FormField label="Valor (R$)" required error={fieldErrors.total ?? totalFormatError}>
          {(field) => (
            <input
              {...field}
              inputMode="decimal"
              placeholder="1.500,00"
              className="cf-field tabular-nums"
              value={totalText}
              onChange={(e) => setValues({ ...values, totalText: e.target.value })}
            />
          )}
        </FormField>
        {!quote && (
          <>
            <FormField label="Status inicial" error={fieldErrors.status}>
              {(field) => (
                <select
                  {...field}
                  className="cf-field"
                  value={status}
                  onChange={(e) =>
                    setValues({ ...values, status: e.target.value as InitialStatus })
                  }
                >
                  {INITIAL_STATUSES.map((option) => (
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
          </>
        )}
        <p className="text-[13px] leading-[18px] text-[#52646F]">
          <span className="text-[#A12A2A]">*</span> Campos obrigatórios
        </p>
      </div>

      <div
        className={
          inSlideOver
            ? 'flex justify-end gap-3 border-t border-[#DDE5EC] bg-[#F4F7FA] px-6 py-4'
            : 'flex flex-wrap gap-3'
        }
      >
        <Button variant="secondary" onClick={handleCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={!canSubmit}>
          {submitting ? 'Salvando...' : 'Salvar'}
        </Button>
      </div>
    </form>
  );
}
