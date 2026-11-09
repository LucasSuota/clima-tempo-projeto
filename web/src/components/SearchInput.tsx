import type { ChangeEvent } from 'react';
import { CloseIcon, SearchIcon } from './IconButton';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  'aria-label'?: string;
  className?: string;
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Buscar...',
  'aria-label': ariaLabel = 'Buscar',
  className = '',
}: SearchInputProps) {
  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    onChange(e.target.value);
  }

  function handleClear() {
    onChange('');
  }

  return (
    <div
      className={`cf-search flex h-11 items-center gap-2.5 rounded-[6px] border border-[#C3CFD9] bg-white pr-1.5 pl-3.5 text-[#52646F] transition-all ${className}`}
    >
      <SearchIcon size={18} />
      <input
        type="search"
        value={value}
        onChange={handleChange}
        aria-label={ariaLabel}
        placeholder={placeholder}
        className="h-10 min-w-0 flex-1 border-0 bg-transparent text-[15px] text-[#0F1F2B] outline-none placeholder:text-[#5F707B]"
      />
      {value && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Limpar busca"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[6px] border-0 bg-transparent text-[#52646F] transition-colors hover:bg-[#EAF2FA] hover:text-[#144C88]"
        >
          <CloseIcon />
        </button>
      )}
    </div>
  );
}
