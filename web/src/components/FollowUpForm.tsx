import type { FormEvent } from 'react';
import { createFollowUp } from '../api/follow-ups';
import { DRAFT_KEYS, isStringRecord } from '../draft-storage';
import { usePersistedState } from '../hooks/usePersistedState';
import { useSubmit } from '../hooks/useSubmit';
import { Button } from './Button';
import { FormField } from './FormField';

const KNOWN_FIELDS = ['contactedAt', 'description'] as const;
const EMPTY_VALUES = { contactedAt: '', description: '' };

interface FollowUpFormValues {
  contactedAt: string;
  description: string;
}

function parseValues(value: unknown): FollowUpFormValues | null {
  return isStringRecord(value, KNOWN_FIELDS) ? value : null;
}

interface FollowUpFormProps {
  quoteId: number;
  onSaved: () => void;
  onCancel?: () => void;
  inSlideOver?: boolean;
}

export function FollowUpForm({
  quoteId,
  onSaved,
  onCancel,
  inSlideOver = false,
}: FollowUpFormProps) {
  const [values, setValues, discard] = usePersistedState<FollowUpFormValues>(
    DRAFT_KEYS.followUpForm(quoteId),
    EMPTY_VALUES,
    parseValues,
  );
  const { contactedAt, description } = values;
  const { submitting, fieldErrors, message, run } = useSubmit(KNOWN_FIELDS);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const saved = await run(() =>
      createFollowUp(quoteId, {
        ...(contactedAt !== '' && { contactedAt }),
        ...(description.trim() !== '' && { description: description.trim() }),
      }),
    );
    if (!saved) return;
    discard();
    onSaved();
  }

  function handleCancel() {
    discard();
    onCancel?.();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={
        inSlideOver
          ? 'flex flex-1 flex-col justify-between'
          : 'flex flex-col gap-5 rounded-[8px] border border-[#DDE5EC] bg-white p-6'
      }
    >
      <div className={inSlideOver ? 'flex flex-col gap-5 p-6' : 'flex flex-col gap-5'}>
        {!inSlideOver && (
          <h2 className="text-[20px] leading-7 font-semibold text-[#0F1F2B]">Registrar contato</h2>
        )}
        {message && (
          <p
            role="alert"
            className="rounded-[6px] border border-[#A12A2A] bg-[#FDECEC] p-3 text-sm font-medium text-[#A12A2A]"
          >
            {message}
          </p>
        )}
        <FormField label="Data do contato (vazio = hoje)" error={fieldErrors.contactedAt}>
          {(field) => (
            <input
              {...field}
              type="date"
              className="cf-field"
              value={contactedAt}
              onChange={(e) => setValues({ ...values, contactedAt: e.target.value })}
            />
          )}
        </FormField>
        <FormField label="Descrição do contato" error={fieldErrors.description}>
          {(field) => (
            <textarea
              {...field}
              className="cf-field !h-auto py-2.5"
              rows={3}
              placeholder="Ex.: Liguei e combinamos de rever os valores na quinta-feira"
              value={description}
              onChange={(e) => setValues({ ...values, description: e.target.value })}
            />
          )}
        </FormField>
      </div>

      <div
        className={
          inSlideOver
            ? 'flex justify-end gap-3 border-t border-[#DDE5EC] bg-[#F4F7FA] px-6 py-4'
            : 'flex flex-wrap gap-3'
        }
      >
        {onCancel && (
          <Button variant="secondary" onClick={handleCancel}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Salvando...' : 'Registrar contato'}
        </Button>
      </div>
    </form>
  );
}
