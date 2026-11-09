import type { ReactNode } from 'react';

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
  tag?: string;
}

export function EmptyState({ title, description, action, tag }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-[8px] border border-[#DDE5EC] bg-white px-6 py-8 text-center">
      <h3 className="text-[20px] leading-7 font-semibold text-[#0F1F2B]">{title}</h3>
      {description && (
        <p className="mb-2 max-w-[340px] text-sm leading-5 text-[#52646F]">{description}</p>
      )}
      {action && <div className="mt-1 flex justify-center">{action}</div>}
      {tag && <span className="mt-2 text-xs leading-4 font-semibold text-[#52646F]">{tag}</span>}
    </div>
  );
}
