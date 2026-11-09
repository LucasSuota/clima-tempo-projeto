import { useId, type ReactNode } from 'react';

interface FieldControlProps {
  id: string;
  'aria-invalid': boolean | undefined;
  'aria-describedby': string | undefined;
}

interface FormFieldProps {
  label: string;
  error?: string;
  required?: boolean;
  /** Receives the props that tie the control to its label and error message. */
  children: (controlProps: FieldControlProps) => ReactNode;
}

export function FormField({ label, error, required = false, children }: FormFieldProps) {
  const fieldId = useId();
  const errorId = error ? `${fieldId}-error` : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={fieldId} className="text-[13px] leading-[18px] font-semibold text-[#52646F]">
        {label}
        {required && <span className="text-[#A12A2A]"> *</span>}
      </label>
      {children({
        id: fieldId,
        'aria-invalid': error ? true : undefined,
        'aria-describedby': errorId,
      })}
      {error && (
        <span
          id={errorId}
          aria-live="polite"
          className="text-[13px] leading-[18px] font-semibold text-[#A12A2A]"
        >
          {error}
        </span>
      )}
    </div>
  );
}
