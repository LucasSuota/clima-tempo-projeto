import { EmptyState } from './components/EmptyState';
import { Layout } from './components/Layout';
import { useHashRoute } from './hooks/useHashRoute';
import { ClientsPage } from './pages/ClientsPage';
import { OwnersPage } from './pages/OwnersPage';
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
    default:
      return <EmptyState title="Orçamentos em breve" />;
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
