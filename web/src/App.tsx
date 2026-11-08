import { EmptyState } from './components/EmptyState';
import { Layout } from './components/Layout';
import { useHashRoute } from './hooks/useHashRoute';
import { ClientsPage } from './pages/ClientsPage';
import { OwnersPage } from './pages/OwnersPage';
import { QuoteDetailPage } from './pages/QuoteDetailPage';
import { QuotesPage } from './pages/QuotesPage';
import type { Route } from './router';

function Page({ route }: { route: Route }) {
  switch (route.name) {
    case 'owners':
      return <OwnersPage />;
    case 'clients':
      return <ClientsPage />;
    case 'notFound':
      return (
        <EmptyState
          title="Página não encontrada"
          action={
            <a href="#/orcamentos" className="text-sky-700 underline">
              Ir para orçamentos
            </a>
          }
        />
      );
    case 'quotes':
      return <QuotesPage />;
    case 'quote':
      // `key` remounts on id change, so the previous quote never flashes while the next loads.
      return <QuoteDetailPage key={route.id} id={route.id} />;
  }
}

export function App() {
  const route = useHashRoute();
  return (
    <Layout route={route}>
      <Page route={route} />
    </Layout>
  );
}
