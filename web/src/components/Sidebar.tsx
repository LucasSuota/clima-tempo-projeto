import { useEffect, useRef } from 'react';
import type { Route } from '../router';
import {
  BrandMark,
  ClientsIcon,
  CloseIcon,
  DashboardIcon,
  OwnersIcon,
  QuotesIcon,
  SearchIcon,
} from './IconButton';

const NAV_ITEMS = [
  { label: 'Painel', href: '#/', routes: ['dashboard'], Icon: DashboardIcon },
  { label: 'Orçamentos', href: '#/orcamentos', routes: ['quotes', 'quote'], Icon: QuotesIcon },
  { label: 'Clientes', href: '#/clientes', routes: ['clients'], Icon: ClientsIcon },
  { label: 'Responsáveis', href: '#/responsaveis', routes: ['owners'], Icon: OwnersIcon },
];

// Labels fade in by the sidebar's own width (container query) instead of per-state classes: the
// drawer (w-72) and the expanded desktop menu (w-60) both pass the threshold, the compressed
// rail (w-16) does not. The text stays in the DOM, so it is still the accessible name.
const REVEALED_WHEN_WIDE =
  'opacity-0 transition-opacity duration-150 motion-reduce:transition-none @min-[8rem]/sidebar:opacity-100';

// Every row shares this geometry (px-3 on the list + px-2 on the row + a size-6 icon slot), so
// the icons sit on the 32px axis of the w-16 rail and keep their x position when it expands.
const ROW =
  'flex h-10 w-full items-center gap-3 rounded-[8px] px-2 text-[15px] whitespace-nowrap transition-colors duration-150 motion-reduce:transition-none';
const ICON_SLOT = 'grid size-6 shrink-0 place-items-center';
const LABEL = `min-w-0 overflow-hidden ${REVEALED_WHEN_WIDE}`;

interface SidebarProps {
  route: Route;
  open: boolean;
  onClose: () => void;
  onOpenSearch: () => void;
}

export function Sidebar({ route, open, onClose, onOpenSearch }: SidebarProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) closeButtonRef.current?.focus();
  }, [open]);

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-[#0F1F2B]/45 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Below lg it is a drawer; `invisible` keeps its links out of the Tab order while closed.
          From lg it is a w-16 rail that grows to w-60 over the content (the page only reserves
          the rail width) on hover or keyboard focus. Tailwind's `hover:` already requires a
          hover-capable pointer; on touch-only screens the menu stays expanded instead, since
          focus would leave it stuck open after a tap. `focus-visible` (not `focus-within`)
          avoids that same stuck state after a mouse click on a link. The expanded shadow is a
          crisp 1px edge plus a short falloff, not a wide blur over the content. */}
      <div
        id="app-sidebar"
        className={`peer @container/sidebar fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col overflow-hidden border-r border-[#DDE5EC] bg-white py-4 transition-[transform,visibility,width,box-shadow] duration-200 ease-out motion-reduce:transition-none lg:z-30 lg:w-16 lg:max-w-none lg:translate-x-0 lg:shadow-none lg:hover:w-60 lg:hover:shadow-[1px_0_0_#DDE5EC,16px_0_32px_-20px_rgba(15,31,43,0.45)] lg:has-[:focus-visible]:w-60 lg:has-[:focus-visible]:shadow-[1px_0_0_#DDE5EC,16px_0_32px_-20px_rgba(15,31,43,0.45)] lg:no-hover:w-60 lg:no-hover:shadow-none ${
          open
            ? 'translate-x-0 shadow-[1px_0_0_#DDE5EC,16px_0_32px_-20px_rgba(15,31,43,0.45)]'
            : '-translate-x-full max-lg:invisible'
        }`}
      >
        <div className="flex h-10 items-center gap-3 px-3.5">
          <BrandMark />
          <span
            className={`text-[17px] leading-6 font-bold tracking-tight text-[#0F1F2B] ${LABEL}`}
          >
            Clima<span className="text-[#1B5FA6]">Fácil</span>
          </span>
        </div>

        <div className="mx-3 mt-4 mb-3 border-t border-[#E7EDF2]" />

        <nav aria-label="Navegação principal" className="flex flex-col gap-1 px-3">
          {NAV_ITEMS.map((item) => {
            const current = item.routes.includes(route.name);
            return (
              <a
                key={item.href}
                href={item.href}
                aria-current={current ? 'page' : undefined}
                onClick={onClose}
                className={`${ROW} ${
                  current
                    ? 'bg-[#EAF2FA] font-semibold text-[#144C88]'
                    : 'font-medium text-[#52646F] hover:bg-[#F4F7FA] hover:text-[#0F1F2B]'
                }`}
              >
                <span className={`${ICON_SLOT} ${current ? 'text-[#1B5FA6]' : ''}`}>
                  <item.Icon />
                </span>
                <span className={LABEL}>{item.label}</span>
              </a>
            );
          })}
        </nav>

        <div className="mt-auto flex flex-col gap-1 px-3">
          <div className="mb-2 border-t border-[#E7EDF2]" />
          <button
            type="button"
            onClick={onOpenSearch}
            aria-keyshortcuts="Control+K Meta+K"
            className={`${ROW} font-medium text-[#52646F] hover:bg-[#F4F7FA] hover:text-[#0F1F2B]`}
          >
            <span className={ICON_SLOT}>
              <SearchIcon />
            </span>
            <span className={LABEL}>Buscar em tudo</span>
            <kbd
              aria-hidden="true"
              className={`ml-auto shrink-0 rounded-[4px] border border-[#DDE5EC] bg-[#F4F7FA] px-1.5 font-sans text-[11px] leading-5 font-semibold text-[#52646F] ${REVEALED_WHEN_WIDE}`}
            >
              ⌘K
            </kbd>
          </button>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className={`${ROW} font-medium text-[#52646F] hover:bg-[#F4F7FA] hover:text-[#0F1F2B] lg:hidden`}
          >
            <span className={ICON_SLOT}>
              <CloseIcon />
            </span>
            <span>Fechar menu</span>
          </button>
        </div>
      </div>

      {/* Desktop only: a light veil over the content while the rail is expanded over it, so the
          cut-off text behind the menu reads as background instead of competing with it. */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-20 hidden bg-[#0F1F2B]/10 opacity-0 transition-opacity duration-200 motion-reduce:transition-none lg:block lg:peer-hover:opacity-100 lg:peer-has-[:focus-visible]:opacity-100 lg:no-hover:hidden"
      />
    </>
  );
}
