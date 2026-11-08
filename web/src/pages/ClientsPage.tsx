import { useState } from 'react';
import { deleteClient, listClients } from '../api/clients';
import type { Client } from '../api/types';
import { AsyncView } from '../components/AsyncView';
import { Button } from '../components/Button';
import { ClientActions } from '../components/ClientActions';
import { ClientForm } from '../components/ClientForm';
import { DataTable, type Column } from '../components/DataTable';
import { EmptyState } from '../components/EmptyState';
import { useAsync } from '../hooks/useAsync';
import { useSubmit } from '../hooks/useSubmit';

export function ClientsPage() {
  const clients = useAsync(listClients);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  // No known fields: the server's `detail` (e.g. client with quotes) goes to `message`.
  const removal = useSubmit([]);

  function closeForm() {
    setFormOpen(false);
    setEditing(null);
  }

  function handleSaved() {
    closeForm();
    clients.reload();
  }

  function handleNew() {
    setEditing(null);
    setFormOpen(true);
  }

  function handleEdit(client: Client) {
    setFormOpen(false);
    setEditing(client);
  }

  async function handleDelete(client: Client) {
    const removed = await removal.run(() => deleteClient(client.id));
    if (removed) clients.reload();
  }

  const columns: Column<Client>[] = [
    { header: 'Nome', cell: (client) => client.name, hideLabelOnCard: true },
    { header: 'E-mail', cell: (client) => client.email ?? '—' },
    { header: 'Telefone', cell: (client) => client.phone ?? '—' },
    {
      header: 'Ações',
      hideLabelOnCard: true,
      cell: (client) => (
        <ClientActions
          client={client}
          disabled={removal.submitting}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      ),
    },
  ];

  return (
    <section>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold md:text-3xl">Clientes</h1>
        {!formOpen && <Button onClick={handleNew}>Novo cliente</Button>}
      </div>
      {formOpen && <ClientForm onSaved={handleSaved} onCancel={closeForm} />}
      {editing && (
        <ClientForm key={editing.id} client={editing} onSaved={handleSaved} onCancel={closeForm} />
      )}
      {removal.message && (
        <p role="alert" className="mb-6 rounded-md bg-red-50 p-3 text-red-800">
          {removal.message}
        </p>
      )}
      <AsyncView state={clients}>
        {(data) =>
          data.items.length === 0 ? (
            <EmptyState title="Nenhum cliente cadastrado" />
          ) : (
            <DataTable items={data.items} columns={columns} getKey={(client) => client.id} />
          )
        }
      </AsyncView>
    </section>
  );
}
