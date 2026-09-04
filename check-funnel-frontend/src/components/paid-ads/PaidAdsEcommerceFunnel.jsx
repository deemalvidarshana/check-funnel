import { formatPaidAdsMoney, formatPaidAdsNumber } from '../../utils/paidAdsFormatters';

const stages = [
  { key: 'landingPageViews', label: 'Landing page views', color: '#2563eb' },
  { key: 'contentViews', label: 'Product / content views', color: '#06b6d4' },
  { key: 'addToCart', label: 'Adds to cart', color: '#8b5cf6' },
  { key: 'initiateCheckout', label: 'Checkouts initiated', color: '#f59e0b' },
  { key: 'purchases', label: 'Purchases', color: '#10b981' },
];

export default function PaidAdsEcommerceFunnel({ totals, currency }) {
  const values = stages.map(stage => Number(totals[stage.key]?.current || 0));
  const first = Math.max(values[0], 1);
  const purchases = values.at(-1);
  const spend = Number(totals.spend?.current || 0);
  const revenue = Number(totals.purchaseValue?.current || 0);
  const hasCommerceEvents = values.slice(1).some(Boolean) || revenue > 0;

  return <section className="mt-6 rounded-3xl border border-[#c2c6d3]/30 bg-white p-5 shadow-sm sm:p-6">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><h2 className="text-lg font-extrabold text-[#191c1d]">Ecommerce conversion journey</h2><p className="mt-1 text-xs font-semibold text-[#727782]">Meta ad traffic progressing from landing-page visit to purchase.</p></div><span className="w-fit rounded-full bg-emerald-50 px-4 py-2 text-[10px] font-extrabold text-emerald-700">SALES FUNNEL</span></div>
    <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
      {stages.map((stage, index) => {
        const value = values[index];
        const prior = index ? values[index - 1] : 0;
        const stageRate = prior ? (value / prior) * 100 : null;
        return <div key={stage.key} className="rounded-2xl border border-[#c2c6d3]/25 p-4"><div className="flex items-center justify-between"><span className="flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-black text-white" style={{ backgroundColor: stage.color }}>{index + 1}</span>{index > 0 && <span className="text-[10px] font-extrabold text-[#8a9099]">{stageRate == null ? '—' : `${stageRate.toFixed(1)}% of prior`}</span>}</div><p className="mt-4 text-[11px] font-bold text-[#727782]">{stage.label}</p><p className="mt-1 text-2xl font-black text-[#191c1d]">{formatPaidAdsNumber(value)}</p><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#edf0f4]"><div className="h-full rounded-full" style={{ width: `${value ? Math.max(4, Math.min(100, (value / first) * 100)) : 0}%`, backgroundColor: stage.color }} /></div></div>;
      })}
    </div>
    <div className="mt-4 grid gap-3 sm:grid-cols-3"><div className="rounded-2xl bg-[#f8f9fa] p-4"><p className="text-[10px] font-bold uppercase tracking-wide text-[#8a9099]">Purchase rate</p><p className="mt-1 text-lg font-black text-[#273548]">{values[0] ? ((purchases / values[0]) * 100).toFixed(2) : '0.00'}%</p></div><div className="rounded-2xl bg-[#f8f9fa] p-4"><p className="text-[10px] font-bold uppercase tracking-wide text-[#8a9099]">Cost per purchase</p><p className="mt-1 text-lg font-black text-[#273548]">{formatPaidAdsMoney(purchases ? spend / purchases : 0, currency)}</p></div><div className="rounded-2xl bg-[#f8f9fa] p-4"><p className="text-[10px] font-bold uppercase tracking-wide text-[#8a9099]">Revenue</p><p className="mt-1 text-lg font-black text-emerald-600">{formatPaidAdsMoney(revenue, currency)}</p></div></div>
    {!hasCommerceEvents && <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold leading-5 text-amber-800">No Meta Pixel or Conversions API ecommerce events were reported for this period. Verify ViewContent, AddToCart, InitiateCheckout and Purchase tracking.</div>}
  </section>;
}
