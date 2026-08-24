import { useMemo } from 'react';

const colors = ['#2563eb', '#22b982', '#ff536b', '#8b5cf6', '#f59e0b', '#06b6d4', '#64748b'];

function mergeRows(rows, labelForKey) {
  const grouped = new Map();
  rows.forEach(row => {
    const label = labelForKey(row.key);
    const current = grouped.get(label) || { key: label, conversions: 0, reach: 0, clicks: 0, spend: 0 };
    current.conversions += Number(row.conversions || 0);
    current.reach += Number(row.reach || 0);
    current.clicks += Number(row.clicks || 0);
    current.spend += Number(row.spend || 0);
    grouped.set(label, current);
  });
  return [...grouped.values()].sort((a, b) => b.conversions - a.conversions);
}

function withPercentages(rows) {
  const total = rows.reduce((sum, row) => sum + Number(row.conversions || 0), 0);
  return rows.map(row => ({ ...row, percentage: total ? (Number(row.conversions || 0) / total) * 100 : 0 }));
}

function donutBackground(rows) {
  if (!rows.some(row => row.percentage > 0)) return '#edf0f4';
  let cursor = 0;
  const segments = rows.map((row, index) => {
    const start = cursor;
    cursor += row.percentage;
    return `${colors[index % colors.length]} ${start}% ${cursor}%`;
  });
  return `conic-gradient(${segments.join(',')})`;
}

function DonutCard({ title, rows }) {
  const visibleRows = withPercentages(rows).slice(0, 7);
  return (
    <div className="rounded-2xl border border-[#c2c6d3]/25 p-4">
      <h3 className="text-sm font-extrabold text-[#273548]">{title}</h3>
      <p className="mt-0.5 text-[10px] font-semibold text-[#8a9099]">By Conversions</p>
      <div className="mt-5 flex items-center gap-4">
        <div className="relative h-24 w-24 shrink-0 rounded-full" style={{ background: donutBackground(visibleRows) }}><div className="absolute inset-[17px] rounded-full bg-white" /></div>
        <div className="min-w-0 flex-1 space-y-2">
          {visibleRows.map((row, index) => <div key={row.key} className="flex items-center gap-2 text-[10px]"><span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: colors[index % colors.length] }} /><span className="min-w-0 flex-1 truncate font-semibold text-[#59606b]" title={row.key}>{row.key}</span><span className="font-extrabold text-[#354052]">{row.percentage.toFixed(1)}%</span></div>)}
        </div>
      </div>
    </div>
  );
}

function LocationCard({ rows }) {
  const displayNames = useMemo(() => {
    try { return new Intl.DisplayNames(['en'], { type: 'region' }); } catch { return null; }
  }, []);
  const locations = withPercentages(rows).slice(0, 5);
  return <div className="rounded-2xl border border-[#c2c6d3]/25 p-4"><h3 className="text-sm font-extrabold text-[#273548]">Top Locations</h3><p className="mt-0.5 text-[10px] font-semibold text-[#8a9099]">By Conversions</p><div className="mt-5 space-y-3">{locations.map(row => { const label = row.key === 'unknown' ? 'Unknown' : displayNames?.of(row.key.toUpperCase()) || row.key; return <div key={row.key} className="grid grid-cols-[88px_1fr_42px] items-center gap-2 text-[10px]"><span className="truncate font-semibold text-[#59606b]" title={label}>{label}</span><div className="h-2 overflow-hidden rounded-full bg-[#edf0f4]"><div className="h-full rounded-full bg-[#2563eb]" style={{ width: `${row.percentage}%` }} /></div><span className="text-right font-extrabold text-[#354052]">{row.percentage.toFixed(1)}%</span></div>; })}</div></div>;
}

function ConversionRateChart({ daily }) {
  const rates = daily.map(row => ({ date: row.date, value: Number(row.clicks || 0) ? (Number(row.conversions || 0) / Number(row.clicks)) * 100 : 0 }));
  const max = Math.max(1, ...rates.map(row => row.value));
  const ceiling = Math.ceil(max * 1.2 * 10) / 10;
  const denominator = Math.max(rates.length - 1, 1);
  const pointFor = (row, index) => ({ x: 55 + index * (1085 / denominator), y: 138 - (row.value / ceiling) * 92 });
  const points = rates.map((row, index) => { const point = pointFor(row, index); return `${point.x},${point.y}`; }).join(' ');
  const labels = rates.map((_, index) => index).filter(index => index === 0 || index === rates.length - 1 || index % Math.max(1, Math.ceil(rates.length / 6)) === 0);

  return <div className="mt-4 rounded-2xl border border-[#c2c6d3]/25 p-4"><h3 className="text-sm font-extrabold text-[#273548]">Conversion Rate (by Day)</h3><p className="mt-0.5 text-[10px] font-semibold text-[#8a9099]">Conversions ÷ Clicks</p>{rates.length ? <div className="overflow-x-auto"><svg className="mt-2 h-[190px] min-w-[820px] w-full" viewBox="0 0 1200 190" preserveAspectRatio="none" role="img" aria-label="Daily conversion rate">{[46,92,138].map((y, index) => <g key={y}><line x1="55" y1={y} x2="1140" y2={y} stroke="#e7e9ed" strokeDasharray="3 4" /><text x="43" y={y + 4} textAnchor="end" fill="#727782" fontSize="9" fontWeight="600">{((2-index) * ceiling / 2).toFixed(1)}%</text></g>)}<polyline points={points} fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinejoin="round" />{rates.map((row,index) => { const point=pointFor(row,index); return <circle key={row.date} cx={point.x} cy={point.y} r="3" fill="white" stroke="#2563eb" strokeWidth="2" />; })}{labels.map(index => <text key={rates[index].date} x={pointFor(rates[index],index).x} y="170" textAnchor="middle" fill="#727782" fontSize="9" fontWeight="600">{new Date(`${rates[index].date}T00:00:00`).toLocaleDateString('en-GB',{month:'short',day:'numeric'})}</text>)}</svg></div> : <div className="py-10 text-center text-sm text-[#727782]">No daily conversion data.</div>}</div>;
}

export default function AudienceAnalytics({ audience = {}, daily = [] }) {
  const ageRows = mergeRows(audience.age || [], key => ['55-64', '65+'].includes(key) ? '55+' : key);
  const genderRows = mergeRows(audience.gender || [], key => key === 'female' ? 'Female' : key === 'male' ? 'Male' : 'Other');
  const deviceRows = mergeRows(audience.devices || [], key => key.includes('tablet') || key === 'ipad' ? 'Tablet' : key.includes('smartphone') || ['iphone','ipod'].includes(key) ? 'Mobile' : key === 'desktop' ? 'Desktop' : 'Other');

  return <section className="mt-6 rounded-3xl border border-[#c2c6d3]/30 bg-white p-5 shadow-sm sm:p-6"><div><h2 className="text-lg font-extrabold text-[#191c1d]">Audience Analytics</h2><p className="mt-1 text-xs font-semibold text-[#727782]">Meta Ads audience breakdown for the selected month</p></div><div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4"><DonutCard title="Age Group" rows={ageRows} /><DonutCard title="Gender" rows={genderRows} /><LocationCard rows={audience.countries || []} /><DonutCard title="Device" rows={deviceRows} /></div><ConversionRateChart daily={daily} /></section>;
}
