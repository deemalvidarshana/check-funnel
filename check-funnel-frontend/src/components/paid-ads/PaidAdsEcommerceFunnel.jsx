import { formatPaidAdsChange, formatPaidAdsMoney, formatPaidAdsNumber } from '../../utils/paidAdsFormatters';
import { RangeSelector } from './PaidAdsPerformanceChart';

const stages = [
  { key: 'landingPageViews', label: 'Landing page views', color: '#2563eb' },
  { key: 'contentViews', label: 'Product / content views', color: '#06b6d4' },
  { key: 'addToCart', label: 'Adds to cart', color: '#8b5cf6' },
  { key: 'initiateCheckout', label: 'Checkouts initiated', color: '#f59e0b' },
  { key: 'purchases', label: 'Purchases', color: '#10b981' },
];

function change(current, previous) {
  if (!previous) return current ? null : 0;
  return ((current - previous) / previous) * 100;
}

function Trend({ value, inverse = false }) {
  if (value == null) return <span className="text-[#8a9099]">New</span>;
  const favorable = inverse ? value <= 0 : value >= 0;
  return <span className={favorable ? 'text-green-600' : 'text-red-500'}>{value >= 0 ? '↑' : '↓'} {formatPaidAdsChange(value)}</span>;
}

export default function PaidAdsEcommerceFunnel({ totals, currency, period, comparisonPeriod, onApplyRange, loading = false }) {
  const values = stages.map(stage => Number(totals[stage.key]?.current || 0));
  const previousValues = stages.map(stage => Number(totals[stage.key]?.previous || 0));
  const first = Math.max(values[0], 1);
  const purchases = values.at(-1);
  const previousPurchases = previousValues.at(-1);
  const spend = Number(totals.spend?.current || 0);
  const previousSpend = Number(totals.spend?.previous || 0);
  const revenue = Number(totals.purchaseValue?.current || 0);
  const previousRevenue = Number(totals.purchaseValue?.previous || 0);
  const purchaseRate = values[0] ? (purchases / values[0]) * 100 : 0;
  const previousPurchaseRate = previousValues[0] ? (previousPurchases / previousValues[0]) * 100 : 0;
  const costPerPurchase = purchases ? spend / purchases : 0;
  const previousCostPerPurchase = previousPurchases ? previousSpend / previousPurchases : 0;
  const hasCommerceEvents = values.slice(1).some(Boolean) || revenue > 0;

  return <section className="mt-6 rounded-3xl border border-[#c2c6d3]/30 bg-white p-5 shadow-sm sm:p-6">
    <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between"><div><h2 className="text-lg font-extrabold text-[#191c1d]">Ecommerce conversion journey</h2><p className="mt-1 text-xs font-semibold text-[#727782]">Meta ad traffic progressing from landing-page visit to purchase.</p></div><div className="flex w-full min-w-0 flex-col gap-2 sm:w-auto sm:flex-row sm:items-center"><span className="w-fit shrink-0 rounded-full bg-emerald-50 px-4 py-2 text-[10px] font-extrabold text-emerald-700">SALES FUNNEL</span>{onApplyRange && <RangeSelector period={period} comparisonPeriod={comparisonPeriod} loading={loading} onApplyRange={onApplyRange} />}</div></div>
    <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
      {stages.map((stage, index) => {
        const value = values[index];
        const prior = index ? values[index - 1] : 0;
        const stageRate = prior ? (value / prior) * 100 : null;
        return <div key={stage.key} className="rounded-2xl border border-[#c2c6d3]/25 p-4"><div className="flex items-start justify-between gap-2"><span className="flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-black text-white" style={{ backgroundColor: stage.color }}>{index + 1}</span><div className="text-right text-[10px] font-extrabold">{index > 0 && <p className="text-[#8a9099]">{stageRate == null ? '—' : `${stageRate.toFixed(1)}% of prior`}</p>}<p className={index > 0 ? 'mt-1' : ''}><Trend value={totals[stage.key]?.change} /></p></div></div><p className="mt-4 text-[11px] font-bold text-[#727782]">{stage.label}</p><p className="mt-1 text-2xl font-black text-[#191c1d]">{formatPaidAdsNumber(value)}</p><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#edf0f4]"><div className="h-full rounded-full" style={{ width: `${value ? Math.max(4, Math.min(100, (value / first) * 100)) : 0}%`, backgroundColor: stage.color }} /></div></div>;
      })}
    </div>
    <div className="mt-4 grid gap-3 sm:grid-cols-3"><div className="rounded-2xl bg-[#f8f9fa] p-4"><div className="flex items-center justify-between gap-3"><p className="text-[10px] font-bold uppercase tracking-wide text-[#8a9099]">Purchase rate</p><span className="text-[10px] font-extrabold"><Trend value={change(purchaseRate, previousPurchaseRate)} /></span></div><p className="mt-1 text-lg font-black text-[#273548]">{purchaseRate.toFixed(2)}%</p></div><div className="rounded-2xl bg-[#f8f9fa] p-4"><div className="flex items-center justify-between gap-3"><p className="text-[10px] font-bold uppercase tracking-wide text-[#8a9099]">Cost per purchase</p><span className="text-[10px] font-extrabold"><Trend value={change(costPerPurchase, previousCostPerPurchase)} inverse /></span></div><p className="mt-1 text-lg font-black text-[#273548]">{formatPaidAdsMoney(costPerPurchase, currency)}</p></div><div className="rounded-2xl bg-[#f8f9fa] p-4"><div className="flex items-center justify-between gap-3"><p className="text-[10px] font-bold uppercase tracking-wide text-[#8a9099]">Revenue</p><span className="text-[10px] font-extrabold"><Trend value={change(revenue, previousRevenue)} /></span></div><p className="mt-1 text-lg font-black text-emerald-600">{formatPaidAdsMoney(revenue, currency)}</p></div></div>
    {!hasCommerceEvents && <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold leading-5 text-amber-800">No Meta Pixel or Conversions API ecommerce events were reported for this period. Verify ViewContent, AddToCart, InitiateCheckout and Purchase tracking.</div>}
  </section>;
}
