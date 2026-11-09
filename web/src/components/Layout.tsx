import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { Route } from '../router';
import { GlobalSearchModal } from './GlobalSearchModal';
import { BrandMark, IconButton, MenuIcon, SearchIcon } from './IconButton';
import { Sidebar } from './Sidebar';

const DESKTOP_QUERY = '(min-width: 1024px)';

interface LayoutProps {
  route: Route;
  children: ReactNode;
}

export function Layout({ route, children }: LayoutProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const wasMenuOpenRef = useRef(false);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setMenuOpen(false);
        setSearchOpen((prev) => !prev);
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;

    function closeMenu() {
      setMenuOpen(false);
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') closeMenu();
    }

    const desktopQuery = window.matchMedia(DESKTOP_QUERY);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('hashchange', closeMenu);
    desktopQuery.addEventListener('change', closeMenu);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('hashchange', closeMenu);
      desktopQuery.removeEventListener('change', closeMenu);
      document.body.style.overflow = originalOverflow;
    };
  }, [menuOpen]);

  // Gives focus back to the hamburger when the drawer closes, unless the search modal took
  // over (it focuses its own input).
  useEffect(() => {
    if (wasMenuOpenRef.current && !menuOpen && !searchOpen) menuButtonRef.current?.focus();
    wasMenuOpenRef.current = menuOpen;
  }, [menuOpen, searchOpen]);

  function openSearchFromMenu() {
    setMenuOpen(false);
    setSearchOpen(true);
  }

  return (
    <div className="min-h-screen bg-[#F4F7FA]">
      <Sidebar
        route={route}
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        onOpenSearch={openSearchFromMenu}
      />

      <header
        inert={menuOpen}
        className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-[#DDE5EC] bg-white px-2 lg:hidden"
      >
        <IconButton
          ref={menuButtonRef}
          aria-label="Abrir menu"
          aria-expanded={menuOpen}
          aria-controls="app-sidebar"
          onClick={() => setMenuOpen(true)}
        >
          <MenuIcon />
        </IconButton>
        <span className="flex flex-1 items-center gap-2.5 text-[17px] leading-6 font-bold tracking-tight text-[#0F1F2B]">
          <BrandMark />
          <span>
            Clima<span className="text-[#1B5FA6]">Fácil</span>
          </span>
        </span>
        <IconButton aria-label="Buscar em tudo" onClick={() => setSearchOpen(true)}>
          <SearchIcon />
        </IconButton>
      </header>

      {/* Reserves only the compressed sidebar (w-16): the expanded one overlays the content so it
          never shifts. Touch-only screens keep the sidebar expanded (w-60), so they reserve all of it. */}
      <main inert={menuOpen} className="lg:pl-16 lg:no-hover:pl-60">
        <div className="mx-auto w-full max-w-[1200px] px-4 py-8 sm:px-6">{children}</div>
      </main>

      <GlobalSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
