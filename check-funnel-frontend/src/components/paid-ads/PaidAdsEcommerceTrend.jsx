import { useState } from 'react';
import { formatPaidAdsMoney, formatPaidAdsNumber } from '../../utils/paidAdsFormatters';
import { RangeSelector } from './PaidAdsPerformanceChart';
import PaidAdsMultiMetricTrend from './PaidAdsMultiMetricTrend';
import PaidAdsBrandEnquiryMonthlyComparison, { PaidAdsMonthSelector } from './PaidAdsBrandEnquiryMonthlyComparison';
import { defaultComparisonMonths } from '../../utils/paidAdsMonthComparison';

const series = [
  { key: 'spend', label: 'Spend', color: '#2563eb', type: 'money' },
  { key: 'landingPageViews', label: 'Landing page views', color: '#0ea5e9', type: 'number' },
  { key: 'contentViews', label: 'Product / content views', color: '#06b6d4', type: 'number' },
  { key: 'addToCart', label: 'Adds to cart', color: '#8b5cf6', type: 'number' },
  { key: 'initiateCheckout', label: 'Checkouts initiated', color: '#f59e0b', type: 'number' },
  { key: 'purchases', label: 'Purchases', color: '#059669', type: 'number' },
  { key: 'purchaseValue', label: 'Revenue', color: '#10b981', type: 'money' },
  { key: 'purchaseConversionRate', label: 'LPV → purchase conversion rate', color: '#14b8a6', type: 'percent' },
];

function metricValue(row, key) {
  if (key === 'purchaseConversionRate') {
    const landingPageViews = Number(row?.landingPageViews || 0);
    return landingPageViews ? (Number(row?.purchases || 0) / landingPageViews) * 100 : 0;
  }
  return Number(row?.[key] || 0);
}

function points(rows, key, max) {
  return rows.map((row, index) => `${72 + index * (1020 / Math.max(rows.length - 1, 1))},${245 - (metricValue(row, key) / max) * 185}`).join(' ');
}

function display(value, config, currency) {
  if (config.type === 'money') return formatPaidAdsMoney(value, currency);
  if (config.type === 'percent') return `${Number(value || 0).toFixed(2)}%`;
  return formatPaidAdsNumber(value);
}

function dateLabel(value) {
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function compact(value, config, currency) {
  const number = Number(value || 0);
  if (config.type === 'percent') return `${number.toFixed(2)}%`;
  if (config.type === 'money') {
    if (number >= 1_000_000) return `${currency} ${(number / 1_000_000).toFixed(1)}M`;
    if (number >= 1000) return `${currency} ${(number / 1000).toFixed(1)}K`;
    return formatPaidAdsMoney(number, currency);
  }
  if (number >= 1_000_000) return `${(number / 1_000_000).toFixed(1)}M`;
  if (number >= 1000) return `${(number / 1000).toFixed(number >= 10_000 ? 0 : 1)}K`;
  return formatPaidAdsNumber(number);
}

function Chevron({ direction }) {
  const points = direction === 'left' ? '15 18 9 12 15 6' : '9 18 15 12 9 6';
  return <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points={points} strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function EcommerceComparison({ data, comparison }) {
  return <div className="mt-5 rounded-2xl border border-[#c2c6d3]/25 bg-[#fbfcfd] p-5 sm:p-6">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div><h3 className="text-sm font-extrabold text-[#273548]">Ecommerce metrics comparison</h3><p className="mt-1 text-[10px] font-semibold text-[#8a9099]">{comparison ? `${data.period.label} compared with ${data.comparisonPeriod.label}` : data.period.label}</p></div>
      <div className="flex flex-wrap items-center gap-4 text-[10px] font-bold text-[#727782]"><span className="flex items-center gap-2"><span className="h-3 w-3 rounded-sm bg-[#2563eb]" />{data.period.label}</span>{comparison && <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-sm bg-[#cfd5de]" />{data.comparisonPeriod.label}</span>}</div>
    </div>
    <div className="mt-6 overflow-x-auto pb-1">
      <div className="relative min-w-[1250px] pl-12">
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[230px]"><span className="absolute left-0 top-0 text-[9px] font-bold text-[#8a9099]">100%</span><span className="absolute left-1 top-1/2 -translate-y-1/2 text-[9px] font-bold text-[#8a9099]">50%</span><span className="absolute bottom-0 left-2 text-[9px] font-bold text-[#8a9099]">0%</span><span className="absolute left-10 right-0 top-1 border-t border-dashed border-[#e4e8ed]" /><span className="absolute left-10 right-0 top-1/2 border-t border-dashed border-[#e4e8ed]" /><span className="absolute bottom-1 left-10 right-0 border-t border-[#dfe3e8]" /></div>
        <div className="grid h-[292px] grid-cols-8 gap-4">
          {series.map(item => {
            const metric = data.totals[item.key] || {};
            const landing = data.totals.landingPageViews || {};
            const purchases = data.totals.purchases || {};
            const current = item.key === 'purchaseConversionRate'
              ? (Number(landing.current || 0) ? (Number(purchases.current || 0) / Number(landing.current)) * 100 : 0)
              : Number(metric.current || 0);
            const previous = item.key === 'purchaseConversionRate'
              ? (Number(landing.previous || 0) ? (Number(purchases.previous || 0) / Number(landing.previous)) * 100 : 0)
              : Number(metric.previous || 0);
            const pairMax = Math.max(current, previous, 1);
            const currentHeight = current > 0 ? Math.max(3, (current / pairMax) * 80) : 0;
            const previousHeight = previous > 0 ? Math.max(3, (previous / pairMax) * 80) : 0;
            return <div key={item.key} className="flex min-w-0 flex-col">
              <div className="flex h-[230px] items-end justify-center gap-2">
                <div className="flex h-full w-10 flex-col items-center justify-end"><span className="mb-1 whitespace-nowrap text-[8px] font-extrabold text-[#273548]">{compact(current, item, data.account.currency)}</span><span className="w-8 rounded-t-lg transition-[height] duration-500" style={{ height: `${currentHeight}%`, backgroundColor: item.color }} /></div>
                {comparison && <div className="flex h-full w-10 flex-col items-center justify-end"><span className="mb-1 whitespace-nowrap text-[8px] font-bold text-[#8a9099]">{compact(previous, item, data.account.currency)}</span><span className="w-8 rounded-t-lg bg-[#cfd5de] transition-[height] duration-500" style={{ height: `${previousHeight}%` }} /></div>}
              </div>
              <div className="mt-3 flex items-start justify-center gap-2 text-center text-[10px] font-extrabold leading-4 text-[#354052]"><span className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />{item.label}</div>
            </div>;
          })}
        </div>
      </div>
    </div>
  </div>;
}

export default function PaidAdsEcommerceTrend({ data, clientId, selectedMonth, onApplyRange, loading = false, loadMonthlyComparison }) {
  const [metricKey, setMetricKey] = useState('spend');
  const [comparison, setComparison] = useState(true);
  const [chartSlide, setChartSlide] = useState(0);
  const [hoverIndex, setHoverIndex] = useState(null);
  const [monthlyMonths, setMonthlyMonths] = useState(() => defaultComparisonMonths(selectedMonth));
  const current = data.daily || [];
  const previous = comparison ? (data.previousDaily || []) : [];
  const config = series.find(item => item.key === metricKey) || series[0];
  const max = Math.max(1, ...current.map(row => metricValue(row, metricKey)), ...previous.map(row => metricValue(row, metricKey)));
  const labels = current.length ? current : previous;
  const labelIndexes = [...new Set([0, Math.floor((labels.length - 1) / 2), labels.length - 1])].filter(index => index >= 0);
  const currentRow = hoverIndex == null ? null : current[Math.min(hoverIndex, Math.max(current.length - 1, 0))];
  const previousRow = hoverIndex == null ? null : previous[Math.min(hoverIndex, Math.max(previous.length - 1, 0))];

  return <section className="mt-6 rounded-3xl border border-[#c2c6d3]/30 bg-white p-5 shadow-sm sm:p-6">
    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between"><div><h2 className="text-lg font-extrabold text-[#191c1d]">Ecommerce performance trend</h2><p className="mt-1 text-xs font-semibold text-[#727782]">Daily sales journey performance with previous-period comparison.</p></div><div className="flex w-full min-w-0 flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">{chartSlide === 3 ? <PaidAdsMonthSelector anchor={selectedMonth} selected={monthlyMonths} onApply={setMonthlyMonths}/> : <><button type="button" onClick={() => setComparison(value => !value)} className="h-11 w-fit rounded-full border border-[#c2c6d3]/30 bg-[#f8f9fa] px-5 text-xs font-bold text-[#003870] shadow-sm">{comparison ? 'Comparison' : 'Current period only'}</button>{comparison && onApplyRange && <RangeSelector period={data.period} comparisonPeriod={data.comparisonPeriod} loading={loading} onApplyRange={onApplyRange} />}</>}<div className="flex items-center gap-1"><button type="button" onClick={() => { setChartSlide(value => Math.max(0, value - 1)); setHoverIndex(null); }} disabled={chartSlide === 0} className="flex h-9 w-9 items-center justify-center rounded-full text-[#727782] transition hover:bg-[#f3f4f5] hover:text-[#003870] disabled:cursor-not-allowed disabled:opacity-30" aria-label="Previous ecommerce chart view"><Chevron direction="left" /></button><button type="button" onClick={() => { setChartSlide(value => Math.min(3, value + 1)); setHoverIndex(null); }} disabled={chartSlide === 3} className="flex h-9 w-9 items-center justify-center rounded-full text-[#727782] transition hover:bg-[#f3f4f5] hover:text-[#003870] disabled:cursor-not-allowed disabled:opacity-30" aria-label="Next ecommerce chart view"><Chevron direction="right" /></button></div></div></div>
    {chartSlide === 3 ? <PaidAdsBrandEnquiryMonthlyComparison clientId={clientId} selectedMonth={selectedMonth} currency={data.account.currency} mode="ecommerce" months={monthlyMonths} embedded loadMonthlyComparison={loadMonthlyComparison}/> : chartSlide === 0 ? <EcommerceComparison data={data} comparison={comparison} /> : chartSlide === 1 ? <PaidAdsMultiMetricTrend series={series} current={current} previous={previous} period={data.period} comparisonPeriod={data.comparisonPeriod} valueFor={metricValue} currency={data.account.currency} /> : <>
    <div className="mt-5 flex flex-wrap gap-2">{series.map(item => <button key={item.key} type="button" onClick={() => setMetricKey(item.key)} className={`rounded-full px-4 py-2 text-xs font-bold transition ${metricKey === item.key ? 'text-white shadow-sm' : 'bg-[#f3f4f5] text-[#727782]'}`} style={metricKey === item.key ? { backgroundColor: item.color } : undefined}>{item.label}</button>)}</div>
    {(current.length || previous.length) ? <div className="mt-5 overflow-x-auto rounded-2xl border border-[#c2c6d3]/20 bg-[#fbfcfd] p-3"><div className="relative min-w-[900px]"><svg className="h-[310px] w-full" viewBox="0 0 1200 310" preserveAspectRatio="none" role="img" aria-label={`${config.label} daily ecommerce performance`}>
      {[60,106,152,198,245].map((y, index) => <g key={y}><line x1="72" y1={y} x2="1092" y2={y} stroke="#e5e9ee" strokeDasharray="4 5"/><text x="60" y={y + 4} textAnchor="end" fill="#8a9099" fontSize="9" fontWeight="700">{display(max * (4 - index) / 4, config, data.account.currency)}</text></g>)}
      {previous.length > 0 && <polyline points={points(previous, metricKey, max)} fill="none" stroke={config.color} strokeOpacity=".3" strokeWidth="2" strokeDasharray="7 6"/>}
      {current.length > 0 && <polyline points={points(current, metricKey, max)} fill="none" stroke={config.color} strokeWidth="3" strokeLinejoin="round"/>}
      {current.map((row, index) => index % Math.max(1, Math.ceil(current.length / 12)) === 0 ? <circle key={row.date} cx={72 + index * (1020 / Math.max(current.length - 1, 1))} cy={245 - (metricValue(row, metricKey) / max) * 185} r="4" fill="white" stroke={config.color} strokeWidth="2.5"/> : null)}
      {labelIndexes.map(index => <text key={labels[index]?.date} x={72 + index * (1020 / Math.max(labels.length - 1, 1))} y="279" textAnchor="middle" fill="#727782" fontSize="10" fontWeight="700">{dateLabel(labels[index]?.date)}</text>)}
      <rect x="72" y="60" width="1020" height="185" fill="transparent" style={{ cursor: 'crosshair' }} onMouseMove={event => { const bounds = event.currentTarget.getBoundingClientRect(); const ratio = Math.min(1, Math.max(0, (event.clientX - bounds.left) / bounds.width)); setHoverIndex(Math.round(ratio * Math.max(labels.length - 1, 0))); }} onMouseLeave={() => setHoverIndex(null)}/>
    </svg>{hoverIndex != null && <div className="pointer-events-none absolute right-5 top-4 min-w-60 rounded-2xl border border-[#dfe3e8] bg-white/95 p-4 text-xs shadow-xl"><p className="font-extrabold text-[#273548]">{config.label}</p><div className="mt-2 flex justify-between gap-6"><span className="text-[#727782]">Current {currentRow?.date ? `· ${dateLabel(currentRow.date)}` : ''}</span><b>{display(metricValue(currentRow, metricKey), config, data.account.currency)}</b></div>{comparison && <div className="mt-1 flex justify-between gap-6"><span className="text-[#8a9099]">Previous {previousRow?.date ? `· ${dateLabel(previousRow.date)}` : ''}</span><b className="text-[#8a9099]">{display(metricValue(previousRow, metricKey), config, data.account.currency)}</b></div>}</div>}</div></div> : <div className="mt-5 rounded-2xl bg-[#f8f9fa] py-12 text-center text-sm font-bold text-[#727782]">No daily ecommerce ad data for this period.</div>}
    <div className="mt-3 flex flex-wrap justify-center gap-6 text-xs font-semibold text-[#727782]"><span className="flex items-center gap-2"><span className="h-0.5 w-7" style={{ backgroundColor: config.color }}/>Current · {data.period.label}</span>{comparison && <span className="flex items-center gap-2"><span className="w-7 border-t-2 border-dashed" style={{ borderColor: config.color }}/>Previous · {data.comparisonPeriod.label}</span>}</div>
    </>}
  </section>;
}
