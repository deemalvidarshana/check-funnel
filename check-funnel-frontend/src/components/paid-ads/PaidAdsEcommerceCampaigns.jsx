import { useMemo, useState } from 'react';
import { formatPaidAdsMoney, formatPaidAdsNumber } from '../../utils/paidAdsFormatters';

function rate(numerator, denominator, multiplier = 1) {
  return Number(denominator || 0) > 0 ? (Number(numerator || 0) / Number(denominator)) * multiplier : 0;
}

function statusStyle(status = '') {
  if (status.includes('ACTIVE')) return 'bg-emerald-50 text-emerald-600';
  if (status.includes('PAUSED')) return 'bg-slate-100 text-slate-500';
  return 'bg-blue-50 text-blue-600';
}

export default function PaidAdsEcommerceCampaigns({ campaigns = [], currency }) {
  const [query, setQuery] = useState('');
  const [showAll, setShowAll] = useState(false);
  const rows = useMemo(() => campaigns
    .filter(campaign => !query.trim() || String(campaign.name || '').toLowerCase().includes(query.trim().toLowerCase()))
    .sort((a, b) => Number(b.purchaseValue || 0) - Number(a.purchaseValue || 0) || Number(b.purchases || 0) - Number(a.purchases || 0) || Number(b.spend || 0) - Number(a.spend || 0)), [campaigns, query]);
  const visible = showAll ? rows : rows.slice(0, 8);

  return <section className="mt-6 rounded-3xl border border-[#c2c6d3]/30 bg-white p-5 shadow-sm sm:p-6">
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div><h2 className="text-lg font-extrabold text-[#191c1d]">Ecommerce campaign performance</h2><p className="mt-1 text-xs font-semibold text-[#727782]">Campaigns ranked by purchase revenue, sales volume and efficiency.</p></div><div className="flex w-full gap-2 sm:w-auto"><label className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-full border border-[#c2c6d3]/30 px-4 shadow-sm sm:w-64"><span className="text-[#727782]">⌕</span><input value={query} onChange={event => setQuery(event.target.value)} className="min-w-0 flex-1 bg-transparent text-xs outline-none" placeholder="Search campaigns..."/></label><button type="button" onClick={() => setShowAll(value => !value)} className="h-10 shrink-0 rounded-full border border-[#c2c6d3]/30 px-5 text-xs font-bold text-[#003870] shadow-sm">{showAll ? 'Top 8' : 'View all'}</button></div></div>
    <div className="mt-4 overflow-x-auto rounded-2xl border border-[#c2c6d3]/25"><table className="w-max min-w-full border-collapse text-left"><thead className="bg-[#f8f9fa]"><tr>{['Campaign','Delivery','Spend','Landing views','Content views','Add to cart','Checkouts','Purchases','Revenue','ROAS','Cost / purchase','LPV → purchase'].map(label => <th key={label} className="whitespace-nowrap border-b border-[#e5e7eb] px-4 py-3 text-[11px] font-extrabold text-[#5d6470]">{label}</th>)}</tr></thead><tbody>
      {visible.map(row => <tr key={row.id} className="hover:bg-[#f8f9fa]/80"><td className="min-w-[240px] border-b border-[#edf0f2] px-4 py-3 text-[11px] font-bold text-[#273548]">{row.name}</td><td className="border-b border-[#edf0f2] px-4 py-3"><span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-extrabold ${statusStyle(row.status)}`}>{String(row.status || 'UNKNOWN').replaceAll('_',' ')}</span></td><td className="border-b border-[#edf0f2] px-4 py-3 text-[11px] font-semibold">{formatPaidAdsMoney(row.spend, currency)}</td><td className="border-b border-[#edf0f2] px-4 py-3 text-[11px] font-semibold">{formatPaidAdsNumber(row.landingPageViews)}</td><td className="border-b border-[#edf0f2] px-4 py-3 text-[11px] font-semibold">{formatPaidAdsNumber(row.contentViews)}</td><td className="border-b border-[#edf0f2] px-4 py-3 text-[11px] font-semibold">{formatPaidAdsNumber(row.addToCart)}</td><td className="border-b border-[#edf0f2] px-4 py-3 text-[11px] font-semibold">{formatPaidAdsNumber(row.initiateCheckout)}</td><td className="border-b border-[#edf0f2] px-4 py-3 text-[11px] font-extrabold text-emerald-700">{formatPaidAdsNumber(row.purchases)}</td><td className="border-b border-[#edf0f2] px-4 py-3 text-[11px] font-extrabold text-emerald-700">{formatPaidAdsMoney(row.purchaseValue, currency)}</td><td className="border-b border-[#edf0f2] px-4 py-3 text-[11px] font-extrabold">{Number(row.purchaseRoas || 0).toFixed(2)}x</td><td className="border-b border-[#edf0f2] px-4 py-3 text-[11px] font-semibold">{formatPaidAdsMoney(rate(row.spend, row.purchases), currency)}</td><td className="border-b border-[#edf0f2] px-4 py-3 text-[11px] font-semibold">{rate(row.purchases, row.landingPageViews, 100).toFixed(2)}%</td></tr>)}
      {!visible.length && <tr><td colSpan="12" className="px-4 py-12 text-center text-sm font-bold text-[#727782]">No ecommerce campaign data for this period.</td></tr>}
    </tbody></table></div>
  </section>;
}
