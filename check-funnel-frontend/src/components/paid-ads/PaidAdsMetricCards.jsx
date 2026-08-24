import { formatPaidAdsChange, formatPaidAdsMoney, formatPaidAdsNumber } from '../../utils/paidAdsFormatters';

const cards = [
  { key: 'spend', label: 'Total Ad Spend', color: '#2674ff', tint: '#eaf1ff', icon: '$' },
  { key: 'reach', label: 'Reach', color: '#16b979', tint: '#e4f8ef', icon: '◎' },
  { key: 'impressions', label: 'Impressions', color: '#8c50f6', tint: '#f0eaff', icon: '◉' },
  { key: 'clicks', label: 'Clicks', color: '#ff6a1a', tint: '#fff0e7', icon: '↗' },
  { key: 'conversions', label: 'Conversions', color: '#2674ff', tint: '#eaf1ff', icon: '✓' },
];

function metricValue(key, value, currency) {
  return key === 'spend' ? formatPaidAdsMoney(value, currency) : formatPaidAdsNumber(value);
}

function SpendValue({ value }) {
  const amount = Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  return (
    <p className="mt-0.5 flex items-baseline whitespace-nowrap text-[#191c1d]">
      <span className="text-2xl font-black tracking-[-0.04em] tabular-nums">{amount}</span>
    </p>
  );
}

export default function PaidAdsMetricCards({ totals, currency }) {
  return (
    <section className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {cards.map((card) => {
        const metric = totals[card.key];
        const positive = metric.change == null || metric.change >= 0;
        return (
          <article key={card.key} className="flex min-w-0 flex-col rounded-2xl border border-[#c2c6d3]/30 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex items-center gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-xl font-black" style={{ color: card.color, backgroundColor: card.tint }}>{card.icon}</span>
              <div className="min-w-0">
                <p className="truncate text-[13px] font-bold text-[#727782]">{card.key === 'spend' ? `${card.label} (${currency})` : card.label}</p>
                {card.key === 'spend'
                  ? <SpendValue value={metric.current} />
                  : <p className="mt-0.5 whitespace-nowrap text-2xl font-black tracking-tight text-[#191c1d]">{metricValue(card.key, metric.current, currency)}</p>}
              </div>
            </div>
            <div className="mt-5 flex items-center justify-between gap-2 text-[11px] font-bold">
              <span className="truncate text-[#727782]">Previous: {metricValue(card.key, metric.previous, currency)}</span>
              <span className={positive ? 'shrink-0 text-green-600' : 'shrink-0 text-red-500'}>{positive ? '↑' : '↓'} {formatPaidAdsChange(metric.change)}</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#f1f5f9]"><div className="h-full rounded-full bg-[#2563eb]" style={{ width: `${Math.min(100, Math.max(5, Math.abs(metric.change || 0) * 3))}%` }} /></div>
          </article>
        );
      })}
    </section>
  );
}
