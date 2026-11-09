import type { ButtonHTMLAttributes } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'bg-[#1B5FA6] text-white border border-[#1B5FA6] hover:bg-[#144C88] hover:border-[#144C88] disabled:bg-[#E3E9EE] disabled:text-[#52646F] disabled:border-[#E3E9EE]',
  secondary:
    'bg-white text-[#0F1F2B] border border-[#C3CFD9] hover:bg-[#F4F7FA] hover:border-[#8FA3B2] disabled:bg-[#F4F7FA] disabled:text-[#5F707B] disabled:border-[#DDE5EC]',
  danger:
    'bg-[#B42318] text-white border border-[#B42318] hover:bg-[#912016] hover:border-[#912016] disabled:bg-[#E3E9EE] disabled:text-[#52646F] disabled:border-[#E3E9EE]',
  ghost:
    'bg-transparent text-[#144C88] border border-transparent hover:bg-[#EAF2FA] disabled:text-[#5F707B]',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export function Button({
  variant = 'primary',
  className = '',
  type = 'button',
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={`inline-flex h-11 items-center justify-center rounded-[6px] px-5 text-[15px] font-semibold whitespace-nowrap transition-colors disabled:cursor-not-allowed ${VARIANT_CLASSES[variant]} ${className}`}
      {...rest}
    />
  );
}
