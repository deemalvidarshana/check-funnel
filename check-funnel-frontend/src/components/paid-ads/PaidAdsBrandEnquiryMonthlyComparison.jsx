import { useEffect, useMemo, useRef, useState } from 'react';
import { getPaidAdsMonthlyComparison } from '../../api/paidAds';
import { formatPaidAdsMoney, formatPaidAdsNumber, paidAdsErrorMessage } from '../../utils/paidAdsFormatters';
import { defaultComparisonMonths } from '../../utils/paidAdsMonthComparison';

const brandMetrics = [
  { key: 'spend', label: 'Spend', type: 'money' },
  { key: 'reach', label: 'Reach', type: 'number' },
  { key: 'postEngagements', label: 'Engagements', type: 'number' },
  { key: 'videoViews', label: 'Video views', type: 'number' },
  { key: 'landingPageViews', label: 'Landing views', type: 'number' },
  { key: 'leads', label: 'Leads', type: 'number' },
  { key: 'messagingConversations', label: 'Messages', type: 'number' },
];

const ecommerceMetrics = [
  { key: 'spend', label: 'Spend', type: 'money' },
  { key: 'landingPageViews', label: 'Landing page views', type: 'number' },
  { key: 'contentViews', label: 'Product / content views', type: 'number' },
  { key: 'addToCart', label: 'Adds to cart', type: 'number' },
  { key: 'initiateCheckout', label: 'Checkouts initiated', type: 'number' },
  { key: 'purchases', label: 'Purchases', type: 'number' },
  { key: 'purchaseValue', label: 'Revenue', type: 'money' },
  { key: 'conversionRate', label: 'LPV → purchase rate', type: 'percent' },
];

const allMetrics = [
  { key: 'spend', label: 'Spend', type: 'money' },
  { key: 'reach', label: 'Reach', type: 'number' },
  { key: 'impressions', label: 'Impressions', type: 'number' },
  { key: 'clicks', label: 'Clicks', type: 'number' },
  { key: 'conversions', label: 'Conversions', type: 'number' },
];

const monthColors = ['#2563eb', '#06b6d4', '#8b5cf6', '#f97316', '#10b981', '#ec4899', '#f59e0b', '#14b8a6', '#6366f1', '#84cc16'];

function shiftMonth(month, offset) {
  const [year, monthNumber] = month.split('-').map(Number);
  const date = new Date(Date.UTC(year, monthNumber - 1 + offset, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(month) {
  const [year, monthNumber] = month.split('-').map(Number);
  return new Date(Date.UTC(year, monthNumber - 1, 1)).toLocaleDateString('en-GB', { month: 'short', year: 'numeric', timeZone: 'UTC' });
}

function compact(value, type, currency) {
  const number = Number(value || 0);
  if (type === 'percent') return `${number.toFixed(2)}%`;
  if (type === 'money') {
    if (number >= 1_000_000) return `${currency} ${(number / 1_000_000).toFixed(1)}M`;
    if (number >= 1000) return `${currency} ${(number / 1000).toFixed(1)}K`;
    return formatPaidAdsMoney(number, currency);
  }
  if (number >= 1_000_000) return `${(number / 1_000_000).toFixed(1)}M`;
  if (number >= 1000) return `${(number / 1000).toFixed(number >= 10_000 ? 0 : 1)}K`;
  return formatPaidAdsNumber(number);
}

function metricValue(row, key) {
  if (key === 'conversionRate') {
    const landingPageViews = Number(row.metrics?.landingPageViews || 0);
    return landingPageViews > 0 ? (Number(row.metrics?.purchases || 0) / landingPageViews) * 100 : 0;
  }
  return Number(row.metrics?.[key] || 0);
}

export function PaidAdsMonthSelector({ anchor, selected, onApply, loading = false }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(selected);
  const ref = useRef(null);
  const options = useMemo(() => Array.from({ length: 24 }, (_, index) => shiftMonth(anchor, -index)), [anchor]);

  useEffect(() => {
    const close = event => ref.current && !ref.current.contains(event.target) && setOpen(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const toggle = month => setDraft(current => current.includes(month) ? current.filter(value => value !== month) : [...current, month]);
  const apply = () => {
    const ordered = [...draft].sort();
    if (!ordered.length) return;
    onApply(ordered);
    setOpen(false);
  };

  return <div className="relative" ref={ref}>
    <button type="button" onClick={() => { setDraft(selected); setOpen(value => !value); }} className="flex h-11 min-w-44 items-center justify-between gap-4 rounded-full border border-[#c2c6d3]/30 bg-white px-5 text-xs font-bold text-[#003870] shadow-sm" aria-expanded={open}>
      <span>Select months ({selected.length})</span>
      <svg className={`h-3.5 w-3.5 transition ${open ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9" /></svg>
    </button>
    {open && <div className="absolute right-0 top-full z-40 mt-2 w-[min(92vw,360px)] rounded-2xl border border-[#c2c6d3]/30 bg-white p-3 shadow-2xl">
      <div className="mb-3 flex items-center justify-between px-1"><div><p className="text-xs font-extrabold text-[#273548]">Compare months</p><p className="mt-0.5 text-[9px] font-semibold text-[#8a9099]">Choose one or more months</p></div><button type="button" onClick={() => setDraft(defaultComparisonMonths(anchor))} className="text-[10px] font-extrabold text-[#2563eb]">Last 4</button></div>
      <div className="grid max-h-64 grid-cols-2 gap-1 overflow-y-auto pr-1">
        {options.map(month => {
          const checked = draft.includes(month);
          return <button key={month} type="button" onClick={() => toggle(month)} className={`flex items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-bold transition ${checked ? 'bg-[#2563eb]/10 text-[#003870]' : 'text-[#727782] hover:bg-[#f3f4f5]'}`}>
            <span className={`flex h-4 w-4 items-center justify-center rounded border ${checked ? 'border-[#2563eb] bg-[#2563eb] text-white' : 'border-[#cfd5de]'}`}>{checked ? '✓' : ''}</span>{monthLabel(month)}
          </button>;
        })}
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-[#e6e9ed] pt-3"><span className="text-[10px] font-bold text-[#8a9099]">{draft.length} selected</span><button type="button" onClick={apply} disabled={!draft.length || loading} className="rounded-full bg-[#003870] px-5 py-2 text-xs font-bold text-white disabled:opacity-40">Apply</button></div>
    </div>}
  </div>;
}

export default function PaidAdsBrandEnquiryMonthlyComparison({ clientId, selectedMonth, currency, mode = 'brand-enquiry', embedded = false, months, onMonthsChange, loadMonthlyComparison = getPaidAdsMonthlyComparison }) {
  const selected = months || defaultComparisonMonths(selectedMonth);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    loadMonthlyComparison(clientId, selected)
      .then(result => active && setRows(result.months || []))
      .catch(requestError => active && setError(paidAdsErrorMessage(requestError)))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [clientId, selected, loadMonthlyComparison]);

  const groupWidth = Math.max(142, rows.length * 44 + 34);
  const metrics = mode === 'ecommerce' ? ecommerceMetrics : mode === 'all' ? allMetrics : brandMetrics;
  const chartWidth = Math.max(1050, 54 + metrics.length * groupWidth);
  const title = mode === 'ecommerce' ? 'Ecommerce multi-month comparison' : mode === 'all' ? 'All metrics multi-month comparison' : 'Multi-month performance comparison';
  const subtitle = mode === 'ecommerce'
    ? 'Compare the complete sales journey across selected months.'
    : mode === 'all'
      ? 'Compare core campaign metrics across selected months.'
      : 'Compare brand and enquiry metrics across selected months.';

  const applyMonths = nextMonths => {
    setLoading(true);
    setError('');
    onMonthsChange?.(nextMonths);
  };

  return <section className={embedded ? 'mt-1' : 'mt-6 rounded-3xl border border-[#c2c6d3]/30 bg-white p-5 shadow-sm sm:p-6'}>
    {!embedded && <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div><h2 className="text-lg font-extrabold text-[#191c1d]">{title}</h2><p className="mt-1 text-xs font-semibold text-[#727782]">{subtitle}</p></div>
      <PaidAdsMonthSelector anchor={selectedMonth} selected={selected} onApply={applyMonths} loading={loading} />
    </div>}

    {error ? <div className="mt-5 rounded-2xl bg-red-50 px-5 py-8 text-center text-xs font-bold text-red-600">{error}</div> : loading ? <div className="mt-5 flex h-72 items-center justify-center rounded-2xl bg-[#fbfcfd]"><span className="h-8 w-8 animate-spin rounded-full border-4 border-[#003870]/15 border-t-[#003870]" /></div> : <>
      <div className={`${embedded ? 'mt-3' : 'mt-5'} flex flex-wrap items-center gap-x-5 gap-y-2 text-[10px] font-bold text-[#727782]`}>
        {rows.map((row, index) => <span key={row.month} className="flex items-center gap-2"><span className="h-3 w-3 rounded-sm" style={{ backgroundColor: monthColors[index % monthColors.length] }} />{row.label}</span>)}
      </div>
      <div className="mt-3 overflow-x-auto rounded-2xl border border-[#c2c6d3]/25 bg-[#fbfcfd] p-5 pb-3">
        <div className="relative" style={{ minWidth: `${chartWidth}px` }}>
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[230px]"><span className="absolute left-0 top-0 text-[9px] font-bold text-[#8a9099]">100%</span><span className="absolute left-1 top-1/2 -translate-y-1/2 text-[9px] font-bold text-[#8a9099]">50%</span><span className="absolute bottom-0 left-2 text-[9px] font-bold text-[#8a9099]">0%</span><span className="absolute left-11 right-0 top-1 border-t border-dashed border-[#e4e8ed]" /><span className="absolute left-11 right-0 top-1/2 border-t border-dashed border-[#e4e8ed]" /><span className="absolute bottom-1 left-11 right-0 border-t border-[#dfe3e8]" /></div>
          <div className="ml-11 flex h-[292px]">
            {metrics.map(metric => {
              const maximum = Math.max(1, ...rows.map(row => metricValue(row, metric.key)));
              return <div key={metric.key} className="flex shrink-0 flex-col px-2" style={{ width: `${groupWidth}px` }}>
                <div className="flex h-[230px] items-end justify-center gap-1.5">
                  {rows.map((row, index) => {
                    const value = metricValue(row, metric.key);
                    const height = value > 0 ? Math.max(3, (value / maximum) * 80) : 0;
                    return <div key={row.month} className="flex h-full min-w-3 max-w-8 flex-1 flex-col items-center justify-end" title={`${row.label}: ${compact(value, metric.type, currency)}`}><span className="mb-1 whitespace-nowrap text-[8px] font-extrabold text-[#59606b]">{compact(value, metric.type, currency)}</span><span className="w-full rounded-t-md transition-[height] duration-500" style={{ height: `${height}%`, backgroundColor: monthColors[index % monthColors.length] }} /></div>;
                  })}
                </div>
                <div className="mt-3 text-center text-[10px] font-extrabold text-[#354052]">{metric.label}</div>
              </div>;
            })}
          </div>
        </div>
      </div>
    </>}
  </section>;
}
