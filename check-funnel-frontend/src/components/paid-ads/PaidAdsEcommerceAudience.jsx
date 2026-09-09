import { formatPaidAdsMoney, formatPaidAdsNumber } from '../../utils/paidAdsFormatters';

const colors = ['#10b981','#2563eb','#8b5cf6','#f59e0b','#06b6d4','#f97316','#64748b'];

function merge(rows, labelForKey) {
  const result = new Map();
  rows.forEach(row => {
    const key = labelForKey(row.key);
    const current = result.get(key) || { key, purchases: 0, purchaseValue: 0, spend: 0, reach: 0, landingPageViews: 0 };
    ['purchases','purchaseValue','spend','reach','landingPageViews'].forEach(metric => { current[metric] += Number(row[metric] || 0); });
    result.set(key, current);
  });
  return [...result.values()].sort((a, b) => b.purchases - a.purchases || b.purchaseValue - a.purchaseValue || b.spend - a.spend);
}

function RegionDeliveryCard({ rows, currency }) {
  const visibleRows = [...rows].sort((a, b) => b.spend - a.spend).slice(0, 6);
  const totalSpend = rows.reduce((sum, row) => sum + Number(row.spend || 0), 0);
  return <article className="rounded-2xl border border-[#c2c6d3]/25 p-4"><h3 className="text-sm font-extrabold text-[#273548]">Province / Region</h3><p className="mt-0.5 text-[10px] font-semibold text-[#8a9099]">Spend share · Reach</p><div className="mt-5 space-y-4">{visibleRows.map((row,index) => { const share = totalSpend > 0 ? (row.spend / totalSpend) * 100 : 0; return <div key={row.key}><div className="flex items-center justify-between gap-3 text-[10px]"><span className="min-w-0 truncate font-bold text-[#59606b]" title={row.key}>{row.key}</span><span className="shrink-0 font-extrabold text-[#273548]">{share.toFixed(1)}% spend</span></div><div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[#edf0f4]"><div className="h-full rounded-full" style={{width:`${share ? Math.max(3,share) : 0}%`,backgroundColor:colors[index%colors.length]}}/></div><div className="mt-1 flex justify-between text-[9px] font-semibold text-[#9aa0a9]"><span>Reach {formatPaidAdsNumber(row.reach)}</span><span>{formatPaidAdsMoney(row.spend,currency)}</span></div></div>;})}{!visibleRows.length&&<p className="py-8 text-center text-xs font-semibold text-[#8a9099]">No regional delivery data.</p>}</div><p className="mt-4 border-t border-[#edf0f2] pt-3 text-[9px] font-semibold leading-4 text-[#8a9099]">Meta does not provide purchase attribution by province for this data, so this card shows delivery instead.</p></article>;
}

function AudienceCard({ title, rows, currency }) {
  const visibleRows = rows.slice(0, 6);
  const totalPurchases = rows.reduce((sum, row) => sum + Number(row.purchases || 0), 0);
  const max = Math.max(1, ...visibleRows.map(row => Number(row.purchases || 0)));
  return <article className="rounded-2xl border border-[#c2c6d3]/25 p-4"><h3 className="text-sm font-extrabold text-[#273548]">{title}</h3><p className="mt-0.5 text-[10px] font-semibold text-[#8a9099]">Purchases · share · ROAS</p><div className="mt-5 space-y-4">{visibleRows.map((row,index) => <div key={row.key}><div className="flex items-center justify-between gap-3 text-[10px]"><span className="min-w-0 truncate font-bold text-[#59606b]" title={row.key}>{row.key}</span><span className="shrink-0 font-extrabold text-[#273548]">{formatPaidAdsNumber(row.purchases)} · {totalPurchases ? ((row.purchases / totalPurchases) * 100).toFixed(1) : '0.0'}% · {row.spend ? (row.purchaseValue / row.spend).toFixed(2) : '0.00'}x</span></div><div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[#edf0f4]"><div className="h-full rounded-full" style={{ width: `${row.purchases ? Math.max(5, (row.purchases / max) * 100) : 0}%`, backgroundColor: colors[index % colors.length] }}/></div><div className="mt-1 flex justify-between text-[9px] font-semibold text-[#9aa0a9]"><span>{formatPaidAdsMoney(row.purchaseValue, currency)} revenue</span><span>{formatPaidAdsMoney(row.purchases ? row.spend / row.purchases : 0, currency)} / purchase</span></div></div>)}{!visibleRows.length && <p className="py-8 text-center text-xs font-semibold text-[#8a9099]">No audience data.</p>}</div></article>;
}

export default function PaidAdsEcommerceAudience({ audience = {}, currency }) {
  const age = merge(audience.age || [], key => ['55-64','65+'].includes(key) ? '55+' : key);
  const gender = merge(audience.gender || [], key => key === 'female' ? 'Female' : key === 'male' ? 'Male' : 'Other');
  const region = merge(audience.regions || [], key => String(key).toLowerCase() === 'unknown' ? 'Unknown' : key);
  const device = merge(audience.devices || [], key => key.includes('tablet') || key === 'ipad' ? 'Tablet' : key.includes('smartphone') || ['iphone','ipod'].includes(key) ? 'Mobile' : key === 'desktop' ? 'Desktop' : 'Other');

  return <section className="mt-6 rounded-3xl border border-[#c2c6d3]/30 bg-white p-5 shadow-sm sm:p-6"><div><h2 className="text-lg font-extrabold text-[#191c1d]">Ecommerce audience performance</h2><p className="mt-1 text-xs font-semibold text-[#727782]">Identify audiences generating purchases, revenue and efficient returns.</p></div><div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4"><AudienceCard title="Age group" rows={age} currency={currency}/><AudienceCard title="Gender" rows={gender} currency={currency}/><RegionDeliveryCard rows={region} currency={currency}/><AudienceCard title="Device" rows={device} currency={currency}/></div></section>;
}
