import { useState } from 'react';
import { formatPaidAdsMoney, formatPaidAdsNumber } from '../../utils/paidAdsFormatters';

function dateLabel(value) {
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function points(rows, item, max, valueFor) {
  return rows.map((row, index) => {
    const x = 72 + index * (1020 / Math.max(rows.length - 1, 1));
    const y = 250 - (valueFor(row, item.key) / max) * 190;
    return `${x},${y}`;
  }).join(' ');
}

function displayValue(value, item, currency) {
  if (value == null) return '—';
  if (item.type === 'money') return formatPaidAdsMoney(value, currency);
  if (item.type === 'percent') return `${Number(value || 0).toFixed(2)}%`;
  return formatPaidAdsNumber(value);
}

function dayOffset(date, start) {
  if (!date || !start) return -1;
  return Math.round((new Date(`${date}T00:00:00Z`) - new Date(`${start}T00:00:00Z`)) / 86_400_000);
}

function dateAtOffset(start, offset) {
  const date = new Date(`${start}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().slice(0, 10);
}

function alignByCalendarDay(rows, period, slotCount) {
  const byDate = new Map(rows.map(row => [row.date, row]));
  return Array.from({ length: slotCount }, (_, index) => {
    const date = dateAtOffset(period.since, index);
    return byDate.get(date) || { date };
  });
}

export default function PaidAdsMultiMetricTrend({ series, current, previous, period, comparisonPeriod, valueFor, currency }) {
  const [visible, setVisible] = useState(() => new Set(series.map(item => item.key)));
  const [hover, setHover] = useState(null);
  const currentElapsedDays = current.reduce((max, row) => Math.max(max, dayOffset(row.date, period.since) + 1), 0);
  const previousElapsedDays = previous.reduce((max, row) => Math.max(max, dayOffset(row.date, comparisonPeriod.since) + 1), 0);
  const slotCount = Math.max(1, currentElapsedDays || previousElapsedDays);
  const alignedCurrent = alignByCalendarDay(current, period, slotCount);
  const alignedPrevious = alignByCalendarDay(previous, comparisonPeriod, slotCount);
  const hasCurrent = current.length > 0;
  const hasPrevious = previous.length > 0;
  const rows = hasCurrent ? alignedCurrent : alignedPrevious;
  const labelIndexes = [...new Set([0, Math.floor((rows.length - 1) / 2), rows.length - 1])].filter(index => index >= 0);
  const maxByKey = Object.fromEntries(series.map(item => [item.key, Math.max(1, ...alignedCurrent.map(row => valueFor(row, item.key)), ...alignedPrevious.map(row => valueFor(row, item.key)))]));
  const toggle = key => setVisible(existing => {
    const next = new Set(existing);
    if (next.has(key)) next.delete(key); else next.add(key);
    return next;
  });

  return <>
    {(hasCurrent || hasPrevious) ? <div className="mt-5 overflow-x-auto rounded-2xl border border-[#c2c6d3]/20 bg-[#fbfcfd] p-3">
      <div className="relative min-w-[1050px]">
        <div className="px-4 pt-2"><h3 className="text-sm font-extrabold text-[#273548]">All metrics daily trend</h3><p className="mt-1 text-[10px] font-semibold text-[#8a9099]">Each metric is normalized to its own peak so every journey line remains visible.</p></div>
        <svg className="h-[320px] w-full" viewBox="0 0 1200 320" preserveAspectRatio="none" role="img" aria-label="All metrics daily performance trend">
          {[60,107.5,155,202.5,250].map((y, index) => <g key={y}><line x1="72" y1={y} x2="1092" y2={y} stroke="#e5e9ee" strokeDasharray="4 5"/><text x="60" y={y + 4} textAnchor="end" fill="#8a9099" fontSize="9" fontWeight="700">{100 - index * 25}%</text></g>)}
          {series.map(item => visible.has(item.key) && <g key={item.key}>
            {hasPrevious && <polyline points={points(alignedPrevious, item, maxByKey[item.key], valueFor)} fill="none" stroke={item.color} strokeOpacity=".28" strokeWidth="1.8" strokeDasharray="7 6" />}
            {hasCurrent && <polyline points={points(alignedCurrent, item, maxByKey[item.key], valueFor)} fill="none" stroke={item.color} strokeWidth="2.5" strokeLinejoin="round" />}
          </g>)}
          {hover && <line x1={hover.x} x2={hover.x} y1="60" y2="250" stroke="#727782" strokeOpacity=".45" strokeWidth="1" strokeDasharray="4 4" />}
          {labelIndexes.map(index => <text key={rows[index]?.date} x={72 + index * (1020 / Math.max(rows.length - 1, 1))} y="283" textAnchor="middle" fill="#727782" fontSize="10" fontWeight="700">{dateLabel(rows[index]?.date)}</text>)}
          <rect x="72" y="60" width="1020" height="190" fill="transparent" style={{ cursor: 'crosshair' }} onMouseMove={event => { const bounds = event.currentTarget.getBoundingClientRect(); const ratio = Math.min(1, Math.max(0, (event.clientX - bounds.left) / bounds.width)); const index = Math.round(ratio * Math.max(rows.length - 1, 0)); setHover({ x: 72 + ratio * 1020, currentIndex: index, previousIndex: index }); }} onMouseLeave={() => setHover(null)} />
        </svg>
        {hover && <div className="pointer-events-none absolute top-16 z-20 min-w-[330px] rounded-2xl border border-[#dfe3e8] bg-white/95 p-4 shadow-xl backdrop-blur" style={{ left: `${(hover.x / 1200) * 100}%`, transform: hover.x > 650 ? 'translateX(calc(-100% - 18px))' : 'translateX(18px)' }}>
          <div className="grid grid-cols-[minmax(110px,1fr)_auto_auto] gap-x-4 border-b border-[#edf0f2] pb-2 text-[9px] font-bold text-[#8a9099]"><span>Metric</span><span className="text-right">{dateLabel(alignedCurrent[hover.currentIndex].date)}</span>{hasPrevious && <span className="text-right">{dateLabel(alignedPrevious[hover.previousIndex].date)}</span>}</div>
          <div className="mt-2 space-y-2">{series.filter(item => visible.has(item.key)).map(item => <div key={item.key} className="grid grid-cols-[minmax(110px,1fr)_auto_auto] items-center gap-x-4 text-[10px]"><span className="flex min-w-0 items-center gap-2 font-semibold text-[#59606b]"><span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} /><span className="truncate">{item.label}</span></span><span className="text-right font-extrabold text-[#273548]">{hasCurrent ? displayValue(valueFor(alignedCurrent[hover.currentIndex], item.key), item, currency) : '—'}</span>{hasPrevious && <span className="text-right font-bold text-[#8a9099]">{displayValue(valueFor(alignedPrevious[hover.previousIndex], item.key), item, currency)}</span>}</div>)}</div>
        </div>}
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-3 px-4 pb-3">
          {series.map(item => <button key={item.key} type="button" onClick={() => toggle(item.key)} aria-pressed={visible.has(item.key)} className={`flex items-center gap-2 text-[11px] font-bold transition ${visible.has(item.key) ? 'text-[#59606b]' : 'text-[#a8adb5] line-through'}`}><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: visible.has(item.key) ? item.color : '#c9cdd3' }} />{item.label}</button>)}
          <span className="flex items-center gap-2 text-[11px] font-bold text-[#59606b]"><span className="h-0.5 w-7 bg-[#727782]" />Current · {period.label}</span>
          {hasPrevious && <span className="flex items-center gap-2 text-[11px] font-bold text-[#8a9099]"><span className="w-7 border-t-2 border-dashed border-[#9ca3af]" />Previous · {comparisonPeriod.label}</span>}
        </div>
      </div>
    </div> : <div className="mt-5 rounded-2xl bg-[#f8f9fa] py-12 text-center text-sm font-bold text-[#727782]">No daily performance data for this period.</div>}
  </>;
}
