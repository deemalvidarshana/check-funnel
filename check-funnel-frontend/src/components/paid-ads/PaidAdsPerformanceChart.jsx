import { useState } from 'react';
import { formatPaidAdsChange, formatPaidAdsMoney, formatPaidAdsNumber } from '../../utils/paidAdsFormatters';

const seriesConfig = [
  { key: 'spend', label: 'Spend', color: '#2563eb' },
  { key: 'reach', label: 'Reach', color: '#06b6d4' },
  { key: 'impressions', label: 'Impressions', color: '#8b5cf6' },
  { key: 'clicks', label: 'Clicks', color: '#22b982' },
  { key: 'conversions', label: 'Conversions', color: '#ff536b' },
];

function points(rows, key, max, count) {
  if (!rows.length) return '';
  const denominator = Math.max(count - 1, 1);
  return rows.map((row, index) => `${58 + index * (952 / denominator)},${278 - (Number(row[key] || 0) / max) * 226}`).join(' ');
}

function compact(value) {
  const number = Number(value || 0);
  if (number >= 1_000_000) return `${(number / 1_000_000).toFixed(1)}M`;
  if (number >= 1000) return `${(number / 1000).toFixed(number >= 10_000 ? 0 : 1)}K`;
  return formatPaidAdsNumber(number);
}

function formatAxisMoney(value, currency) {
  return new Intl.NumberFormat('en', {
    style: 'currency',
    currency,
    currencyDisplay: currency === 'LKR' ? 'code' : 'symbol',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function tooltipValue(key, value, currency) {
  if (value == null) return '—';
  return key === 'spend' ? formatPaidAdsMoney(value, currency) : formatPaidAdsNumber(value);
}

function tooltipDate(row, fallbackPeriod, index) {
  const date = row?.date || (() => {
    const value = new Date(`${fallbackPeriod.since}T00:00:00`);
    value.setDate(value.getDate() + index);
    return value.toISOString().slice(0, 10);
  })();
  return new Date(`${date}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function ChartTooltip({ hover, daily, previousDaily, period, comparisonPeriod, currency, visibleMetrics, visiblePeriods }) {
  if (!hover) return null;
  const currentRow = daily[hover.index];
  const previousRow = previousDaily[hover.index];
  const showCurrent = visiblePeriods.has('current');
  const showPrevious = visiblePeriods.has('previous');
  const metrics = seriesConfig.filter(series => visibleMetrics.has(series.key));
  if (!metrics.length || (!showCurrent && !showPrevious)) return null;
  const transform = hover.x <= 700 ? 'translateX(24px)' : 'translateX(calc(-100% - 24px))';

  return (
    <div className="pointer-events-none absolute top-4 z-20 w-[300px] rounded-2xl border border-[#dfe3e8] bg-white/95 p-4 shadow-xl backdrop-blur" style={{ left: `${(hover.x / 1200) * 100}%`, transform }}>
      <div className="grid grid-cols-[1fr_auto_auto] items-end gap-x-3 border-b border-[#edf0f2] pb-2 text-[9px] font-bold text-[#8a9099]">
        <span>Metric</span>
        {showCurrent && <span className="text-right">{tooltipDate(currentRow, period, hover.index)}</span>}
        {showPrevious && <span className="text-right">{tooltipDate(previousRow, comparisonPeriod, hover.index)}</span>}
      </div>
      <div className="mt-2 space-y-2">
        {metrics.map(series => <div key={series.key} className="grid grid-cols-[1fr_auto_auto] items-center gap-x-3 text-[10px]"><span className="flex min-w-0 items-center gap-2 font-semibold text-[#59606b]"><span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: series.color }} />{series.label}</span>{showCurrent && <span className="text-right font-extrabold text-[#273548]">{tooltipValue(series.key, currentRow?.[series.key], currency)}</span>}{showPrevious && <span className="text-right font-bold text-[#8a9099]">{tooltipValue(series.key, previousRow?.[series.key], currency)}</span>}</div>)}
      </div>
    </div>
  );
}

function MonthlyComparisonBars({ totals, account, period, comparisonPeriod }) {
  return (
    <div className="mt-6 rounded-2xl border border-[#c2c6d3]/25 bg-[#fbfcfd] p-5 sm:p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div><h3 className="text-sm font-extrabold text-[#273548]">Monthly Metrics Comparison</h3><p className="mt-1 text-[10px] font-semibold text-[#8a9099]">{period.label} compared with {comparisonPeriod.label}</p></div>
        <div className="flex items-center gap-4 text-[10px] font-bold text-[#727782]"><span className="flex items-center gap-2"><span className="h-3 w-3 rounded-sm bg-[#2563eb]" />{period.label}</span><span className="flex items-center gap-2"><span className="h-3 w-3 rounded-sm bg-[#cfd5de]" />{comparisonPeriod.label}</span></div>
      </div>
      <div className="overflow-x-auto">
        <div className="relative min-w-[900px] pl-12">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[240px]"><div className="absolute left-0 top-0 text-[9px] font-bold text-[#8a9099]">100%</div><div className="absolute left-1 top-1/2 -translate-y-1/2 text-[9px] font-bold text-[#8a9099]">50%</div><div className="absolute bottom-0 left-2 text-[9px] font-bold text-[#8a9099]">0%</div><div className="absolute left-10 right-0 top-1 border-t border-dashed border-[#e4e8ed]" /><div className="absolute left-10 right-0 top-1/2 border-t border-dashed border-[#e4e8ed]" /><div className="absolute bottom-1 left-10 right-0 border-t border-[#dfe3e8]" /></div>
          <div className="grid h-[300px] grid-cols-5 gap-5">
            {seriesConfig.map(series => {
              const current = Number(totals[series.key]?.current || 0);
              const previous = Number(totals[series.key]?.previous || 0);
              const max = Math.max(current, previous, 1);
              const currentHeight = current ? Math.max(3, (current / max) * 82) : 0;
              const previousHeight = previous ? Math.max(3, (previous / max) * 82) : 0;
              const exact = value => series.key === 'spend' ? formatPaidAdsMoney(value, account.currency) : formatPaidAdsNumber(value);
              const short = value => series.key === 'spend' ? `${account.currency} ${compact(value)}` : compact(value);
              return <div key={series.key} className="flex min-w-0 flex-col"><div className="flex h-[240px] items-end justify-center gap-3"><div className="flex h-full w-12 flex-col items-center justify-end"><span className="mb-1 whitespace-nowrap text-[9px] font-extrabold text-[#273548]" title={exact(current)}>{short(current)}</span><div className="w-10 rounded-t-lg transition-all duration-500" style={{ height: `${currentHeight}%`, backgroundColor: series.color }} /></div><div className="flex h-full w-12 flex-col items-center justify-end"><span className="mb-1 whitespace-nowrap text-[9px] font-bold text-[#8a9099]" title={exact(previous)}>{short(previous)}</span><div className="w-10 rounded-t-lg bg-[#cfd5de] transition-all duration-500" style={{ height: `${previousHeight}%` }} /></div></div><div className="mt-3 text-center"><div className="flex items-center justify-center gap-2 text-xs font-extrabold text-[#354052]"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: series.color }} />{series.label}</div><p className={`mt-1 text-[10px] font-extrabold ${(totals[series.key]?.change || 0) >= 0 ? 'text-green-600' : 'text-red-500'}`}>{formatPaidAdsChange(totals[series.key]?.change)}</p></div></div>;
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaidAdsPerformanceChart({ data }) {
  const [visibleMetrics, setVisibleMetrics] = useState(() => new Set(seriesConfig.map(series => series.key)));
  const [visiblePeriods, setVisiblePeriods] = useState(() => new Set(['current', 'previous']));
  const [hover, setHover] = useState(null);
  const [chartView, setChartView] = useState(0);
  const { daily = [], previousDaily = [], totals, account, period, comparisonPeriod } = data;
  const count = Math.max(daily.length, previousDaily.length, 1);
  const maxByKey = Object.fromEntries(seriesConfig.map(({ key }) => [key, Math.max(1, ...daily.map((row) => Number(row[key] || 0)), ...previousDaily.map((row) => Number(row[key] || 0)))]));
  const labelStep = Math.max(1, Math.ceil(daily.length / 8));
  const labelIndexes = daily.map((_, index) => index).filter(index => index === 0 || index % labelStep === 0);
  const toggleMetric = key => setVisibleMetrics(current => {
    const next = new Set(current);
    if (next.has(key)) next.delete(key); else next.add(key);
    return next;
  });
  const togglePeriod = key => setVisiblePeriods(current => {
    const next = new Set(current);
    if (next.has(key)) next.delete(key); else next.add(key);
    return next;
  });
  const handleChartHover = event => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (event.clientX - bounds.left) / bounds.width));
    const index = Math.round(ratio * Math.max(count - 1, 0));
    setHover({ index, x: 58 + index * (952 / Math.max(count - 1, 1)) });
  };

  return (
    <section className="mt-6 rounded-3xl border border-[#c2c6d3]/30 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div><h2 className="text-lg font-extrabold text-[#191c1d]">Campaign Performance</h2><p className="mt-1 text-xs font-semibold text-[#727782]">Meta account: {account.name}</p></div>
        <div className="flex items-center gap-2"><div className="rounded-xl border border-[#003870]/20 bg-[#003870]/5 px-4 py-3 text-xs font-bold text-[#003870]">{period.label} vs {comparisonPeriod.label}</div><button type="button" onClick={() => setChartView(view => view === 0 ? 1 : 0)} className="rounded-full p-2 text-[#727782] transition hover:bg-[#f3f4f5] hover:text-[#003870]" aria-label="Previous chart view"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6" /></svg></button><button type="button" onClick={() => setChartView(view => view === 0 ? 1 : 0)} className="rounded-full p-2 text-[#727782] transition hover:bg-[#f3f4f5] hover:text-[#003870]" aria-label="Next chart view"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg></button></div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {seriesConfig.map((series) => {
          const metric = totals[series.key];
          return <div key={series.key} className="rounded-2xl border border-[#c2c6d3]/25 px-5 py-3.5"><div className="flex justify-between gap-3"><p className="text-[11px] font-bold text-[#727782]">{series.label}</p><span className={`text-[10px] font-extrabold ${(metric.change || 0) >= 0 ? 'text-green-600' : 'text-red-500'}`}>{formatPaidAdsChange(metric.change)}</span></div><p className="mt-0.5 text-lg font-black" style={{ color: series.color }}>{series.key === 'spend' ? formatPaidAdsMoney(metric.current, account.currency) : formatPaidAdsNumber(metric.current)}</p><p className="mt-0.5 text-[9px] font-semibold text-[#8a9099]">Previous: {series.key === 'spend' ? formatPaidAdsMoney(metric.previous, account.currency) : formatPaidAdsNumber(metric.previous)}</p></div>;
        })}
      </div>

      {chartView === 0 ? (daily.length ? <div className="mt-5">
        <div className="overflow-x-auto"><div className="relative min-w-[1120px]"><svg className="h-[330px] w-full" viewBox="0 0 1200 330" preserveAspectRatio="none" role="img" aria-label="Meta Ads daily performance chart">
          <rect x="1018" y="25" width="177" height="260" rx="10" fill="#fafbfc" />
          {[52, 108, 165, 221, 278].map((y) => <line key={y} x1="58" y1={y} x2="1010" y2={y} stroke="#e7e9ed" strokeDasharray="3 4" />)}
          <line x1="58" y1="42" x2="58" y2="278" stroke="#dfe3e8" /><line x1="1010" y1="42" x2="1010" y2="278" stroke="#dfe3e8" />
          {seriesConfig.map((series) => visibleMetrics.has(series.key) && <g key={series.key}>{visiblePeriods.has('previous') && <polyline points={points(previousDaily, series.key, maxByKey[series.key], count)} fill="none" stroke={series.color} strokeOpacity=".3" strokeWidth="1.8" strokeDasharray="6 5" />}{visiblePeriods.has('current') && <><polyline points={points(daily, series.key, maxByKey[series.key], count)} fill="none" stroke={series.color} strokeWidth="2.5" strokeLinejoin="round" />{daily.map((row, index) => index % 3 === 0 && <circle key={row.date} cx={58 + index * (952 / Math.max(count - 1, 1))} cy={278 - (Number(row[series.key] || 0) / maxByKey[series.key]) * 226} r="3.2" fill="white" stroke={series.color} strokeWidth="2" />)}</>}</g>)}
          {hover && <line x1={hover.x} x2={hover.x} y1="42" y2="278" stroke="#727782" strokeOpacity=".45" strokeWidth="1" strokeDasharray="4 4" />}
          {labelIndexes.map((index) => <text key={daily[index].date} x={58 + index * (952 / Math.max(count - 1, 1))} y="306" textAnchor="middle" fill="#727782" fontSize="10" fontWeight="600">{new Date(`${daily[index].date}T00:00:00`).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })}</text>)}
          {[1, .75, .5, .25, 0].map((ratio) => <text key={ratio} x="55" y={56 + (1 - ratio) * 224} textAnchor="end" fill="#2563eb" opacity={visibleMetrics.has('spend') ? 1 : .2} fontSize="9" fontWeight="700">{formatAxisMoney(maxByKey.spend * ratio, account.currency)}</text>)}
          {[1, .75, .5, .25, 0].map((ratio) => <text key={ratio} x="1038" y={56 + (1 - ratio) * 224} textAnchor="middle" fill="#06b6d4" opacity={visibleMetrics.has('reach') ? 1 : .2} fontSize="9" fontWeight="700">{compact(maxByKey.reach * ratio)}</text>)}
          {[1, .75, .5, .25, 0].map((ratio) => <text key={ratio} x="1088" y={56 + (1 - ratio) * 224} textAnchor="middle" fill="#8b5cf6" opacity={visibleMetrics.has('impressions') ? 1 : .2} fontSize="9" fontWeight="700">{compact(maxByKey.impressions * ratio)}</text>)}
          {[1, .75, .5, .25, 0].map((ratio) => <text key={ratio} x="1140" y={56 + (1 - ratio) * 224} textAnchor="middle" fill="#22b982" opacity={visibleMetrics.has('clicks') ? 1 : .2} fontSize="9" fontWeight="700">{compact(maxByKey.clicks * ratio)}</text>)}
          {[1, .75, .5, .25, 0].map((ratio) => <text key={ratio} x="1195" y={56 + (1 - ratio) * 224} textAnchor="end" fill="#ff536b" opacity={visibleMetrics.has('conversions') ? 1 : .2} fontSize="10" fontWeight="700">{compact(maxByKey.conversions * ratio)}</text>)}
          <rect x="58" y="42" width="952" height="236" fill="transparent" onMouseMove={handleChartHover} onMouseLeave={() => setHover(null)} style={{ cursor: 'crosshair' }} />
        </svg><ChartTooltip hover={hover} daily={daily} previousDaily={previousDaily} period={period} comparisonPeriod={comparisonPeriod} currency={account.currency} visibleMetrics={visibleMetrics} visiblePeriods={visiblePeriods} /></div></div>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-x-7 gap-y-3">
          {seriesConfig.map(series => { const active = visibleMetrics.has(series.key); return <button key={series.key} type="button" aria-pressed={active} onClick={() => toggleMetric(series.key)} className={`flex items-center gap-2 text-xs font-semibold transition ${active ? 'text-[#59606b]' : 'text-[#a8adb5] line-through'}`}><span className="h-3 w-3 rounded-full transition" style={{ backgroundColor: active ? series.color : '#c9cdd3' }} />{series.label}</button>; })}
          <button type="button" aria-pressed={visiblePeriods.has('current')} onClick={() => togglePeriod('current')} className={`flex items-center gap-2 text-xs font-semibold transition ${visiblePeriods.has('current') ? 'text-[#59606b]' : 'text-[#a8adb5] line-through'}`}><span className={`h-0.5 w-7 ${visiblePeriods.has('current') ? 'bg-[#727782]' : 'bg-[#c9cdd3]'}`} />Current</button>
          <button type="button" aria-pressed={visiblePeriods.has('previous')} onClick={() => togglePeriod('previous')} className={`flex items-center gap-2 text-xs font-semibold transition ${visiblePeriods.has('previous') ? 'text-[#59606b]' : 'text-[#a8adb5] line-through'}`}><span className={`w-7 border-t-2 border-dashed ${visiblePeriods.has('previous') ? 'border-[#9ca3af]' : 'border-[#c9cdd3]'}`} />Previous</button>
        </div>
      </div> : <div className="mt-6 rounded-2xl bg-[#f8f9fa] p-12 text-center text-sm font-bold text-[#727782]">No daily Meta Ads data for this month.</div>) : <MonthlyComparisonBars totals={totals} account={account} period={period} comparisonPeriod={comparisonPeriod} />}
    </section>
  );
}
