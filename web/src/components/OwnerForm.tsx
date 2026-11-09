import type { FormEvent } from 'react';
import { createOwner } from '../api/owners';
import { DRAFT_KEYS, isStringRecord } from '../draft-storage';
import { usePersistedState } from '../hooks/usePersistedState';
import { useSubmit } from '../hooks/useSubmit';
import { Button } from './Button';
import { FormField } from './FormField';

const KNOWN_FIELDS = ['name', 'role'] as const;
const EMPTY_VALUES = { name: '', role: '' };

interface OwnerFormValues {
  name: string;
  role: string;
}

function parseValues(value: unknown): OwnerFormValues | null {
  return isStringRecord(value, KNOWN_FIELDS) ? value : null;
}

interface OwnerFormProps {
  onSaved: () => void;
  onCancel: () => void;
  inSlideOver?: boolean;
}

export function OwnerForm({ onSaved, onCancel, inSlideOver = false }: OwnerFormProps) {
  const [values, setValues, discard] = usePersistedState<OwnerFormValues>(
    DRAFT_KEYS.ownerForm(),
    EMPTY_VALUES,
    parseValues,
  );
  const { name, role } = values;
  const { submitting, fieldErrors, message, run } = useSubmit(KNOWN_FIELDS);

  const canSubmit = name.trim() !== '' && role.trim() !== '' && !submitting;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const saved = await run(() => createOwner({ name: name.trim(), role: role.trim() }));
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
      onSubmit={handleSubmit}
      className={
        inSlideOver
          ? 'flex flex-1 flex-col justify-between'
          : 'mb-6 flex flex-col gap-5 rounded-[8px] border border-[#DDE5EC] bg-white p-6'
      }
    >
      <div className={inSlideOver ? 'flex flex-col gap-5 p-6' : 'flex flex-col gap-5'}>
        {!inSlideOver && (
          <h2 className="text-[20px] leading-7 font-semibold text-[#0F1F2B]">Novo responsável</h2>
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
              placeholder="Ex.: Marina Costa"
              value={name}
              onChange={(e) => setValues({ ...values, name: e.target.value })}
            />
          )}
        </FormField>
        <FormField label="Cargo/função" required error={fieldErrors.role}>
          {(field) => (
            <input
              {...field}
              className="cf-field"
              placeholder="Ex.: Técnico responsável"
              value={role}
              onChange={(e) => setValues({ ...values, role: e.target.value })}
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
