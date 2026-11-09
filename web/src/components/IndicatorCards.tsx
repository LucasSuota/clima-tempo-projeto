import type { ReactNode } from 'react';
import type { Indicators } from '../api/types';
import { splitOpenTotal } from '../charts';
import { formatCurrency, formatPercent } from '../format';

interface IndicatorCardProps {
  label: string;
  value: string;
  caption: string;
  highlightColor?: string;
  chart?: ReactNode;
}

function IndicatorCard({
  label,
  value,
  caption,
  highlightColor = 'text-[#0F1F2B]',
  chart,
}: IndicatorCardProps) {
  return (
    <div className="flex flex-col gap-1 bg-white p-6">
      <span className="text-[13px] leading-[18px] font-semibold text-[#52646F]">{label}</span>
      <span
        className={`text-[36px] leading-[44px] font-bold tracking-tight tabular-nums ${highlightColor}`}
      >
        {value}
      </span>
      <span className="text-[13px] leading-[18px] text-[#52646F]">{caption}</span>
      {chart && <div className="mt-auto pt-4">{chart}</div>}
    </div>
  );
}

function OpenTotalBar({ indicators }: { indicators: Indicators }) {
  const { stale, current, staleShare } = splitOpenTotal(indicators);

  if (staleShare === null) {
    return (
      <div>
        <div className="h-2.5 rounded-full bg-[#E7EDF2]" />
        <p className="mt-2 text-[13px] leading-[18px] text-[#52646F]">Nada em aberto</p>
      </div>
    );
  }

  const description = `Parado: ${formatCurrency(stale)} (${formatPercent(staleShare)}). Em dia: ${formatCurrency(current)} (${formatPercent(1 - staleShare)}).`;

  return (
    <div>
      {/* Two segments with a 2px surface gap; widths come straight from the share. */}
      <div role="img" aria-label={description} className="flex h-2.5 gap-0.5">
        {stale > 0 && (
          <div
            className="rounded-full bg-[#A34A06]"
            style={{ width: `${staleShare * 100}%`, minWidth: '4px' }}
          />
        )}
        {current > 0 && <div className="flex-1 rounded-full bg-[#1B5FA6]" />}
      </div>
      <dl aria-hidden="true" className="mt-2 grid grid-cols-2 gap-2 text-[13px] leading-[18px]">
        <div className="flex min-w-0 items-center gap-1.5">
          <span className="size-2 shrink-0 rounded-full bg-[#A34A06]" />
          <dt className="text-[#52646F]">Parado</dt>
          <dd className="ml-auto font-semibold tabular-nums text-[#0F1F2B]">
            {formatPercent(staleShare)}
          </dd>
        </div>
        <div className="flex min-w-0 items-center gap-1.5">
          <span className="size-2 shrink-0 rounded-full bg-[#1B5FA6]" />
          <dt className="text-[#52646F]">Em dia</dt>
          <dd className="ml-auto font-semibold tabular-nums text-[#0F1F2B]">
            {formatPercent(1 - staleShare)}
          </dd>
        </div>
      </dl>
    </div>
  );
}

const RING_RADIUS = 15.9155; // circumference of 100, so the rate maps straight to the dash length

function ConversionRing({ rate }: { rate: number | null }) {
  const label =
    rate === null
      ? 'Taxa de conversão: sem dados'
      : `Taxa de conversão: ${formatPercent(rate)} dos orçamentos finalizados foram ganhos`;

  return (
    <div className="flex items-center gap-3">
      <svg
        viewBox="0 0 36 36"
        className="size-12 shrink-0 -rotate-90"
        role="img"
        aria-label={label}
      >
        <circle
          cx="18"
          cy="18"
          r={RING_RADIUS}
          fill="none"
          stroke={rate === null ? '#E7EDF2' : '#C3CFD9'}
          strokeWidth="4"
        />
        {rate !== null && rate > 0 && (
          <circle
            cx="18"
            cy="18"
            r={RING_RADIUS}
            fill="none"
            stroke="#1B5FA6"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={`${rate * 100} 100`}
          />
        )}
      </svg>
      {rate === null ? (
        <span aria-hidden="true" className="text-[13px] leading-[18px] text-[#52646F]">
          Sem orçamentos finalizados
        </span>
      ) : (
        <dl aria-hidden="true" className="flex flex-col text-[13px] leading-[18px]">
          <div className="flex items-center gap-1.5">
            <span className="size-2 shrink-0 rounded-full bg-[#1B5FA6]" />
            <dt className="text-[#52646F]">Ganhos</dt>
            <dd className="font-semibold tabular-nums text-[#0F1F2B]">{formatPercent(rate)}</dd>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-2 shrink-0 rounded-full bg-[#C3CFD9]" />
            <dt className="text-[#52646F]">Perdidos</dt>
            <dd className="font-semibold tabular-nums text-[#0F1F2B]">{formatPercent(1 - rate)}</dd>
          </div>
        </dl>
      )}
    </div>
  );
}

export function IndicatorCards({ indicators }: { indicators: Indicators }) {
  return (
    <div className="grid grid-cols-1 gap-[1px] overflow-hidden rounded-[8px] border border-[#DDE5EC] bg-[#DDE5EC] sm:grid-cols-3">
      <IndicatorCard
        label="Dinheiro parado"
        value={formatCurrency(indicators.staleTotal)}
        caption="Valor dos orçamentos sem contato há dias"
        highlightColor="text-[#A34A06]"
      />
      <IndicatorCard
        label="Em aberto"
        value={formatCurrency(indicators.openTotal)}
        caption="Total em propostas aguardando retorno ou fechamento"
        chart={<OpenTotalBar indicators={indicators} />}
      />
      <IndicatorCard
        label="Taxa de conversão"
        value={formatPercent(indicators.conversionRate)}
        caption={
          indicators.conversionRate === null
            ? 'Ainda não há orçamentos ganhos ou perdidos'
            : 'Proporção de orçamentos ganhos sobre finalizados'
        }
        chart={<ConversionRing rate={indicators.conversionRate} />}
      />
    </div>
  );
}
