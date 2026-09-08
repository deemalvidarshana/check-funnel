import { useEffect, useRef, useState } from 'react';
import { formatPaidAdsChange, formatPaidAdsMoney, formatPaidAdsNumber } from '../../utils/paidAdsFormatters';
import { defaultComparisonMonths } from '../../utils/paidAdsMonthComparison';
import PaidAdsBrandEnquiryMonthlyComparison, { PaidAdsMonthSelector } from './PaidAdsBrandEnquiryMonthlyComparison';

const seriesConfig = [
  { key: 'spend', label: 'Spend', color: '#2563eb' },
  { key: 'reach', label: 'Reach', color: '#06b6d4' },
  { key: 'impressions', label: 'Impressions', color: '#8b5cf6' },
  { key: 'clicks', label: 'Clicks', color: '#22b982' },
  { key: 'conversions', label: 'Conversions', color: '#ff536b' },
];

export function PerformanceDropdown({ value, onChange, options, placeholder, disabled = false, className = '' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const close = event => ref.current && !ref.current.contains(event.target) && setOpen(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);
  const selectedOption = options.find(option => option.value === value);
  const label = selectedOption?.label || placeholder;
  const statusDot = status => String(status || '').includes('ACTIVE') ? 'bg-emerald-500' : String(status || '').includes('PAUSED') ? 'bg-amber-400' : 'bg-slate-400';

  return <div ref={ref} className={`relative ${className}`}>
    <button type="button" disabled={disabled} onClick={() => setOpen(current => !current)} className="flex h-11 w-full items-center justify-between gap-4 rounded-full border border-[#c2c6d3]/30 bg-[#f3f4f5]/50 px-5 text-xs font-bold text-[#003870] shadow-sm transition hover:bg-[#f3f4f5] disabled:cursor-not-allowed disabled:opacity-50" aria-expanded={open}>
      <span className={`flex min-w-0 items-center gap-2 text-left ${value ? '' : 'text-[#727782]'}`}>{selectedOption?.status && <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${statusDot(selectedOption.status)}`} aria-label={selectedOption.status} />}<span className="truncate">{label}</span></span>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}><polyline points="6 9 12 15 18 9" /></svg>
    </button>
    {open && !disabled && <div className="absolute inset-x-0 top-full z-50 mt-2 max-h-[min(16rem,55vh)] w-full overflow-x-hidden overflow-y-auto rounded-2xl border border-[#c2c6d3]/20 bg-white py-1 shadow-xl">
      {options.map(option => <button key={option.value} type="button" onClick={() => { onChange(option.value); setOpen(false); }} className={`flex w-full min-w-0 items-center gap-2 overflow-hidden px-4 py-3 text-left text-sm font-bold transition hover:bg-[#f3f4f5] ${value === option.value ? 'bg-[#003870]/5 text-[#003870]' : 'text-[#727782]'}`}>{option.status && <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${statusDot(option.status)}`} aria-label={option.status} />}<span className="min-w-0 flex-1 truncate" title={option.label}>{option.label}</span></button>)}
    </div>}
  </div>;
}

function points(rows, key, max) {
  if (!rows.length) return '';
  const denominator = Math.max(rows.length - 1, 1);
  return rows.map((row, index) => `${58 + index * (952 / denominator)},${278 - (Number(row[key] || 0) / max) * 226}`).join(' ');
}

function niceScaleMax(value) {
  const number = Math.max(1, Number(value || 0));
  const magnitude = 10 ** Math.floor(Math.log10(number));
  const normalized = number / magnitude;
  const step = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 2.5 ? 2.5 : normalized <= 5 ? 5 : 10;
  return step * magnitude;
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

function compactPeriodLabel(period) {
  if (!period?.since || !period?.until) return period?.label || '';
  const since = new Date(`${period.since}T00:00:00`);
  const until = new Date(`${period.until}T00:00:00`);
  const sameYear = since.getFullYear() === until.getFullYear();
  const sameMonth = sameYear && since.getMonth() === until.getMonth();
  if (sameMonth) {
    return `${since.getDate()}–${until.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`;
  }
  if (sameYear) {
    return `${since.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}–${until.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`;
  }
  return period.label;
}

export function RangeSelector({ period, comparisonPeriod, loading, onApplyRange }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState('custom');
  const [draft, setDraft] = useState({ since: period.since, until: period.until, compareSince: comparisonPeriod.since, compareUntil: comparisonPeriod.until });
  const [error, setError] = useState('');
  const comparisonLabel = `${compactPeriodLabel(period)} vs ${compactPeriodLabel(comparisonPeriod)}`;

  useEffect(() => {
    setDraft({ since: period.since, until: period.until, compareSince: comparisonPeriod.since, compareUntil: comparisonPeriod.until });
  }, [period.since, period.until, comparisonPeriod.since, comparisonPeriod.until]);

  const apply = async () => {
    setError('');
    if (mode === 'custom') {
      if (Object.values(draft).some(value => !value)) return setError('Select all four dates.');
      if (draft.since > draft.until || draft.compareSince > draft.compareUntil) return setError('Start dates must be before end dates.');
    }
    try {
      await onApplyRange(mode === 'custom' ? draft : {});
      setOpen(false);
    } catch (requestError) {
      setError(requestError?.response?.data?.message || requestError?.message || 'Unable to load this comparison.');
    }
  };

  return <div className="relative">
    <button type="button" onClick={() => setOpen(value => !value)} className="flex h-11 w-full min-w-0 items-center justify-between gap-3 rounded-full border border-[#c2c6d3]/30 bg-[#f3f4f5]/50 px-5 text-xs font-bold text-[#003870] shadow-sm transition hover:bg-[#f3f4f5] sm:w-auto" aria-expanded={open} title={`${period.label} vs ${comparisonPeriod.label}`}>
      <span className="whitespace-nowrap text-left">{comparisonLabel}</span>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points={open ? '18 15 12 9 6 15' : '6 9 12 15 18 9'} /></svg>
    </button>
    {open && <div className="absolute left-0 right-auto top-full z-50 mt-2 w-[calc(100vw-2rem)] max-w-[430px] rounded-2xl border border-[#c2c6d3]/20 bg-white p-4 shadow-xl sm:left-auto sm:right-0">
      <p className="text-sm font-extrabold text-[#273548]">Comparison date ranges</p>
      <div className="mt-3 grid grid-cols-2 rounded-xl bg-[#f3f5f7] p-1 text-xs font-bold">
        <button type="button" onClick={() => setMode('month')} className={`rounded-lg px-3 py-2 transition ${mode === 'month' ? 'bg-white text-[#003870] shadow-sm' : 'text-[#727782] hover:text-[#003870]'}`}>Month vs previous</button>
        <button type="button" onClick={() => setMode('custom')} className={`rounded-lg px-3 py-2 transition ${mode === 'custom' ? 'bg-white text-[#003870] shadow-sm' : 'text-[#727782] hover:text-[#003870]'}`}>Custom ranges</button>
      </div>
      {mode === 'custom' && <div className="mt-4 space-y-4">
        <div><p className="mb-2 text-[10px] font-extrabold uppercase tracking-wider text-[#727782]">Current range</p><div className="grid grid-cols-1 gap-2 min-[380px]:grid-cols-2"><input type="date" value={draft.since} onChange={event => setDraft(value => ({ ...value, since: event.target.value }))} className="min-w-0 rounded-xl border border-[#dfe3e8] px-3 py-2 text-xs font-semibold text-[#273548]"/><input type="date" value={draft.until} onChange={event => setDraft(value => ({ ...value, until: event.target.value }))} className="min-w-0 rounded-xl border border-[#dfe3e8] px-3 py-2 text-xs font-semibold text-[#273548]"/></div></div>
        <div><p className="mb-2 text-[10px] font-extrabold uppercase tracking-wider text-[#727782]">Comparison range</p><div className="grid grid-cols-1 gap-2 min-[380px]:grid-cols-2"><input type="date" value={draft.compareSince} onChange={event => setDraft(value => ({ ...value, compareSince: event.target.value }))} className="min-w-0 rounded-xl border border-[#dfe3e8] px-3 py-2 text-xs font-semibold text-[#273548]"/><input type="date" value={draft.compareUntil} onChange={event => setDraft(value => ({ ...value, compareUntil: event.target.value }))} className="min-w-0 rounded-xl border border-[#dfe3e8] px-3 py-2 text-xs font-semibold text-[#273548]"/></div></div>
      </div>}
      {error && <p className="mt-3 text-[11px] font-bold text-red-500">{error}</p>}
      <div className="mt-4 flex justify-end gap-2"><button type="button" onClick={() => setOpen(false)} className="rounded-xl px-4 py-2 text-xs font-bold text-[#727782]">Cancel</button><button type="button" onClick={apply} disabled={loading} className="rounded-xl bg-[#003870] px-5 py-2 text-xs font-bold text-white disabled:opacity-50">{loading ? 'Loading…' : 'Apply'}</button></div>
    </div>}
  </div>;
}

function CampaignWiseSelector({ data, loading, onApplyRange }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({ since: data.period.since, until: data.period.until });
  const [campaignId, setCampaignId] = useState(data.selectedCampaign?.id || 'all');
  const [error, setError] = useState('');

  useEffect(() => {
    setDraft({ since: data.period.since, until: data.period.until });
    setCampaignId(data.selectedCampaign?.id || 'all');
  }, [data.period.since, data.period.until, data.selectedCampaign?.id]);

  const loadRange = async () => {
    setError('');
    if (!draft.since || !draft.until || draft.since > draft.until) {
      setError('Select a valid date range.');
      return;
    }
    try {
      await onApplyRange(draft);
      setCampaignId('all');
      setOpen(false);
    } catch (requestError) {
      setError(requestError?.response?.data?.message || requestError?.message || 'Unable to load campaigns.');
    }
  };

  const selectCampaign = async (value) => {
    setCampaignId(value);
    setError('');
    try {
      await onApplyRange(value === 'all' ? draft : { ...draft, campaignId: value });
    } catch (requestError) {
      setError(requestError?.response?.data?.message || requestError?.message || 'Unable to load campaign performance.');
    }
  };

  const rangeLabel = compactPeriodLabel({ ...draft, label: data.period.label });

  return <div className="flex w-full min-w-0 flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
    <div className="relative min-w-0 flex-1 sm:w-[250px] sm:flex-none">
      <button type="button" onClick={() => setOpen(value => !value)} className="flex h-11 w-full items-center justify-between gap-3 rounded-full border border-[#c2c6d3]/30 bg-[#f3f4f5]/50 px-5 text-xs font-bold text-[#003870] shadow-sm transition hover:bg-[#f3f4f5]" aria-expanded={open}>
        <span className="truncate text-left">{rangeLabel}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}><polyline points="6 9 12 15 18 9" /></svg>
      </button>
      {open && <div className="absolute right-0 top-full z-50 mt-2 w-[min(92vw,360px)] rounded-2xl border border-[#c2c6d3]/20 bg-white p-4 shadow-xl">
        <p className="text-sm font-extrabold text-[#273548]">Campaign date range</p>
        <div className="mt-3 grid grid-cols-1 gap-2 min-[380px]:grid-cols-2"><input type="date" value={draft.since} onChange={event => setDraft(value => ({ ...value, since: event.target.value }))} className="min-w-0 rounded-xl border border-[#dfe3e8] px-3 py-2 text-xs font-semibold text-[#273548]" /><input type="date" value={draft.until} onChange={event => setDraft(value => ({ ...value, until: event.target.value }))} className="min-w-0 rounded-xl border border-[#dfe3e8] px-3 py-2 text-xs font-semibold text-[#273548]" /></div>
        {error && <p className="mt-3 text-[11px] font-bold text-red-500">{error}</p>}
        <div className="mt-4 flex justify-end gap-2"><button type="button" onClick={() => setOpen(false)} className="rounded-xl px-4 py-2 text-xs font-bold text-[#727782]">Cancel</button><button type="button" onClick={loadRange} disabled={loading} className="rounded-xl bg-[#003870] px-5 py-2 text-xs font-bold text-white disabled:opacity-50">{loading ? 'Loading…' : 'Apply'}</button></div>
      </div>}
    </div>
    <PerformanceDropdown value={campaignId} onChange={selectCampaign} disabled={loading} placeholder="All Campaigns" className="min-w-0 flex-1 sm:w-[260px] sm:flex-none" options={[{ value: 'all', label: 'All Campaigns' }, ...(data.campaigns || []).map(campaign => ({ value: campaign.id, label: campaign.name, status: campaign.status }))]} />
    {!open && error && <p className="text-[11px] font-bold text-red-500 sm:max-w-48">{error}</p>}
  </div>;
}

function ChartTooltip({ hover, daily, previousDaily, period, comparisonPeriod, currency, visibleMetrics, visiblePeriods }) {
  if (!hover) return null;
  const currentRow = daily[hover.currentIndex];
  const previousRow = previousDaily[hover.previousIndex];
  const showCurrent = visiblePeriods.has('current');
  const showPrevious = visiblePeriods.has('previous');
  const metrics = seriesConfig.filter(series => visibleMetrics.has(series.key));
  if (!metrics.length || (!showCurrent && !showPrevious)) return null;
  const transform = hover.x <= 700 ? 'translateX(24px)' : 'translateX(calc(-100% - 24px))';

  return (
    <div className="pointer-events-none absolute top-4 z-20 w-[300px] rounded-2xl border border-[#dfe3e8] bg-white/95 p-4 shadow-xl backdrop-blur" style={{ left: `${(hover.x / 1200) * 100}%`, transform }}>
      <div className="grid grid-cols-[1fr_auto_auto] items-end gap-x-3 border-b border-[#edf0f2] pb-2 text-[9px] font-bold text-[#8a9099]">
        <span>Metric</span>
        {showCurrent && <span className="text-right">{tooltipDate(currentRow, period, hover.currentIndex)}</span>}
        {showPrevious && <span className="text-right">{tooltipDate(previousRow, comparisonPeriod, hover.previousIndex)}</span>}
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
        <div><h3 className="text-sm font-extrabold text-[#273548]">Metrics Comparison</h3><p className="mt-1 text-[10px] font-semibold text-[#8a9099]">{period.label} compared with {comparisonPeriod.label}</p></div>
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

export default function PaidAdsPerformanceChart({ data, clientId, selectedMonth, onApplyRange, loading = false }) {
  const [analysisMode, setAnalysisMode] = useState('comparison');
  const [visibleMetrics, setVisibleMetrics] = useState(() => new Set(seriesConfig.map(series => series.key)));
  const [visiblePeriods, setVisiblePeriods] = useState(() => new Set(['current', 'previous']));
  const [hover, setHover] = useState(null);
  const [chartView, setChartView] = useState(0);
  const [monthlyMonths, setMonthlyMonths] = useState(() => defaultComparisonMonths(selectedMonth));
  const { daily = [], previousDaily = [], totals, account, period, comparisonPeriod } = data;
  const chartDaily = analysisMode === 'campaign' && data.selectedCampaign ? (data.campaignDaily || []) : daily;
  const chartPreviousDaily = analysisMode === 'campaign' ? [] : previousDaily;
  const labelRows = chartDaily.length ? chartDaily : chartPreviousDaily;
  const maxByKey = Object.fromEntries(seriesConfig.map(({ key }) => [key, niceScaleMax(Math.max(1, ...chartDaily.map((row) => Number(row[key] || 0)), ...chartPreviousDaily.map((row) => Number(row[key] || 0))))]));
  const labelStep = Math.max(1, Math.ceil(labelRows.length / 8));
  const labelIndexes = labelRows.map((_, index) => index).filter(index => index === 0 || index === labelRows.length - 1 || index % labelStep === 0);
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
    setHover({
      currentIndex: Math.round(ratio * Math.max(chartDaily.length - 1, 0)),
      previousIndex: Math.round(ratio * Math.max(chartPreviousDaily.length - 1, 0)),
      x: 58 + ratio * 952,
    });
  };

  return (
    <section className="mt-6 rounded-3xl border border-[#c2c6d3]/30 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div><h2 className="text-lg font-extrabold text-[#191c1d]">Campaign Performance</h2><p className="mt-1 text-xs font-semibold text-[#727782]">Meta account: {account.name}</p></div>
        <div className="flex w-full flex-col items-start gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">{!(analysisMode === 'comparison' && chartView === 2) && <PerformanceDropdown value={analysisMode} onChange={value => { setAnalysisMode(value); setChartView(value === 'comparison' ? 0 : 1); setHover(null); }} className="w-44" options={[{ value: 'comparison', label: 'Comparison' }, { value: 'campaign', label: 'Campaign Wise' }]} />}{analysisMode === 'comparison' ? <div className="flex w-full min-w-0 items-center gap-1 sm:w-auto sm:gap-2"><div className="min-w-0 flex-1 sm:flex-none">{chartView === 2 ? <PaidAdsMonthSelector anchor={selectedMonth} selected={monthlyMonths} onApply={setMonthlyMonths} /> : <RangeSelector period={period} comparisonPeriod={comparisonPeriod} loading={loading} onApplyRange={onApplyRange}/>}</div><button type="button" onClick={() => { setChartView(current => Math.max(0, current - 1)); setHover(null); }} disabled={chartView === 0} className="shrink-0 rounded-full p-2 text-[#727782] transition hover:bg-[#f3f4f5] hover:text-[#003870] disabled:cursor-not-allowed disabled:opacity-30" aria-label="Previous performance view"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6" /></svg></button><button type="button" onClick={() => { setChartView(current => Math.min(2, current + 1)); setHover(null); }} disabled={chartView === 2} className="shrink-0 rounded-full p-2 text-[#727782] transition hover:bg-[#f3f4f5] hover:text-[#003870] disabled:cursor-not-allowed disabled:opacity-30" aria-label="Next performance view"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg></button></div> : <CampaignWiseSelector data={data} loading={loading} onApplyRange={onApplyRange}/>}</div>
      </div>

      {!(analysisMode === 'comparison' && chartView === 2) && <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {seriesConfig.map((series) => {
          const metric = totals[series.key];
          const campaignValue = data.selectedCampaign?.[series.key] ?? metric.current;
          const value = analysisMode === 'campaign' ? campaignValue : metric.current;
          return <div key={series.key} className="rounded-2xl border border-[#c2c6d3]/25 px-5 py-3.5"><div className="flex justify-between gap-3"><p className="text-[11px] font-bold text-[#727782]">{series.label}</p>{analysisMode === 'comparison' && <span className={`text-[10px] font-extrabold ${(metric.change || 0) >= 0 ? 'text-green-600' : 'text-red-500'}`}>{formatPaidAdsChange(metric.change)}</span>}</div><p className="mt-0.5 text-lg font-black" style={{ color: series.color }}>{value == null ? '—' : series.key === 'spend' ? formatPaidAdsMoney(value, account.currency) : formatPaidAdsNumber(value)}</p><p className="mt-0.5 text-[9px] font-semibold text-[#8a9099]">{analysisMode === 'comparison' ? <>Previous: {series.key === 'spend' ? formatPaidAdsMoney(metric.previous, account.currency) : formatPaidAdsNumber(metric.previous)}</> : (data.selectedCampaign ? period.label : `All Campaigns · ${period.label}`)}</p></div>;
        })}
      </div>}

      {analysisMode === 'comparison' && chartView === 2 ? <PaidAdsBrandEnquiryMonthlyComparison clientId={clientId} selectedMonth={selectedMonth} currency={account.currency} mode="all" embedded months={monthlyMonths} onMonthsChange={setMonthlyMonths} /> : analysisMode === 'comparison' && chartView === 0 ? <MonthlyComparisonBars totals={totals} account={account} period={period} comparisonPeriod={comparisonPeriod} /> : ((chartDaily.length || chartPreviousDaily.length) ? <div className="mt-5">
        <div className="overflow-x-auto"><div className="relative min-w-[1120px]"><svg className="h-[330px] w-full" viewBox="0 0 1200 330" preserveAspectRatio="none" role="img" aria-label="Meta Ads daily performance chart">
          <rect x="1018" y="25" width="177" height="260" rx="10" fill="#fafbfc" />
          {[52, 108, 165, 221, 278].map((y) => <line key={y} x1="58" y1={y} x2="1010" y2={y} stroke="#e7e9ed" strokeDasharray="3 4" />)}
          <line x1="58" y1="42" x2="58" y2="278" stroke="#dfe3e8" /><line x1="1010" y1="42" x2="1010" y2="278" stroke="#dfe3e8" />
          {seriesConfig.map((series) => visibleMetrics.has(series.key) && <g key={series.key}>{analysisMode === 'comparison' && visiblePeriods.has('previous') && <polyline points={points(chartPreviousDaily, series.key, maxByKey[series.key])} fill="none" stroke={series.color} strokeOpacity=".3" strokeWidth="1.8" strokeDasharray="6 5" />}{visiblePeriods.has('current') && <><polyline points={points(chartDaily, series.key, maxByKey[series.key])} fill="none" stroke={series.color} strokeWidth="2.5" strokeLinejoin="round" />{chartDaily.map((row, index) => index % Math.max(1, Math.ceil(chartDaily.length / 10)) === 0 && <circle key={row.date} cx={58 + index * (952 / Math.max(chartDaily.length - 1, 1))} cy={278 - (Number(row[series.key] || 0) / maxByKey[series.key]) * 226} r="3.2" fill="white" stroke={series.color} strokeWidth="2" />)}</>}</g>)}
          {hover && <line x1={hover.x} x2={hover.x} y1="42" y2="278" stroke="#727782" strokeOpacity=".45" strokeWidth="1" strokeDasharray="4 4" />}
          {labelIndexes.map((index) => <text key={labelRows[index].date} x={58 + index * (952 / Math.max(labelRows.length - 1, 1))} y="306" textAnchor="middle" fill="#727782" fontSize="10" fontWeight="600">{new Date(`${labelRows[index].date}T00:00:00`).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })}</text>)}
          {[1, .75, .5, .25, 0].map((ratio) => <text key={ratio} x="55" y={56 + (1 - ratio) * 224} textAnchor="end" fill="#2563eb" opacity={visibleMetrics.has('spend') ? 1 : .2} fontSize="9" fontWeight="700">{formatAxisMoney(maxByKey.spend * ratio, account.currency)}</text>)}
          {[1, .75, .5, .25, 0].map((ratio) => <text key={ratio} x="1038" y={56 + (1 - ratio) * 224} textAnchor="middle" fill="#06b6d4" opacity={visibleMetrics.has('reach') ? 1 : .2} fontSize="9" fontWeight="700">{compact(maxByKey.reach * ratio)}</text>)}
          {[1, .75, .5, .25, 0].map((ratio) => <text key={ratio} x="1088" y={56 + (1 - ratio) * 224} textAnchor="middle" fill="#8b5cf6" opacity={visibleMetrics.has('impressions') ? 1 : .2} fontSize="9" fontWeight="700">{compact(maxByKey.impressions * ratio)}</text>)}
          {[1, .75, .5, .25, 0].map((ratio) => <text key={ratio} x="1140" y={56 + (1 - ratio) * 224} textAnchor="middle" fill="#22b982" opacity={visibleMetrics.has('clicks') ? 1 : .2} fontSize="9" fontWeight="700">{compact(maxByKey.clicks * ratio)}</text>)}
          {[1, .75, .5, .25, 0].map((ratio) => <text key={ratio} x="1195" y={56 + (1 - ratio) * 224} textAnchor="end" fill="#ff536b" opacity={visibleMetrics.has('conversions') ? 1 : .2} fontSize="10" fontWeight="700">{compact(maxByKey.conversions * ratio)}</text>)}
          <rect x="58" y="42" width="952" height="236" fill="transparent" onMouseMove={handleChartHover} onMouseLeave={() => setHover(null)} style={{ cursor: 'crosshair' }} />
        </svg><ChartTooltip hover={hover} daily={chartDaily} previousDaily={chartPreviousDaily} period={period} comparisonPeriod={comparisonPeriod} currency={account.currency} visibleMetrics={visibleMetrics} visiblePeriods={analysisMode === 'campaign' ? new Set(['current']) : visiblePeriods} /></div></div>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-x-7 gap-y-3">
          {seriesConfig.map(series => { const active = visibleMetrics.has(series.key); return <button key={series.key} type="button" aria-pressed={active} onClick={() => toggleMetric(series.key)} className={`flex items-center gap-2 text-xs font-semibold transition ${active ? 'text-[#59606b]' : 'text-[#a8adb5] line-through'}`}><span className="h-3 w-3 rounded-full transition" style={{ backgroundColor: active ? series.color : '#c9cdd3' }} />{series.label}</button>; })}
          <button type="button" aria-pressed={visiblePeriods.has('current')} onClick={() => togglePeriod('current')} className={`flex items-center gap-2 text-xs font-semibold transition ${visiblePeriods.has('current') ? 'text-[#59606b]' : 'text-[#a8adb5] line-through'}`}><span className={`h-0.5 w-7 ${visiblePeriods.has('current') ? 'bg-[#727782]' : 'bg-[#c9cdd3]'}`} />Current</button>
          {analysisMode === 'comparison' && <button type="button" aria-pressed={visiblePeriods.has('previous')} onClick={() => togglePeriod('previous')} className={`flex items-center gap-2 text-xs font-semibold transition ${visiblePeriods.has('previous') ? 'text-[#59606b]' : 'text-[#a8adb5] line-through'}`}><span className={`w-7 border-t-2 border-dashed ${visiblePeriods.has('previous') ? 'border-[#9ca3af]' : 'border-[#c9cdd3]'}`} />Previous</button>}
        </div>
      </div> : <div className="mt-6 rounded-2xl bg-[#f8f9fa] p-12 text-center text-sm font-bold text-[#727782]">No daily Meta Ads data for this range.</div>)}
    </section>
  );
}
