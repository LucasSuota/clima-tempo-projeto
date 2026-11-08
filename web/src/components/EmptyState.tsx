import type { ReactNode } from 'react';

interface EmptyStateProps {
  title: string;
  action?: ReactNode;
}

export function EmptyState({ title, action }: EmptyStateProps) {
  return (
    <div className="rounded-md border border-dashed border-slate-300 bg-white p-8 text-center">
      <p className="text-slate-600">{title}</p>
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}
