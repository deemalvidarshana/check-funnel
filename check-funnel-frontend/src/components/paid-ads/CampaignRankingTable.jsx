import { useEffect, useMemo, useRef, useState } from 'react';
import { formatPaidAdsMoney, formatPaidAdsNumber } from '../../utils/paidAdsFormatters';

const columns = [
  { key: 'name', label: 'Campaign Name', type: 'text' },
  { key: 'status', label: 'Delivery', type: 'status' },
  { key: 'objective', label: 'Objective', type: 'label' },
  { key: 'results', label: 'Results', type: 'number' },
  { key: 'resultType', label: 'Result Type', type: 'text' },
  { key: 'costPerResult', label: 'Cost / Result', type: 'money' },
  { key: 'budget', label: 'Budget', type: 'money' },
  { key: 'budgetType', label: 'Budget Type', type: 'label' },
  { key: 'spend', label: 'Amount Spent', type: 'money' },
  { key: 'reach', label: 'Reach', type: 'number' },
  { key: 'impressions', label: 'Impressions', type: 'number' },
  { key: 'frequency', label: 'Frequency', type: 'decimal' },
  { key: 'cpm', label: 'CPM', type: 'money' },
  { key: 'cpp', label: 'Cost / 1K Reached', type: 'money' },
  { key: 'clicks', label: 'Clicks (All)', type: 'number' },
  { key: 'uniqueClicks', label: 'Unique Clicks', type: 'number' },
  { key: 'linkClicks', label: 'Link Clicks', type: 'number' },
  { key: 'ctr', label: 'CTR (All)', type: 'percent' },
  { key: 'linkCtr', label: 'CTR (Link)', type: 'percent' },
  { key: 'cpc', label: 'CPC (All)', type: 'money' },
  { key: 'costPerLinkClick', label: 'CPC (Link)', type: 'money' },
  { key: 'landingPageViews', label: 'Landing Page Views', type: 'number' },
  { key: 'costPerLandingPageView', label: 'Cost / LPV', type: 'money' },
  { key: 'contentViews', label: 'Content Views', type: 'number' },
  { key: 'addToCart', label: 'Adds to Cart', type: 'number' },
  { key: 'initiateCheckout', label: 'Checkouts Initiated', type: 'number' },
  { key: 'purchases', label: 'Purchases', type: 'number' },
  { key: 'purchaseValue', label: 'Purchase Value', type: 'money' },
  { key: 'purchaseRoas', label: 'Purchase ROAS', type: 'roas' },
  { key: 'leads', label: 'Leads', type: 'number' },
  { key: 'costPerLead', label: 'Cost / Lead', type: 'money' },
  { key: 'messagingConversations', label: 'Messaging Conversations', type: 'number' },
  { key: 'costPerMessagingConversation', label: 'Cost / Conversation', type: 'money' },
  { key: 'postEngagements', label: 'Post Engagements', type: 'number' },
  { key: 'pageEngagements', label: 'Page Engagements', type: 'number' },
  { key: 'videoViews', label: 'Video Views', type: 'number' },
  { key: 'reactions', label: 'Reactions', type: 'number' },
  { key: 'comments', label: 'Comments', type: 'number' },
  { key: 'saves', label: 'Saves', type: 'number' },
  { key: 'searches', label: 'Searches', type: 'number' },
  { key: 'addPaymentInfo', label: 'Payment Info Added', type: 'number' },
  { key: 'registrations', label: 'Registrations', type: 'number' },
  { key: 'conversions', label: 'Conversions', type: 'number' },
  { key: 'cpa', label: 'CPA', type: 'money' },
];

const summableKeys = [
  'budget', 'spend', 'reach', 'impressions', 'clicks', 'uniqueClicks', 'linkClicks',
  'landingPageViews', 'contentViews', 'addToCart', 'initiateCheckout', 'purchases',
  'purchaseValue', 'leads', 'messagingConversations', 'postEngagements',
  'pageEngagements', 'videoViews', 'reactions', 'comments', 'saves', 'searches',
  'addPaymentInfo', 'registrations', 'conversions',
];

function statusStyle(status = '') {
  if (status.includes('ACTIVE')) return 'bg-emerald-50 text-emerald-600';
  if (status.includes('PAUSED')) return 'bg-slate-100 text-slate-500';
  return 'bg-blue-50 text-blue-600';
}

function rate(numerator, denominator, multiplier = 1) {
  return denominator > 0 ? (numerator / denominator) * multiplier : 0;
}

function RankingFilterDropdown({ value, onChange, options, allLabel, className = '' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const close = (event) => ref.current && !ref.current.contains(event.target) && setOpen(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);
  const selectedLabel = value === 'all' ? allLabel : options.find((option) => option.value === value)?.label || allLabel;
  const items = [{ value: 'all', label: allLabel }, ...options];

  return <div ref={ref} className={`relative ${className}`}>
    <button type="button" onClick={() => setOpen((current) => !current)} className="flex h-10 w-full items-center justify-between gap-4 rounded-full border border-[#c2c6d3]/30 bg-white px-4 text-xs font-bold text-[#003870] shadow-sm transition hover:bg-[#f8f9fa]" aria-expanded={open}>
      <span className="truncate text-left">{selectedLabel}</span>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}><polyline points="6 9 12 15 18 9" /></svg>
    </button>
    {open && <div className="absolute right-0 top-full z-50 mt-2 max-h-64 min-w-full overflow-y-auto rounded-2xl border border-[#c2c6d3]/20 bg-white py-1 shadow-xl">
      {items.map((option) => <button key={option.value} type="button" onClick={() => { onChange(option.value); setOpen(false); }} className={`block w-full whitespace-nowrap px-4 py-3 text-left text-sm font-bold transition hover:bg-[#f3f4f5] ${value === option.value ? 'bg-[#003870]/5 text-[#003870]' : 'text-[#727782]'}`}>{option.label}</button>)}
    </div>}
  </div>;
}

export default function CampaignRankingTable({ campaigns, totals, currency }) {
  const [query, setQuery] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [deliveryFilter, setDeliveryFilter] = useState('all');
  const [objectiveFilter, setObjectiveFilter] = useState('all');
  const [resultTypeFilter, setResultTypeFilter] = useState('all');
  const filterOptions = useMemo(() => ({
    deliveries: [...new Set(campaigns.map((campaign) => campaign.status).filter(Boolean))].sort(),
    objectives: [...new Set(campaigns.map((campaign) => campaign.objective).filter(Boolean))].sort(),
    resultTypes: [...new Set(campaigns.map((campaign) => campaign.resultType).filter(Boolean))].sort(),
  }), [campaigns]);
  const currentSpend = totals.spend.current;
  const currentReach = totals.reach.current;
  const currentImpressions = totals.impressions.current;
  const currentClicks = totals.clicks.current;
  const currentConversions = totals.conversions.current;
  const rows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return campaigns
      .filter((campaign) => !normalizedQuery || [campaign.name, campaign.objective, campaign.status, campaign.resultType]
        .some((value) => String(value || '').toLowerCase().includes(normalizedQuery)))
      .filter((campaign) => deliveryFilter === 'all' || campaign.status === deliveryFilter)
      .filter((campaign) => objectiveFilter === 'all' || campaign.objective === objectiveFilter)
      .filter((campaign) => resultTypeFilter === 'all' || campaign.resultType === resultTypeFilter)
      .sort((a, b) => {
        const activeOrder = Number(String(b.status || '').toUpperCase() === 'ACTIVE')
          - Number(String(a.status || '').toUpperCase() === 'ACTIVE');
        return activeOrder || Number(b.spend || 0) - Number(a.spend || 0);
      });
  }, [campaigns, query, deliveryFilter, objectiveFilter, resultTypeFilter]);
  const visibleRows = showAll ? rows : rows.slice(0, 5);

  const total = useMemo(() => {
    const row = {
      name: 'Total',
      status: '',
      objective: `${campaigns.length} Campaigns`,
      results: null,
      resultType: 'Mixed results',
      budgetType: 'Mixed',
    };
    summableKeys.forEach((key) => {
      row[key] = campaigns.reduce((sum, campaign) => sum + Number(campaign[key] || 0), 0);
    });
    row.spend = Number(currentSpend || row.spend || 0);
    row.reach = Number(currentReach || row.reach || 0);
    row.impressions = Number(currentImpressions || row.impressions || 0);
    row.clicks = Number(currentClicks || row.clicks || 0);
    row.conversions = Number(currentConversions || row.conversions || 0);
    row.frequency = rate(row.impressions, row.reach);
    row.cpm = rate(row.spend, row.impressions, 1000);
    row.cpp = rate(row.spend, row.reach, 1000);
    row.ctr = rate(row.clicks, row.impressions, 100);
    row.linkCtr = rate(row.linkClicks, row.impressions, 100);
    row.cpc = rate(row.spend, row.clicks);
    row.costPerLinkClick = rate(row.spend, row.linkClicks);
    row.costPerLandingPageView = rate(row.spend, row.landingPageViews);
    row.costPerLead = rate(row.spend, row.leads);
    row.costPerMessagingConversation = rate(row.spend, row.messagingConversations);
    row.purchaseRoas = rate(row.purchaseValue, row.spend);
    row.cpa = rate(row.spend, row.conversions);
    return row;
  }, [campaigns, currentClicks, currentConversions, currentImpressions, currentReach, currentSpend]);

  const display = (row, column) => {
    const value = row[column.key];
    if (column.type === 'status') {
      return value ? <span className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold ${statusStyle(value)}`}>{value.replaceAll('_', ' ')}</span> : '';
    }
    if (value === null || value === undefined || value === '') return '—';
    if (column.type === 'money') return formatPaidAdsMoney(value, currency);
    if (column.type === 'percent') return `${Number(value).toFixed(2)}%`;
    if (column.type === 'decimal') return Number(value).toFixed(2);
    if (column.type === 'roas') return `${Number(value).toFixed(2)}x`;
    if (column.type === 'number') return formatPaidAdsNumber(value);
    if (column.type === 'label') return String(value).replaceAll('_', ' ');
    return value;
  };

  return (
    <section className="mt-6 rounded-3xl border border-[#c2c6d3]/30 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex min-w-0 flex-col gap-4 2xl:flex-row 2xl:items-center 2xl:justify-between">
        <div>
          <h2 className="text-lg font-extrabold text-[#191c1d]">Campaign Ranking</h2>
          <p className="mt-1 text-[11px] font-semibold text-[#727782]">Meta campaign delivery, costs and objective-specific results</p>
        </div>
        <div className="grid w-full min-w-0 grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-[minmax(220px,1.35fr)_minmax(140px,0.8fr)_minmax(160px,1fr)_minmax(160px,1fr)_auto] 2xl:max-w-[980px]">
          <label className="flex h-10 w-full min-w-0 items-center gap-2 rounded-full border border-[#c2c6d3]/30 px-4 shadow-sm">
            <span className="text-[#727782]">⌕</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} className="min-w-0 flex-1 bg-transparent text-xs outline-none" placeholder="Search campaigns..." />
          </label>
          <RankingFilterDropdown value={deliveryFilter} onChange={setDeliveryFilter} allLabel="All Delivery" className="w-full min-w-0" options={filterOptions.deliveries.map((status) => ({ value: status, label: status.replaceAll('_', ' ') }))} />
          <RankingFilterDropdown value={objectiveFilter} onChange={setObjectiveFilter} allLabel="All Objectives" className="w-full min-w-0" options={filterOptions.objectives.map((objective) => ({ value: objective, label: objective.replaceAll('_', ' ') }))} />
          <RankingFilterDropdown value={resultTypeFilter} onChange={setResultTypeFilter} allLabel="All Result Types" className="w-full min-w-0" options={filterOptions.resultTypes.map((resultType) => ({ value: resultType, label: resultType }))} />
          <button onClick={() => setShowAll((value) => !value)} className="h-10 w-full whitespace-nowrap rounded-full border border-[#c2c6d3]/30 px-5 text-xs font-bold text-[#003870] shadow-sm">
            {showAll ? 'Show Top 5' : 'View All'}
          </button>
        </div>
      </div>
      <div className="mt-4 overflow-x-auto rounded-2xl border border-[#c2c6d3]/25">
        <table className="w-max min-w-full border-collapse text-left">
          <thead className="bg-[#f8f9fa]">
            <tr>{columns.map((column) => <th key={column.key} className={`border-b border-[#e5e7eb] px-3 py-3 text-[11px] font-extrabold text-[#5d6470] whitespace-nowrap ${column.key === 'name' ? 'min-w-[220px]' : ''}`}>{column.label}</th>)}</tr>
          </thead>
          <tbody>
            {visibleRows.map((row) => <tr key={row.id} className="hover:bg-[#f8f9fa]/80">{columns.map((column) => <td key={column.key} className="border-b border-[#edf0f2] px-3 py-3 text-[11px] font-semibold text-[#354052] whitespace-nowrap">{display(row, column)}</td>)}</tr>)}
            {!visibleRows.length && <tr><td colSpan={columns.length} className="px-4 py-10 text-center text-sm font-bold text-[#727782]">No campaigns found for this month.</td></tr>}
            <tr className="bg-[#f8f9fa]">{columns.map((column) => <td key={column.key} className="px-3 py-3 text-[11px] font-extrabold text-[#273548] whitespace-nowrap">{display(total, column)}</td>)}</tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}
