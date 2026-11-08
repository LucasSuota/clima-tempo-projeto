import { useState } from 'react';
import { listOwners } from '../api/owners';
import type { Owner } from '../api/types';
import { AsyncView } from '../components/AsyncView';
import { Button } from '../components/Button';
import { DataTable, type Column } from '../components/DataTable';
import { EmptyState } from '../components/EmptyState';
import { OwnerForm } from '../components/OwnerForm';
import { useAsync } from '../hooks/useAsync';

const COLUMNS: Column<Owner>[] = [
  { header: 'Nome', cell: (owner) => owner.name, hideLabelOnCard: true },
  { header: 'Cargo/função', cell: (owner) => owner.role },
];

export function OwnersPage() {
  const owners = useAsync(listOwners);
  const [formOpen, setFormOpen] = useState(false);

  function handleSaved() {
    setFormOpen(false);
    owners.reload();
  }

  return (
    <section>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold md:text-3xl">Responsáveis</h1>
        {!formOpen && <Button onClick={() => setFormOpen(true)}>Novo responsável</Button>}
      </div>
      {formOpen && <OwnerForm onSaved={handleSaved} onCancel={() => setFormOpen(false)} />}
      <AsyncView state={owners}>
        {(data) =>
          data.items.length === 0 ? (
            <EmptyState title="Nenhum responsável cadastrado" />
          ) : (
            <DataTable items={data.items} columns={COLUMNS} getKey={(owner) => owner.id} />
          )
        }
      </AsyncView>
    </section>
  );
}
