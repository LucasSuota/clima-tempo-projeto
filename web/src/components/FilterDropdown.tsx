import { useEffect, useId, useRef, useState, type FocusEvent, type KeyboardEvent } from 'react';
import { CloseIcon } from './IconButton';

export interface FilterOption<T extends string = string> {
  id: T;
  label: string;
  count?: number;
}

interface FilterDropdownProps<T extends string = string> {
  // The first option is the "no filter" one: clearing goes back to it.
  options: FilterOption<T>[];
  selectedId: T;
  onSelect: (id: T) => void;
}

function wrapIndex(index: number, length: number): number {
  return (index + length) % length;
}

function optionText(option: FilterOption): string {
  return option.count === undefined ? option.label : `${option.label}, ${option.count}`;
}

export function FilterDropdown<T extends string = string>({
  options,
  selectedId,
  onSelect,
}: FilterDropdownProps<T>) {
  const [open, setOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const menuId = useId();

  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.id === selectedId),
  );
  const selected = options[selectedIndex];
  const defaultOption = options[0];
  const filterActive = selectedIndex !== 0;

  useEffect(() => {
    if (open) itemRefs.current[focusedIndex]?.focus();
  }, [open, focusedIndex]);

  // Clicks on non-focusable areas do not move focus, so blur alone would not close the menu.
  useEffect(() => {
    if (!open) return;
    function handlePointerDown(event: PointerEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [open]);

  if (!selected || !defaultOption) return null;

  function openMenu() {
    setFocusedIndex(selectedIndex);
    setOpen(true);
  }

  function closeMenu() {
    setOpen(false);
    triggerRef.current?.focus();
  }

  function handleSelect(id: T) {
    onSelect(id);
    closeMenu();
  }

  function handleTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      openMenu();
    }
  }

  function handleMenuKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const nextIndexByKey: Record<string, number> = {
      ArrowDown: wrapIndex(focusedIndex + 1, options.length),
      ArrowUp: wrapIndex(focusedIndex - 1, options.length),
      Home: 0,
      End: options.length - 1,
    };
    const nextIndex = nextIndexByKey[event.key];
    if (nextIndex !== undefined) {
      event.preventDefault();
      setFocusedIndex(nextIndex);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      closeMenu();
    } else if (event.key === 'Tab' && event.shiftKey) {
      // Shift+Tab lands on the trigger, which is inside the wrapper, so blur would keep it open.
      event.preventDefault();
      closeMenu();
    }
  }

  function handleClear(defaultId: T) {
    onSelect(defaultId);
    // The clear button unmounts once the filter is cleared; keep focus from falling to <body>.
    triggerRef.current?.focus();
  }

  // Tab (or any focus move) out of the trigger and menu closes it, letting focus go on its way.
  // A null target is ignored: Safari does not focus clicked buttons, so a click on an item would
  // blur with no target and close the menu before the click lands. Outside clicks are covered
  // by the pointerdown listener.
  function handleBlur(event: FocusEvent<HTMLDivElement>) {
    const target = event.relatedTarget;
    if (target && !wrapperRef.current?.contains(target)) setOpen(false);
  }

  const triggerTone = filterActive
    ? 'border-[#1B5FA6] bg-[#EAF2FA] text-[#1B5FA6]'
    : 'border-[#C3CFD9] bg-white text-[#0F1F2B] hover:border-[#8FA3B2]';
  const countTone = filterActive ? 'text-[#1B5FA6]' : 'text-[#52646F]';

  return (
    <div className="flex shrink-0 items-center">
      <div ref={wrapperRef} className="relative" onBlur={handleBlur}>
        <button
          ref={triggerRef}
          type="button"
          aria-haspopup="menu"
          aria-expanded={open}
          aria-controls={open ? menuId : undefined}
          aria-label={`Filtro: ${optionText(selected)}`}
          onClick={() => (open ? setOpen(false) : openMenu())}
          onKeyDown={handleTriggerKeyDown}
          className={`inline-flex h-11 items-center gap-2 border px-3 text-sm font-semibold whitespace-nowrap transition-colors ${triggerTone} ${
            filterActive ? 'rounded-l-[6px]' : 'rounded-[6px]'
          }`}
        >
          <FunnelIcon />
          <span className="hidden sm:inline">{selected.label}</span>
          {selected.count !== undefined && (
            <span className={`font-normal tabular-nums ${countTone}`}>
              <span aria-hidden="true" className="hidden sm:inline">
                ·{' '}
              </span>
              {selected.count}
            </span>
          )}
          <ChevronIcon open={open} />
        </button>

        {open && (
          <div
            id={menuId}
            role="menu"
            aria-label="Filtrar orçamentos"
            onKeyDown={handleMenuKeyDown}
            className="absolute top-full right-0 z-20 mt-1 w-56 max-w-[calc(100vw-2rem)] rounded-[8px] border border-[#DDE5EC] bg-white py-1 shadow-[0_8px_24px_-8px_rgba(15,31,43,0.25)]"
          >
            {options.map((option, index) => {
              const checked = option.id === selectedId;
              return (
                <button
                  key={option.id}
                  ref={(element) => {
                    itemRefs.current[index] = element;
                  }}
                  type="button"
                  role="menuitemradio"
                  aria-checked={checked}
                  tabIndex={-1}
                  onClick={() => handleSelect(option.id)}
                  className={`flex min-h-11 w-full items-center gap-2 px-3 text-left text-sm transition-colors hover:bg-[#F4F8FB] focus:bg-[#EAF2FA] ${
                    checked ? 'font-semibold text-[#1B5FA6]' : 'text-[#0F1F2B]'
                  }`}
                >
                  <span className="flex w-4 shrink-0 justify-center">
                    {checked && <CheckIcon />}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{option.label}</span>
                  {option.count !== undefined && (
                    <span className="font-normal text-[#52646F] tabular-nums">{option.count}</span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {filterActive && (
        <button
          type="button"
          aria-label="Limpar filtro"
          onClick={() => handleClear(defaultOption.id)}
          className="-ml-px inline-flex h-11 w-11 items-center justify-center rounded-r-[6px] border border-[#1B5FA6] bg-[#EAF2FA] text-[#1B5FA6] transition-colors hover:bg-[#D6E6F5]"
        >
          <CloseIcon />
        </button>
      )}
    </div>
  );
}

function FunnelIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="shrink-0"
    >
      <path d="M22 3H2l8 9.46V19l4 2v-8.54z" />
    </svg>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`shrink-0 transition-transform motion-reduce:transition-none ${open ? 'rotate-180' : ''}`}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
