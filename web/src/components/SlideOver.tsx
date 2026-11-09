import { useEffect, useRef, type ReactNode } from 'react';
import { CloseIcon, IconButton } from './IconButton';

interface SlideOverProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  widthClass?: string;
}

export function SlideOver({
  isOpen,
  onClose,
  title,
  children,
  widthClass = 'w-full sm:max-w-[440px]',
}: SlideOverProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose]);

  // Separate from the effect above: `onClose` is often an inline arrow, and a new identity
  // must not re-run the focus logic while the panel is open.
  useEffect(() => {
    if (!isOpen) return;

    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    // The form may still be loading (spinner), so the panel itself is the fallback target.
    const firstField = panelRef.current?.querySelector<HTMLElement>('input, select, textarea');
    (firstField ?? panelRef.current)?.focus();

    return () => {
      if (opener?.isConnected) opener.focus();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#0F1F2B]/45 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over panel */}
      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div
          ref={panelRef}
          tabIndex={-1}
          style={{ boxShadow: '0 16px 48px rgba(15, 31, 43, 0.18)' }}
          className={`flex h-full flex-col bg-white outline-none ${widthClass}`}
        >
          {/* Header */}
          <div className="flex shrink-0 items-center justify-between border-b border-[#DDE5EC] py-4 pr-4 pl-6">
            <h2 className="text-[20px] leading-7 font-semibold text-[#0F1F2B]">{title}</h2>
            <IconButton aria-label="Fechar painel" onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto">{children}</div>
        </div>
      </div>
    </div>
  );
}
