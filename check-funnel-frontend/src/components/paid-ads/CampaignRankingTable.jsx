import { useMemo, useState } from 'react';
import { formatPaidAdsMoney, formatPaidAdsNumber } from '../../utils/paidAdsFormatters';

const columns = [['name','Campaign Name'],['status','Status'],['objective','Objective'],['budget','Budget'],['spend','Spend'],['reach','Reach'],['impressions','Impressions'],['clicks','Clicks'],['ctr','CTR'],['cpc','CPC'],['conversions','Conversions'],['cpa','CPA']];

function statusStyle(status) {
  if (status.includes('ACTIVE')) return 'bg-emerald-50 text-emerald-600';
  if (status.includes('PAUSED')) return 'bg-slate-100 text-slate-500';
  return 'bg-blue-50 text-blue-600';
}

export default function CampaignRankingTable({ campaigns, totals, currency }) {
  const [query, setQuery] = useState('');
  const [showAll, setShowAll] = useState(false);
  const rows = useMemo(() => campaigns.filter((campaign) => campaign.name.toLowerCase().includes(query.toLowerCase())).sort((a,b) => b.spend - a.spend), [campaigns, query]);
  const visibleRows = showAll ? rows : rows.slice(0, 5);
  const budgetTotal = campaigns.reduce((sum, row) => sum + Number(row.budget || 0), 0);
  const display = (row, key) => {
    if (key === 'status') return <span className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold ${statusStyle(row.status)}`}>{row.status.replaceAll('_', ' ')}</span>;
    if (['budget','spend','cpc','cpa'].includes(key)) return row[key] == null ? '—' : formatPaidAdsMoney(row[key], currency);
    if (key === 'ctr') return `${Number(row[key] || 0).toFixed(2)}%`;
    if (['reach','impressions','clicks','conversions'].includes(key)) return formatPaidAdsNumber(row[key]);
    return row[key] || '—';
  };
  const total = { name:'Total', status:'', objective:`${campaigns.length} Campaigns`, budget:budgetTotal, spend:totals.spend.current, reach:totals.reach.current, impressions:totals.impressions.current, clicks:totals.clicks.current, ctr:totals.ctr.current, cpc:totals.cpc.current, conversions:totals.conversions.current, cpa:totals.cpa.current };

  return <section className="mt-6 rounded-3xl border border-[#c2c6d3]/30 bg-white p-5 shadow-sm sm:p-6"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><h2 className="text-lg font-extrabold text-[#191c1d]">Campaign Ranking</h2><div className="flex items-center gap-3"><label className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-full border border-[#c2c6d3]/30 px-4 shadow-sm sm:w-72"><span className="text-[#727782]">⌕</span><input value={query} onChange={(event)=>setQuery(event.target.value)} className="min-w-0 flex-1 bg-transparent text-xs outline-none" placeholder="Search campaigns..." /></label><button onClick={()=>setShowAll((value)=>!value)} className="h-10 rounded-full border border-[#c2c6d3]/30 px-5 text-xs font-bold text-[#003870] shadow-sm">{showAll ? 'Show Top 5' : 'View All'}</button></div></div><div className="mt-4 overflow-x-auto rounded-2xl border border-[#c2c6d3]/25"><table className="w-full min-w-[1180px] border-collapse text-left"><thead className="bg-[#f8f9fa]"><tr>{columns.map(([key,label])=><th key={key} className={`border-b border-[#e5e7eb] px-3 py-3 text-[11px] font-extrabold text-[#5d6470] ${key==='name'?'min-w-[195px]':'whitespace-nowrap'}`}>{label}</th>)}</tr></thead><tbody>{visibleRows.map((row)=><tr key={row.id} className="hover:bg-[#f8f9fa]/80">{columns.map(([key])=><td key={key} className="border-b border-[#edf0f2] px-3 py-3 text-[11px] font-semibold text-[#354052] whitespace-nowrap">{display(row,key)}</td>)}</tr>)}{!visibleRows.length&&<tr><td colSpan={columns.length} className="px-4 py-10 text-center text-sm font-bold text-[#727782]">No campaigns found for this month.</td></tr>}<tr className="bg-[#f8f9fa]">{columns.map(([key])=><td key={key} className="px-3 py-3 text-[11px] font-extrabold text-[#273548] whitespace-nowrap">{key==='status'?'':display(total,key)}</td>)}</tr></tbody></table></div></section>;
}
