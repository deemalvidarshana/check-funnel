import { useState } from 'react';
import { formatPaidAdsMoney, formatPaidAdsNumber } from '../../utils/paidAdsFormatters';
import { PerformanceDropdown, RangeSelector } from './PaidAdsPerformanceChart';
import PaidAdsMultiMetricTrend from './PaidAdsMultiMetricTrend';
import PaidAdsBrandEnquiryMonthlyComparison, { PaidAdsMonthSelector } from './PaidAdsBrandEnquiryMonthlyComparison';
import { defaultComparisonMonths } from '../../utils/paidAdsMonthComparison';

const series = [
  { key: 'spend', label: 'Spend', color: '#2563eb', type: 'money' },
  { key: 'reach', label: 'Reach', color: '#06b6d4', type: 'number' },
  { key: 'postEngagements', label: 'Engagements', color: '#8b5cf6', type: 'number' },
  { key: 'videoViews', label: 'Video views', color: '#f97316', type: 'number' },
  { key: 'landingPageViews', label: 'Landing views', color: '#0ea5e9', type: 'number' },
  { key: 'leads', label: 'Leads', color: '#10b981', type: 'number' },
  { key: 'messagingConversations', label: 'Messages', color: '#14b8a6', type: 'number' },
];

function linePoints(rows, key, max) {
  return rows.map((row, index) => `${72 + index * (1020 / Math.max(rows.length - 1, 1))},${245 - (Number(row[key] || 0) / max) * 185}`).join(' ');
}

function compact(value, type, currency) {
  if (type === 'money') return formatPaidAdsMoney(value, currency);
  const number = Number(value || 0);
  if (number >= 1_000_000) return `${(number / 1_000_000).toFixed(1)}M`;
  if (number >= 1000) return `${(number / 1000).toFixed(number >= 10_000 ? 0 : 1)}K`;
  return formatPaidAdsNumber(number);
}

function dateLabel(value) {
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function metricValue(row, key) {
  return Number(row?.[key] || 0);
}

function Chevron({ direction }) {
  const points = direction === 'left' ? '15 18 9 12 15 6' : '9 18 15 12 9 6';
  return <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points={points} strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function barLabel(value, type, currency) {
  const number = Number(value || 0);
  if (type === 'money') {
    if (number >= 1_000_000) return `${currency} ${(number / 1_000_000).toFixed(1)}M`;
    if (number >= 1000) return `${currency} ${(number / 1000).toFixed(1)}K`;
    return formatPaidAdsMoney(number, currency);
  }
  if (number >= 1_000_000) return `${(number / 1_000_000).toFixed(1)}M`;
  if (number >= 1000) return `${(number / 1000).toFixed(number >= 10_000 ? 0 : 1)}K`;
  return formatPaidAdsNumber(number);
}

function MetricsComparison({ totals, period, comparisonPeriod, currency, comparison }) {
  return <div className="mt-5 rounded-2xl border border-[#c2c6d3]/25 bg-[#fbfcfd] p-5 sm:p-6">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div><h3 className="text-sm font-extrabold text-[#273548]">Metrics comparison</h3><p className="mt-1 text-[10px] font-semibold text-[#8a9099]">{comparison ? `${period.label} compared with ${comparisonPeriod.label}` : period.label}</p></div>
      <div className="flex flex-wrap items-center gap-4 text-[10px] font-bold text-[#727782]"><span className="flex items-center gap-2"><span className="h-3 w-3 rounded-sm bg-[#2563eb]" />{period.label}</span>{comparison && <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-sm bg-[#cfd5de]" />{comparisonPeriod.label}</span>}</div>
    </div>
    <div className="mt-6 overflow-x-auto pb-1">
      <div className="relative min-w-[1050px] pl-12">
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[230px]"><span className="absolute left-0 top-0 text-[9px] font-bold text-[#8a9099]">100%</span><span className="absolute left-1 top-1/2 -translate-y-1/2 text-[9px] font-bold text-[#8a9099]">50%</span><span className="absolute bottom-0 left-2 text-[9px] font-bold text-[#8a9099]">0%</span><span className="absolute left-10 right-0 top-1 border-t border-dashed border-[#e4e8ed]" /><span className="absolute left-10 right-0 top-1/2 border-t border-dashed border-[#e4e8ed]" /><span className="absolute bottom-1 left-10 right-0 border-t border-[#dfe3e8]" /></div>
        <div className="grid h-[292px] grid-cols-7 gap-4">
          {series.map(item => {
            const current = Number(totals[item.key]?.current || 0);
            const previous = Number(totals[item.key]?.previous || 0);
            const pairMax = Math.max(current, previous, 1);
            const currentHeight = current > 0 ? Math.max(3, (current / pairMax) * 80) : 0;
            const previousHeight = previous > 0 ? Math.max(3, (previous / pairMax) * 80) : 0;
            return <div key={item.key} className="flex min-w-0 flex-col">
              <div className="flex h-[230px] items-end justify-center gap-2">
                <div className="flex h-full w-10 flex-col items-center justify-end"><span className="mb-1 whitespace-nowrap text-[8px] font-extrabold text-[#273548]">{barLabel(current, item.type, currency)}</span><span className="w-8 rounded-t-lg transition-[height] duration-500" style={{ height: `${currentHeight}%`, backgroundColor: item.color }} /></div>
                {comparison && <div className="flex h-full w-10 flex-col items-center justify-end"><span className="mb-1 whitespace-nowrap text-[8px] font-bold text-[#8a9099]">{barLabel(previous, item.type, currency)}</span><span className="w-8 rounded-t-lg bg-[#cfd5de] transition-[height] duration-500" style={{ height: `${previousHeight}%` }} /></div>}
              </div>
              <div className="mt-3 flex items-center justify-center gap-2 text-center text-[10px] font-extrabold text-[#354052]"><span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />{item.label}</div>
            </div>;
          })}
        </div>
      </div>
    </div>
  </div>;
}

export default function PaidAdsBrandEnquiryTrend({ data, clientId, selectedMonth, onApplyRange, loading = false }) {
  const [metricKey, setMetricKey] = useState('spend');
  const [viewMode, setViewMode] = useState('comparison');
  const [chartSlide, setChartSlide] = useState(0);
  const [hover, setHover] = useState(null);
  const [monthlyMonths, setMonthlyMonths] = useState(() => defaultComparisonMonths(selectedMonth));
  const comparison = viewMode === 'comparison';
  const current = data.daily || [];
  const previous = comparison ? (data.previousDaily || []) : [];
  const active = series.find(item => item.key === metricKey) || series[0];
  const max = Math.max(1, ...current.map(row => Number(row[metricKey] || 0)), ...previous.map(row => Number(row[metricKey] || 0)));
  const labels = current.length ? current : previous;
  const labelIndexes = [...new Set([0, Math.floor((labels.length - 1) / 2), labels.length - 1])].filter(index => index >= 0);
  const currentRow = hover == null ? null : current[Math.min(hover.index, Math.max(current.length - 1, 0))];
  const previousRow = hover == null ? null : previous[Math.min(hover.index, Math.max(previous.length - 1, 0))];

  return <section className="mt-6 rounded-3xl border border-[#c2c6d3]/30 bg-white p-5 shadow-sm sm:p-6">
    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
      <div><h2 className="text-lg font-extrabold text-[#191c1d]">Brand and enquiry performance trend</h2><p className="mt-1 text-xs font-semibold text-[#727782]">Switch between upper-funnel brand activity and enquiry outcomes.</p></div>
      <div className="flex w-full min-w-0 flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:justify-end">
        {chartSlide === 3 ? <PaidAdsMonthSelector anchor={selectedMonth} selected={monthlyMonths} onApply={setMonthlyMonths}/> : <><PerformanceDropdown value={viewMode} onChange={value => { setViewMode(value); setHover(null); }} className="w-full sm:w-44" options={[{ value: 'comparison', label: 'Comparison' }, { value: 'current', label: 'Current period only' }]} />
        {comparison && onApplyRange && <RangeSelector period={data.period} comparisonPeriod={data.comparisonPeriod} loading={loading} onApplyRange={onApplyRange} />}</>}
        <div className="flex shrink-0 items-center gap-0.5" aria-label="Performance chart navigation">
          <button type="button" onClick={() => { setChartSlide(value => Math.max(0, value - 1)); setHover(null); }} disabled={chartSlide === 0} className="flex h-9 w-9 items-center justify-center rounded-full text-[#727782] transition hover:bg-[#f3f4f5] hover:text-[#003870] disabled:cursor-not-allowed disabled:opacity-30" aria-label="Previous brand and enquiry chart view"><Chevron direction="left" /></button>
          <button type="button" onClick={() => { setChartSlide(value => Math.min(3, value + 1)); setHover(null); }} disabled={chartSlide === 3} className="flex h-9 w-9 items-center justify-center rounded-full text-[#727782] transition hover:bg-[#f3f4f5] hover:text-[#003870] disabled:cursor-not-allowed disabled:opacity-30" aria-label="Next brand and enquiry chart view"><Chevron direction="right" /></button>
        </div>
      </div>
    </div>
    {chartSlide === 3 ? <PaidAdsBrandEnquiryMonthlyComparison clientId={clientId} selectedMonth={selectedMonth} currency={data.account.currency} months={monthlyMonths} embedded/> : chartSlide === 2 ? <>
    <div className="mt-5 flex flex-wrap gap-2">{series.map(item => <button key={item.key} type="button" onClick={() => setMetricKey(item.key)} className={`rounded-full px-4 py-2 text-xs font-bold transition ${metricKey === item.key ? 'text-white shadow-sm' : 'bg-[#f3f4f5] text-[#727782]'}`} style={metricKey === item.key ? { backgroundColor: item.color } : undefined}>{item.label}</button>)}</div>
    {(current.length || previous.length) ? <div className="mt-5 overflow-x-auto rounded-2xl border border-[#c2c6d3]/20 bg-[#fbfcfd] p-3"><div className="relative min-w-[900px]"><svg className="h-[310px] w-full" viewBox="0 0 1200 310" preserveAspectRatio="none" role="img" aria-label={`${active.label} daily performance`}>
      {[60,106,152,198,245].map((y,index) => <g key={y}><line x1="72" y1={y} x2="1092" y2={y} stroke="#e5e9ee" strokeDasharray="4 5"/><text x="60" y={y + 4} textAnchor="end" fill="#8a9099" fontSize="9" fontWeight="700">{compact(max * (4-index)/4, active.type, data.account.currency)}</text></g>)}
      {previous.length > 0 && <polyline points={linePoints(previous,metricKey,max)} fill="none" stroke={active.color} strokeOpacity=".3" strokeWidth="2" strokeDasharray="7 6"/>}
      {current.length > 0 && <polyline points={linePoints(current,metricKey,max)} fill="none" stroke={active.color} strokeWidth="3" strokeLinejoin="round"/>}
      {current.map((row,index) => index % Math.max(1,Math.ceil(current.length/12)) === 0 ? <circle key={row.date} cx={72 + index * (1020 / Math.max(current.length-1,1))} cy={245 - (Number(row[metricKey] || 0) / max) * 185} r="4" fill="white" stroke={active.color} strokeWidth="2.5"/> : null)}
      {labelIndexes.map(index => <text key={labels[index]?.date} x={72 + index * (1020 / Math.max(labels.length-1,1))} y="279" textAnchor="middle" fill="#727782" fontSize="10" fontWeight="700">{dateLabel(labels[index]?.date)}</text>)}
      <rect x="72" y="60" width="1020" height="185" fill="transparent" style={{cursor:'crosshair'}} onMouseMove={event => { const plotBounds=event.currentTarget.getBoundingClientRect(); const svgBounds=event.currentTarget.ownerSVGElement.getBoundingClientRect(); const ratio=Math.min(1,Math.max(0,(event.clientX-plotBounds.left)/plotBounds.width)); const x=event.clientX-svgBounds.left; const y=Math.max(70,Math.min(svgBounds.height-70,event.clientY-svgBounds.top)); setHover({index:Math.round(ratio*Math.max(labels.length-1,0)),x,y,placeLeft:x>svgBounds.width/2}); }} onMouseLeave={() => setHover(null)}/>
    </svg>{hover != null && <div className="pointer-events-none absolute z-20 min-w-60 rounded-2xl border border-[#dfe3e8] bg-white/95 p-4 text-xs shadow-xl" style={{left:hover.x,top:hover.y,transform:hover.placeLeft?'translate(calc(-100% - 16px), -50%)':'translate(16px, -50%)'}}><p className="font-extrabold text-[#273548]">{active.label}</p><div className="mt-2 flex justify-between gap-6"><span className="text-[#727782]">Current {currentRow?.date ? `· ${dateLabel(currentRow.date)}` : ''}</span><b>{compact(currentRow?.[metricKey] || 0,active.type,data.account.currency)}</b></div>{comparison && <div className="mt-1 flex justify-between gap-6"><span className="text-[#8a9099]">Previous {previousRow?.date ? `· ${dateLabel(previousRow.date)}` : ''}</span><b className="text-[#8a9099]">{compact(previousRow?.[metricKey] || 0,active.type,data.account.currency)}</b></div>}</div>}</div></div> : <div className="mt-5 rounded-2xl bg-[#f8f9fa] py-12 text-center text-sm font-bold text-[#727782]">No daily brand or enquiry data for this period.</div>}
    <div className="mt-3 flex flex-wrap justify-center gap-6 text-xs font-semibold text-[#727782]"><span className="flex items-center gap-2"><span className="h-0.5 w-7" style={{backgroundColor:active.color}}/>Current · {data.period.label}</span>{comparison && <span className="flex items-center gap-2"><span className="w-7 border-t-2 border-dashed" style={{borderColor:active.color}}/>Previous · {data.comparisonPeriod.label}</span>}</div>
    </> : chartSlide === 1 ? <PaidAdsMultiMetricTrend series={series} current={current} previous={previous} period={data.period} comparisonPeriod={data.comparisonPeriod} valueFor={metricValue} currency={data.account.currency} /> : <MetricsComparison totals={data.totals} period={data.period} comparisonPeriod={data.comparisonPeriod} currency={data.account.currency} comparison={comparison} />}
  </section>;
}
