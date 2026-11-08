import type { Indicators } from '../api/types';
import { formatCurrency, formatPercent } from '../format';

interface IndicatorCardProps {
  label: string;
  value: string;
  hint?: string;
}

function IndicatorCard({ label, value, hint }: IndicatorCardProps) {
  return (
    <div className="rounded-md bg-white p-4 shadow-sm">
      <dt className="text-sm text-slate-600">{label}</dt>
      <dd className="mt-1 text-2xl font-semibold text-slate-900">{value}</dd>
      {hint && <p className="mt-1 text-sm text-slate-500">{hint}</p>}
    </div>
  );
}

// Every number arrives computed by the API; this only formats it.
export function IndicatorCards({ indicators }: { indicators: Indicators }) {
  return (
    <dl className="grid gap-3 md:grid-cols-3">
      <IndicatorCard label="Total em aberto" value={formatCurrency(indicators.openTotal)} />
      <IndicatorCard label="Valor parado" value={formatCurrency(indicators.staleTotal)} />
      <IndicatorCard
        label="Taxa de conversão"
        value={formatPercent(indicators.conversionRate)}
        hint={
          indicators.conversionRate === null
            ? 'Ainda não há orçamentos ganhos ou perdidos'
            : undefined
        }
      />
    </dl>
  );
}
