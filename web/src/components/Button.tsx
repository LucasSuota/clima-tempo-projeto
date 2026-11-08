import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'danger';

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: 'bg-sky-700 text-white hover:bg-sky-800',
  danger: 'bg-red-700 text-white hover:bg-red-800',
  secondary: 'border border-slate-300 bg-white text-slate-800 hover:bg-slate-100',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export function Button({
  variant = 'primary',
  className = '',
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`min-h-11 w-full rounded-md px-4 py-2 text-base font-medium disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto ${VARIANT_CLASSES[variant]} ${className}`}
      {...rest}
    />
  );
}
