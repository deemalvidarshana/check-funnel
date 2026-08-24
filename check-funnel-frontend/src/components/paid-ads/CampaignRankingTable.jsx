import { useMemo, useState } from 'react';
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

export default function CampaignRankingTable({ campaigns, totals, currency }) {
  const [query, setQuery] = useState('');
  const [showAll, setShowAll] = useState(false);
  const rows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return campaigns
      .filter((campaign) => !normalizedQuery || [campaign.name, campaign.objective, campaign.status, campaign.resultType]
        .some((value) => String(value || '').toLowerCase().includes(normalizedQuery)))
      .sort((a, b) => b.spend - a.spend);
  }, [campaigns, query]);
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
    row.spend = Number(totals.spend.current || row.spend || 0);
    row.reach = Number(totals.reach.current || row.reach || 0);
    row.impressions = Number(totals.impressions.current || row.impressions || 0);
    row.clicks = Number(totals.clicks.current || row.clicks || 0);
    row.conversions = Number(totals.conversions.current || row.conversions || 0);
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
  }, [campaigns, totals]);

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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-extrabold text-[#191c1d]">Campaign Ranking</h2>
          <p className="mt-1 text-[11px] font-semibold text-[#727782]">Meta campaign delivery, costs and objective-specific results</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-full border border-[#c2c6d3]/30 px-4 shadow-sm sm:w-72">
            <span className="text-[#727782]">⌕</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} className="min-w-0 flex-1 bg-transparent text-xs outline-none" placeholder="Search campaigns..." />
          </label>
          <button onClick={() => setShowAll((value) => !value)} className="h-10 rounded-full border border-[#c2c6d3]/30 px-5 text-xs font-bold text-[#003870] shadow-sm">
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
