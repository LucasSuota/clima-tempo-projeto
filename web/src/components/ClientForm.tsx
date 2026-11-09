import type { FormEvent } from 'react';
import { createClient, updateClient } from '../api/clients';
import type { Client } from '../api/types';
import { DRAFT_KEYS, isStringRecord } from '../draft-storage';
import { usePersistedState } from '../hooks/usePersistedState';
import { useSubmit } from '../hooks/useSubmit';
import { Button } from './Button';
import { FormField } from './FormField';

const KNOWN_FIELDS = ['name', 'email', 'phone'] as const;

interface ClientFormValues {
  name: string;
  email: string;
  phone: string;
}

function parseValues(value: unknown): ClientFormValues | null {
  return isStringRecord(value, KNOWN_FIELDS) ? value : null;
}

interface ClientFormProps {
  /** When present the form edits this client; the caller remounts it (key) to switch clients. */
  client?: Client;
  onSaved: () => void;
  onCancel: () => void;
  inSlideOver?: boolean;
}

export function ClientForm({ client, onSaved, onCancel, inSlideOver = false }: ClientFormProps) {
  const [values, setValues, discard] = usePersistedState<ClientFormValues>(
    DRAFT_KEYS.clientForm(client?.id),
    { name: client?.name ?? '', email: client?.email ?? '', phone: client?.phone ?? '' },
    parseValues,
  );
  const { name, email, phone } = values;
  const { submitting, fieldErrors, message, run } = useSubmit(KNOWN_FIELDS);

  const canSubmit = name.trim() !== '' && !submitting;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const input = {
      name: name.trim(),
      ...(email.trim() !== '' && { email: email.trim() }),
      ...(phone.trim() !== '' && { phone: phone.trim() }),
    };
    const saved = await run(() => (client ? updateClient(client.id, input) : createClient(input)));
    if (!saved) return;
    discard();
    onSaved();
  }

  function handleCancel() {
    discard();
    onCancel();
  }

  return (
    <form
      noValidate
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
            {client ? 'Editar cliente' : 'Novo cliente'}
          </h2>
        )}
        {message && (
          <p
            role="alert"
            className="rounded-[6px] border border-[#A12A2A] bg-[#FDECEC] p-3 text-sm font-medium text-[#A12A2A]"
          >
            {message}
          </p>
        )}
        <FormField label="Nome" required error={fieldErrors.name}>
          {(field) => (
            <input
              {...field}
              className="cf-field"
              placeholder="Ex.: Carla Mendes"
              value={name}
              onChange={(e) => setValues({ ...values, name: e.target.value })}
            />
          )}
        </FormField>
        <FormField label="E-mail" error={fieldErrors.email}>
          {(field) => (
            <input
              {...field}
              type="email"
              className="cf-field"
              placeholder="Ex.: carla@exemplo.com"
              value={email}
              onChange={(e) => setValues({ ...values, email: e.target.value })}
            />
          )}
        </FormField>
        <FormField label="Telefone" error={fieldErrors.phone}>
          {(field) => (
            <input
              {...field}
              type="tel"
              className="cf-field"
              placeholder="Ex.: (11) 98765-4321"
              value={phone}
              onChange={(e) => setValues({ ...values, phone: e.target.value })}
            />
          )}
        </FormField>
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
