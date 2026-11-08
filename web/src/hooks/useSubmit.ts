import { useState } from 'react';
import { splitErrors, type SplitErrors } from '../forms';

const NO_ERRORS: SplitErrors = { fields: {}, message: null };

/** Shared submit cycle of the forms: pending state plus per-field and general errors. */
export function useSubmit(knownFields: readonly string[]) {
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<SplitErrors>(NO_ERRORS);

  // Resolves to whether the action succeeded, so the form knows if it can clear its fields.
  async function run(action: () => Promise<unknown>): Promise<boolean> {
    setSubmitting(true);
    setErrors(NO_ERRORS);
    try {
      await action();
      return true;
    } catch (error: unknown) {
      setErrors(splitErrors(error, knownFields));
      return false;
    } finally {
      setSubmitting(false);
    }
  }

  return { submitting, fieldErrors: errors.fields, message: errors.message, run };
}
