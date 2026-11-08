import { useState } from 'react';
import { listClients } from '../api/clients';
import type { Client } from '../api/types';
import { AsyncView } from '../components/AsyncView';
import { Button } from '../components/Button';
import { ClientForm } from '../components/ClientForm';
import { DataTable, type Column } from '../components/DataTable';
import { EmptyState } from '../components/EmptyState';
import { useAsync } from '../hooks/useAsync';

const COLUMNS: Column<Client>[] = [
  { header: 'Nome', cell: (client) => client.name, hideLabelOnCard: true },
  { header: 'E-mail', cell: (client) => client.email ?? '—' },
  { header: 'Telefone', cell: (client) => client.phone ?? '—' },
];

export function ClientsPage() {
  const clients = useAsync(listClients);
  const [formOpen, setFormOpen] = useState(false);

  function handleSaved() {
    setFormOpen(false);
    clients.reload();
  }

  return (
    <section>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold md:text-3xl">Clientes</h1>
        {!formOpen && <Button onClick={() => setFormOpen(true)}>Novo cliente</Button>}
      </div>
      {formOpen && <ClientForm onSaved={handleSaved} onCancel={() => setFormOpen(false)} />}
      <AsyncView state={clients}>
        {(data) =>
          data.items.length === 0 ? (
            <EmptyState title="Nenhum cliente cadastrado" />
          ) : (
            <DataTable items={data.items} columns={COLUMNS} getKey={(client) => client.id} />
          )
        }
      </AsyncView>
    </section>
  );
}
