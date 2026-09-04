import { useState } from 'react';
import { formatPaidAdsMoney, formatPaidAdsNumber } from '../../utils/paidAdsFormatters';

const series = [
  { key: 'purchaseValue', label: 'Revenue', color: '#10b981', type: 'money' },
  { key: 'purchases', label: 'Purchases', color: '#059669', type: 'number' },
  { key: 'addToCart', label: 'Adds to cart', color: '#8b5cf6', type: 'number' },
  { key: 'initiateCheckout', label: 'Checkouts', color: '#f59e0b', type: 'number' },
  { key: 'spend', label: 'Spend', color: '#2563eb', type: 'money' },
];

function points(rows, key, max) {
  return rows.map((row, index) => `${72 + index * (1020 / Math.max(rows.length - 1, 1))},${245 - (Number(row[key] || 0) / max) * 185}`).join(' ');
}

function display(value, config, currency) {
  return config.type === 'money' ? formatPaidAdsMoney(value, currency) : formatPaidAdsNumber(value);
}

function dateLabel(value) {
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export default function PaidAdsEcommerceTrend({ data }) {
  const [metricKey, setMetricKey] = useState('purchaseValue');
  const [comparison, setComparison] = useState(true);
  const [hoverIndex, setHoverIndex] = useState(null);
  const current = data.daily || [];
  const previous = comparison ? (data.previousDaily || []) : [];
  const config = series.find(item => item.key === metricKey) || series[0];
  const max = Math.max(1, ...current.map(row => Number(row[metricKey] || 0)), ...previous.map(row => Number(row[metricKey] || 0)));
  const labels = current.length ? current : previous;
  const labelIndexes = [...new Set([0, Math.floor((labels.length - 1) / 2), labels.length - 1])].filter(index => index >= 0);
  const currentRow = hoverIndex == null ? null : current[Math.min(hoverIndex, Math.max(current.length - 1, 0))];
  const previousRow = hoverIndex == null ? null : previous[Math.min(hoverIndex, Math.max(previous.length - 1, 0))];

  return <section className="mt-6 rounded-3xl border border-[#c2c6d3]/30 bg-white p-5 shadow-sm sm:p-6">
    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between"><div><h2 className="text-lg font-extrabold text-[#191c1d]">Ecommerce performance trend</h2><p className="mt-1 text-xs font-semibold text-[#727782]">Daily sales journey performance with previous-period comparison.</p></div><button type="button" onClick={() => setComparison(value => !value)} className="h-10 w-fit rounded-full border border-[#c2c6d3]/30 bg-[#f8f9fa] px-5 text-xs font-bold text-[#003870] shadow-sm">{comparison ? 'Comparison' : 'Current period only'}</button></div>
    <div className="mt-5 flex flex-wrap gap-2">{series.map(item => <button key={item.key} type="button" onClick={() => setMetricKey(item.key)} className={`rounded-full px-4 py-2 text-xs font-bold transition ${metricKey === item.key ? 'text-white shadow-sm' : 'bg-[#f3f4f5] text-[#727782]'}`} style={metricKey === item.key ? { backgroundColor: item.color } : undefined}>{item.label}</button>)}</div>
    {(current.length || previous.length) ? <div className="mt-5 overflow-x-auto rounded-2xl border border-[#c2c6d3]/20 bg-[#fbfcfd] p-3"><div className="relative min-w-[900px]"><svg className="h-[310px] w-full" viewBox="0 0 1200 310" preserveAspectRatio="none" role="img" aria-label={`${config.label} daily ecommerce performance`}>
      {[60,106,152,198,245].map((y, index) => <g key={y}><line x1="72" y1={y} x2="1092" y2={y} stroke="#e5e9ee" strokeDasharray="4 5"/><text x="60" y={y + 4} textAnchor="end" fill="#8a9099" fontSize="9" fontWeight="700">{display(max * (4 - index) / 4, config, data.account.currency)}</text></g>)}
      {previous.length > 0 && <polyline points={points(previous, metricKey, max)} fill="none" stroke={config.color} strokeOpacity=".3" strokeWidth="2" strokeDasharray="7 6"/>}
      {current.length > 0 && <polyline points={points(current, metricKey, max)} fill="none" stroke={config.color} strokeWidth="3" strokeLinejoin="round"/>}
      {current.map((row, index) => index % Math.max(1, Math.ceil(current.length / 12)) === 0 ? <circle key={row.date} cx={72 + index * (1020 / Math.max(current.length - 1, 1))} cy={245 - (Number(row[metricKey] || 0) / max) * 185} r="4" fill="white" stroke={config.color} strokeWidth="2.5"/> : null)}
      {labelIndexes.map(index => <text key={labels[index]?.date} x={72 + index * (1020 / Math.max(labels.length - 1, 1))} y="279" textAnchor="middle" fill="#727782" fontSize="10" fontWeight="700">{dateLabel(labels[index]?.date)}</text>)}
      <rect x="72" y="60" width="1020" height="185" fill="transparent" style={{ cursor: 'crosshair' }} onMouseMove={event => { const bounds = event.currentTarget.getBoundingClientRect(); const ratio = Math.min(1, Math.max(0, (event.clientX - bounds.left) / bounds.width)); setHoverIndex(Math.round(ratio * Math.max(labels.length - 1, 0))); }} onMouseLeave={() => setHoverIndex(null)}/>
    </svg>{hoverIndex != null && <div className="pointer-events-none absolute right-5 top-4 min-w-60 rounded-2xl border border-[#dfe3e8] bg-white/95 p-4 text-xs shadow-xl"><p className="font-extrabold text-[#273548]">{config.label}</p><div className="mt-2 flex justify-between gap-6"><span className="text-[#727782]">Current {currentRow?.date ? `· ${dateLabel(currentRow.date)}` : ''}</span><b>{display(currentRow?.[metricKey] || 0, config, data.account.currency)}</b></div>{comparison && <div className="mt-1 flex justify-between gap-6"><span className="text-[#8a9099]">Previous {previousRow?.date ? `· ${dateLabel(previousRow.date)}` : ''}</span><b className="text-[#8a9099]">{display(previousRow?.[metricKey] || 0, config, data.account.currency)}</b></div>}</div>}</div></div> : <div className="mt-5 rounded-2xl bg-[#f8f9fa] py-12 text-center text-sm font-bold text-[#727782]">No daily ecommerce ad data for this period.</div>}
    <div className="mt-3 flex flex-wrap justify-center gap-6 text-xs font-semibold text-[#727782]"><span className="flex items-center gap-2"><span className="h-0.5 w-7" style={{ backgroundColor: config.color }}/>Current · {data.period.label}</span>{comparison && <span className="flex items-center gap-2"><span className="w-7 border-t-2 border-dashed" style={{ borderColor: config.color }}/>Previous · {data.comparisonPeriod.label}</span>}</div>
  </section>;
}
