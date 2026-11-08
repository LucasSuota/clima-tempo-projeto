import type { ReactNode } from 'react';
import type { Route } from '../router';

const NAV_ITEMS = [
  { label: 'Orçamentos', href: '#/orcamentos', routes: ['quotes', 'quote'] },
  { label: 'Clientes', href: '#/clientes', routes: ['clients'] },
  { label: 'Responsáveis', href: '#/responsaveis', routes: ['owners'] },
];

interface LayoutProps {
  route: Route;
  children: ReactNode;
}

export function Layout({ route, children }: LayoutProps) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto w-full max-w-5xl px-4 py-3 sm:px-6">
          <span className="text-lg font-semibold text-sky-700">ClimaFácil</span>
          <nav aria-label="Principal" className="-mx-2 mt-1 flex flex-wrap gap-1">
            {NAV_ITEMS.map((item) => {
              const current = item.routes.includes(route.name);
              return (
                <a
                  key={item.href}
                  href={item.href}
                  aria-current={current ? 'page' : undefined}
                  className={`flex min-h-11 items-center rounded-md px-3 text-base font-medium ${
                    current ? 'bg-sky-50 text-sky-800' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {item.label}
                </a>
              );
            })}
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 md:py-10">{children}</main>
    </div>
  );
}
