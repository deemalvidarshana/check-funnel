import { formatPaidAdsChange, formatPaidAdsMoney, formatPaidAdsNumber } from '../../utils/paidAdsFormatters';

const cardConfig = [
  { key: 'spend', label: 'Ad spend', icon: '$', color: '#2563eb', tint: '#eaf1ff', type: 'money' },
  { key: 'purchaseValue', label: 'Purchase revenue', icon: '↗', color: '#10b981', tint: '#e7f8f1', type: 'money' },
  { key: 'purchases', label: 'Purchases', icon: '✓', color: '#059669', tint: '#e5f7ef', type: 'number' },
  { key: 'purchaseRoas', label: 'Purchase ROAS', icon: '×', color: '#8b5cf6', tint: '#f1ebff', type: 'roas' },
  { key: 'costPerPurchase', label: 'Cost per purchase', icon: '◎', color: '#f97316', tint: '#fff0e7', type: 'money' },
  { key: 'addToCart', label: 'Adds to cart', icon: '+', color: '#06b6d4', tint: '#e5f8fb', type: 'number' },
  { key: 'initiateCheckout', label: 'Checkouts initiated', icon: '→', color: '#0ea5e9', tint: '#e8f6fd', type: 'number' },
  { key: 'purchaseRate', label: 'Conversion rate', detail: '(LPV → purchase)', icon: '%', color: '#14b8a6', tint: '#e6f8f6', type: 'percent' },
];

function change(current, previous) {
  if (!previous) return current ? null : 0;
  return ((current - previous) / previous) * 100;
}

function derive(totals) {
  const metric = key => ({ current: Number(totals[key]?.current || 0), previous: Number(totals[key]?.previous || 0), change: totals[key]?.change });
  const spend = metric('spend');
  const purchases = metric('purchases');
  const landing = metric('landingPageViews');
  const costPerPurchase = {
    current: purchases.current ? spend.current / purchases.current : 0,
    previous: purchases.previous ? spend.previous / purchases.previous : 0,
  };
  costPerPurchase.change = change(costPerPurchase.current, costPerPurchase.previous);
  const purchaseRate = {
    current: landing.current ? (purchases.current / landing.current) * 100 : 0,
    previous: landing.previous ? (purchases.previous / landing.previous) * 100 : 0,
  };
  purchaseRate.change = change(purchaseRate.current, purchaseRate.previous);
  return { costPerPurchase, purchaseRate };
}

function display(value, type, currency) {
  if (type === 'money') return formatPaidAdsMoney(value, currency);
  if (type === 'roas') return `${Number(value || 0).toFixed(2)}x`;
  if (type === 'percent') return `${Number(value || 0).toFixed(2)}%`;
  return formatPaidAdsNumber(value);
}

export default function PaidAdsEcommerceMetricCards({ totals, currency }) {
  const derived = derive(totals);
  return <section className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
    {cardConfig.map(card => {
      const metric = derived[card.key] || totals[card.key] || { current: 0, previous: 0, change: 0 };
      const positive = metric.change == null || metric.change >= 0;
      const inverse = card.key === 'costPerPurchase';
      const favorable = metric.change == null || (inverse ? metric.change <= 0 : metric.change >= 0);
      return <article key={card.key} className="flex min-w-0 flex-col rounded-2xl border border-[#c2c6d3]/30 bg-white p-5 shadow-sm transition hover:shadow-md">
        <div className="flex items-center gap-4"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-xl font-black" style={{ color: card.color, backgroundColor: card.tint }}>{card.icon}</span><div className="min-w-0"><p className="truncate text-[13px] font-bold text-[#727782]">{card.label}</p><div className="mt-0.5 flex min-w-0 items-baseline gap-2"><p className="truncate text-2xl font-black tracking-tight text-[#191c1d]" title={display(metric.current, card.type, currency)}>{display(metric.current, card.type, currency)}</p>{card.detail && <span className="shrink-0 text-[9px] font-semibold text-[#9aa0a9]">{card.detail}</span>}</div></div></div>
        <div className="mt-5 flex items-center justify-between gap-2 text-[11px] font-bold"><span className="truncate text-[#727782]">Previous: {display(metric.previous, card.type, currency)}</span><span className={`shrink-0 ${metric.change == null ? 'text-[#8a9099]' : favorable ? 'text-green-600' : 'text-red-500'}`}>{metric.change == null ? '—' : `${positive ? '↑' : '↓'} ${formatPaidAdsChange(metric.change)}`}</span></div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#f1f5f9]"><div className="h-full rounded-full" style={{ width: `${Math.min(100, Math.max(5, Math.abs(metric.change || 0) * 3))}%`, backgroundColor: card.color }} /></div>
      </article>;
    })}
  </section>;
}
