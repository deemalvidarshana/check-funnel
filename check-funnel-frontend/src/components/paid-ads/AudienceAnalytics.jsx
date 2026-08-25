import { useMemo, useState } from 'react';

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

const conversionRateSeries = [
  { key: 'reachRate', label: 'Reach-to-Conversion Rate', formula: 'Conversions ÷ Reach', color: '#2563eb', numerator: 'conversions', denominator: 'reach' },
  { key: 'leadRate', label: 'Lead Conversion Rate', formula: 'Leads ÷ Landing Page Views', color: '#8b5cf6', numerator: 'leads', denominator: 'landingPageViews' },
  { key: 'purchaseRate', label: 'Purchase Conversion Rate', formula: 'Purchases ÷ Landing Page Views', color: '#22b982', numerator: 'purchases', denominator: 'landingPageViews' },
];

function rateValue(numerator, denominator) {
  return Number(denominator || 0) > 0 ? (Number(numerator || 0) / Number(denominator)) * 100 : 0;
}

function rateRows(rows) {
  return rows.map((row) => ({
    ...row,
    ...Object.fromEntries(conversionRateSeries.map((series) => [series.key, rateValue(row[series.numerator], row[series.denominator])])),
  }));
}

function rateSummary(rows, series) {
  const numerator = rows.reduce((sum, row) => sum + Number(row[series.numerator] || 0), 0);
  const denominator = rows.reduce((sum, row) => sum + Number(row[series.denominator] || 0), 0);
  return rateValue(numerator, denominator);
}

function ConversionRateChart({ daily, previousDaily }) {
  const currentRows = rateRows(daily);
  const comparisonRows = rateRows(previousDaily);
  const [visibleMetrics, setVisibleMetrics] = useState(() => new Set(conversionRateSeries.map((series) => series.key)));
  const [visiblePeriods, setVisiblePeriods] = useState(() => new Set(['current', 'previous']));
  const [hover, setHover] = useState(null);
  const summaries = conversionRateSeries.map((series) => {
    const current = rateSummary(daily, series);
    const previous = rateSummary(previousDaily, series);
    const change = previous > 0 ? ((current - previous) / previous) * 100 : null;
    return { ...series, current, previous, change };
  });
  const visibleValues = [...currentRows, ...comparisonRows].flatMap((row) => conversionRateSeries.filter((series) => visibleMetrics.has(series.key)).map((series) => Number(row[series.key] || 0)));
  const ceiling = Math.max(1, Math.ceil(Math.max(0, ...visibleValues) * 1.15));
  const baseRows = currentRows.length ? currentRows : comparisonRows;
  const labelStep = Math.max(1, Math.ceil(baseRows.length / 7));
  const labelIndexes = baseRows.map((_, index) => index).filter((index) => index === 0 || index === baseRows.length - 1 || index % labelStep === 0);
  const point = (row, index, rows, key) => ({ x: 65 + index * (1065 / Math.max(rows.length - 1, 1)), y: 245 - (Number(row[key] || 0) / ceiling) * 190 });
  const points = (rows, key) => rows.map((row, index) => { const value = point(row, index, rows, key); return `${value.x},${value.y}`; }).join(' ');
  const toggle = (setter, key) => setter((current) => { const next = new Set(current); if (next.has(key)) next.delete(key); else next.add(key); return next; });
  const currentHoverRow = hover ? currentRows[hover.currentIndex] : null;
  const previousHoverRow = hover ? comparisonRows[hover.previousIndex] : null;

  return <div className="mt-4 rounded-2xl border border-[#c2c6d3]/25 p-4 sm:p-5">
    <div><h3 className="text-base font-extrabold text-[#273548]">Conversion Performance</h3><p className="mt-1 text-[10px] font-semibold text-[#8a9099]">Daily conversion efficiency across reach, leads, and purchases</p></div>
    <div className="mt-4 grid gap-3 md:grid-cols-3">
      {summaries.map((series) => <div key={series.key} className="rounded-2xl border border-[#c2c6d3]/25 px-4 py-3.5"><div className="flex items-start justify-between gap-3"><div><p className="text-[11px] font-bold text-[#727782]">{series.label}</p><p className="mt-1 text-[9px] font-semibold text-[#9aa0a9]">{series.formula}</p></div><span className={`text-[10px] font-extrabold ${series.change == null ? 'text-[#8a9099]' : series.change >= 0 ? 'text-green-600' : 'text-red-500'}`}>{series.change == null ? '—' : `${series.change >= 0 ? '+' : ''}${series.change.toFixed(1)}%`}</span></div><p className="mt-2 text-xl font-black" style={{ color: series.color }}>{series.current.toFixed(2)}%</p><p className="mt-1 text-[9px] font-semibold text-[#8a9099]">Previous: {series.previous.toFixed(2)}%</p></div>)}
    </div>
    {(currentRows.length || comparisonRows.length) ? <>
      <div className="mt-5 overflow-x-auto"><div className="relative min-w-[920px]"><svg className="h-[300px] w-full" viewBox="0 0 1200 300" preserveAspectRatio="none" role="img" aria-label="Daily conversion performance rates">
        {[55, 102.5, 150, 197.5, 245].map((y, index) => <g key={y}><line x1="65" y1={y} x2="1130" y2={y} stroke="#e7e9ed" strokeDasharray="3 4"/><text x="52" y={y + 4} textAnchor="end" fill="#727782" fontSize="9" fontWeight="600">{(ceiling * (4 - index) / 4).toFixed(1)}%</text></g>)}
        {conversionRateSeries.map((series) => visibleMetrics.has(series.key) && <g key={series.key}>{visiblePeriods.has('previous') && <polyline points={points(comparisonRows, series.key)} fill="none" stroke={series.color} strokeOpacity=".3" strokeWidth="1.8" strokeDasharray="6 5"/>}{visiblePeriods.has('current') && <><polyline points={points(currentRows, series.key)} fill="none" stroke={series.color} strokeWidth="2.6" strokeLinejoin="round"/>{currentRows.map((row, index) => { const value = point(row, index, currentRows, series.key); return index % Math.max(1, Math.ceil(currentRows.length / 10)) === 0 ? <circle key={`${series.key}-${row.date}`} cx={value.x} cy={value.y} r="3.2" fill="white" stroke={series.color} strokeWidth="2"/> : null; })}</>}</g>)}
        {hover && <line x1={hover.x} x2={hover.x} y1="55" y2="245" stroke="#727782" strokeOpacity=".45" strokeDasharray="4 4"/>}
        {labelIndexes.map((index) => <text key={baseRows[index].date} x={65 + index * (1065 / Math.max(baseRows.length - 1, 1))} y="273" textAnchor="middle" fill="#727782" fontSize="10" fontWeight="600">{new Date(`${baseRows[index].date}T00:00:00`).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })}</text>)}
        <rect x="65" y="55" width="1065" height="190" fill="transparent" style={{ cursor: 'crosshair' }} onMouseMove={(event) => { const bounds = event.currentTarget.getBoundingClientRect(); const ratio = Math.min(1, Math.max(0, (event.clientX - bounds.left) / bounds.width)); setHover({ x: 65 + ratio * 1065, currentIndex: Math.round(ratio * Math.max(currentRows.length - 1, 0)), previousIndex: Math.round(ratio * Math.max(comparisonRows.length - 1, 0)) }); }} onMouseLeave={() => setHover(null)}/>
      </svg>{hover && <div className="pointer-events-none absolute top-3 z-20 w-72 rounded-2xl border border-[#dfe3e8] bg-white/95 p-3 shadow-xl" style={{ left: `${(hover.x / 1200) * 100}%`, transform: hover.x < 700 ? 'translateX(18px)' : 'translateX(calc(-100% - 18px))' }}><div className="grid grid-cols-[1fr_auto_auto] gap-3 border-b border-[#edf0f2] pb-2 text-[9px] font-bold text-[#8a9099]"><span>Metric</span><span>Current</span><span>Previous</span></div><div className="mt-2 space-y-2">{conversionRateSeries.filter((series) => visibleMetrics.has(series.key)).map((series) => <div key={series.key} className="grid grid-cols-[1fr_auto_auto] items-center gap-3 text-[10px]"><span className="flex items-center gap-2 font-semibold text-[#59606b]"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: series.color }}/>{series.label.replace(' Rate', '')}</span><b>{Number(currentHoverRow?.[series.key] || 0).toFixed(2)}%</b><b className="text-[#8a9099]">{Number(previousHoverRow?.[series.key] || 0).toFixed(2)}%</b></div>)}</div></div>}</div></div>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-x-7 gap-y-3">{conversionRateSeries.map((series) => <button key={series.key} type="button" onClick={() => toggle(setVisibleMetrics, series.key)} className={`flex items-center gap-2 text-xs font-semibold ${visibleMetrics.has(series.key) ? 'text-[#59606b]' : 'text-[#a8adb5] line-through'}`}><span className="h-3 w-3 rounded-full" style={{ backgroundColor: visibleMetrics.has(series.key) ? series.color : '#c9cdd3' }}/>{series.label}</button>)}<button type="button" onClick={() => toggle(setVisiblePeriods, 'current')} className={`flex items-center gap-2 text-xs font-semibold ${visiblePeriods.has('current') ? 'text-[#59606b]' : 'text-[#a8adb5] line-through'}`}><span className="h-0.5 w-7 bg-[#727782]"/>Current</button><button type="button" onClick={() => toggle(setVisiblePeriods, 'previous')} className={`flex items-center gap-2 text-xs font-semibold ${visiblePeriods.has('previous') ? 'text-[#59606b]' : 'text-[#a8adb5] line-through'}`}><span className="w-7 border-t-2 border-dashed border-[#9ca3af]"/>Previous</button></div>
    </> : <div className="py-10 text-center text-sm text-[#727782]">No daily conversion data.</div>}
  </div>;
}

export default function AudienceAnalytics({ audience = {}, daily = [], previousDaily = [] }) {
  const ageRows = mergeRows(audience.age || [], key => ['55-64', '65+'].includes(key) ? '55+' : key);
  const genderRows = mergeRows(audience.gender || [], key => key === 'female' ? 'Female' : key === 'male' ? 'Male' : 'Other');
  const deviceRows = mergeRows(audience.devices || [], key => key.includes('tablet') || key === 'ipad' ? 'Tablet' : key.includes('smartphone') || ['iphone','ipod'].includes(key) ? 'Mobile' : key === 'desktop' ? 'Desktop' : 'Other');

  return <section className="mt-6 rounded-3xl border border-[#c2c6d3]/30 bg-white p-5 shadow-sm sm:p-6"><div><h2 className="text-lg font-extrabold text-[#191c1d]">Audience Analytics</h2><p className="mt-1 text-xs font-semibold text-[#727782]">Meta Ads audience breakdown for the selected month</p></div><div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4"><DonutCard title="Age Group" rows={ageRows} /><DonutCard title="Gender" rows={genderRows} /><LocationCard rows={audience.countries || []} /><DonutCard title="Device" rows={deviceRows} /></div><ConversionRateChart daily={daily} previousDaily={previousDaily} /></section>;
}
