import { useEffect, useMemo, useRef, useState } from 'react';
import { formatPaidAdsMoney, formatPaidAdsNumber } from '../../utils/paidAdsFormatters';

function statusStyle(status='') {
  if (status.includes('ACTIVE')) return 'bg-emerald-50 text-emerald-600';
  if (status.includes('PAUSED')) return 'bg-slate-100 text-slate-500';
  return 'bg-blue-50 text-blue-600';
}

function resultStyle(type='') {
  const value=type.toLowerCase();
  if (value.includes('lead') || value.includes('messag')) return 'bg-emerald-50 text-emerald-700';
  if (value.includes('engagement')) return 'bg-violet-50 text-violet-700';
  if (value.includes('reach') || value.includes('video')) return 'bg-cyan-50 text-cyan-700';
  return 'bg-slate-100 text-slate-600';
}

function ResultTypeDropdown({value,onChange,types}) {
  const [open,setOpen]=useState(false);
  const ref=useRef(null);
  useEffect(()=>{const close=event=>ref.current&&!ref.current.contains(event.target)&&setOpen(false);document.addEventListener('mousedown',close);return()=>document.removeEventListener('mousedown',close);},[]);
  const options=['all',...types];
  return <div ref={ref} className="relative min-w-0 flex-1 sm:w-48 sm:flex-none"><button type="button" onClick={()=>setOpen(current=>!current)} className="flex h-10 w-full items-center justify-between gap-3 rounded-full border border-[#c2c6d3]/30 bg-white px-4 text-xs font-bold text-[#003870] shadow-sm"><span className="truncate">{value==='all'?'All Result Types':value}</span><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`shrink-0 transition-transform ${open?'rotate-180':''}`}><polyline points="6 9 12 15 18 9"/></svg></button>{open&&<div className="absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-[#c2c6d3]/20 bg-white py-1 shadow-xl">{options.map(option=><button key={option} type="button" onClick={()=>{onChange(option);setOpen(false);}} className={`block w-full px-4 py-3 text-left text-xs font-bold transition hover:bg-[#f3f4f5] ${value===option?'bg-[#003870]/5 text-[#003870]':'text-[#727782]'}`}>{option==='all'?'All Result Types':option}</button>)}</div>}</div>;
}

export default function PaidAdsBrandEnquiryCampaigns({campaigns=[],currency}) {
  const [query,setQuery]=useState('');
  const [resultFilter,setResultFilter]=useState('all');
  const [showAll,setShowAll]=useState(false);
  const types=useMemo(() => [...new Set(campaigns.map(campaign=>campaign.resultType).filter(Boolean))].sort(),[campaigns]);
  const rows=useMemo(() => campaigns.filter(campaign => (!query.trim() || `${campaign.name} ${campaign.objective} ${campaign.resultType}`.toLowerCase().includes(query.trim().toLowerCase())) && (resultFilter==='all' || campaign.resultType===resultFilter)).sort((a,b) => Number(b.spend||0)-Number(a.spend||0)),[campaigns,query,resultFilter]);
  const visible=showAll?rows:rows.slice(0,8);

  return <section className="mt-6 rounded-3xl border border-[#c2c6d3]/30 bg-white p-5 shadow-sm sm:p-6"><div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between"><div><h2 className="text-lg font-extrabold text-[#191c1d]">Campaign results by objective</h2><p className="mt-1 text-xs font-semibold text-[#727782]">Each campaign keeps its own Meta Result Type instead of using one generic conversion.</p></div><div className="flex w-full flex-col gap-2 sm:flex-row xl:w-auto"><label className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-full border border-[#c2c6d3]/30 px-4 shadow-sm sm:w-64"><span className="text-[#727782]">⌕</span><input value={query} onChange={event=>setQuery(event.target.value)} className="min-w-0 flex-1 bg-transparent text-xs outline-none" placeholder="Search campaigns..."/></label><ResultTypeDropdown value={resultFilter} onChange={setResultFilter} types={types}/><button type="button" onClick={()=>setShowAll(value=>!value)} className="h-10 shrink-0 rounded-full border border-[#c2c6d3]/30 px-5 text-xs font-bold text-[#003870] shadow-sm">{showAll?'Top 8':'View all'}</button></div></div>
    <div className="mt-4 overflow-x-auto rounded-2xl border border-[#c2c6d3]/25"><table className="w-max min-w-full border-collapse text-left"><thead className="bg-[#f8f9fa]"><tr>{['Campaign','Delivery','Objective','Result type','Primary result','Cost / result','Spend','Reach','Frequency','Post engagements','Video views','Landing views','Leads','Messages','Cost / lead','Cost / message'].map(label=><th key={label} className="whitespace-nowrap border-b border-[#e5e7eb] px-4 py-3 text-[11px] font-extrabold text-[#5d6470]">{label}</th>)}</tr></thead><tbody>
      {visible.map(row=><tr key={row.id} className="hover:bg-[#f8f9fa]/80"><td className="min-w-[240px] border-b border-[#edf0f2] px-4 py-3 text-[11px] font-bold text-[#273548]">{row.name}</td><td className="border-b border-[#edf0f2] px-4 py-3"><span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-extrabold ${statusStyle(row.status)}`}>{String(row.status||'UNKNOWN').replaceAll('_',' ')}</span></td><td className="border-b border-[#edf0f2] px-4 py-3 text-[10px] font-bold text-[#59606b]">{String(row.objective||'—').replaceAll('_',' ')}</td><td className="border-b border-[#edf0f2] px-4 py-3"><span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-extrabold ${resultStyle(row.resultType)}`}>{row.resultType||'—'}</span></td><td className="border-b border-[#edf0f2] px-4 py-3 text-[11px] font-extrabold">{formatPaidAdsNumber(row.results)}</td><td className="border-b border-[#edf0f2] px-4 py-3 text-[11px] font-semibold">{formatPaidAdsMoney(row.costPerResult,currency)}</td><td className="border-b border-[#edf0f2] px-4 py-3 text-[11px] font-semibold">{formatPaidAdsMoney(row.spend,currency)}</td><td className="border-b border-[#edf0f2] px-4 py-3 text-[11px] font-semibold">{formatPaidAdsNumber(row.reach)}</td><td className="border-b border-[#edf0f2] px-4 py-3 text-[11px] font-semibold">{Number(row.frequency||0).toFixed(2)}</td><td className="border-b border-[#edf0f2] px-4 py-3 text-[11px] font-semibold">{formatPaidAdsNumber(row.postEngagements)}</td><td className="border-b border-[#edf0f2] px-4 py-3 text-[11px] font-semibold">{formatPaidAdsNumber(row.videoViews)}</td><td className="border-b border-[#edf0f2] px-4 py-3 text-[11px] font-semibold">{formatPaidAdsNumber(row.landingPageViews)}</td><td className="border-b border-[#edf0f2] px-4 py-3 text-[11px] font-extrabold text-emerald-700">{formatPaidAdsNumber(row.leads)}</td><td className="border-b border-[#edf0f2] px-4 py-3 text-[11px] font-extrabold text-teal-700">{formatPaidAdsNumber(row.messagingConversations)}</td><td className="border-b border-[#edf0f2] px-4 py-3 text-[11px] font-semibold">{formatPaidAdsMoney(row.costPerLead,currency)}</td><td className="border-b border-[#edf0f2] px-4 py-3 text-[11px] font-semibold">{formatPaidAdsMoney(row.costPerMessagingConversation,currency)}</td></tr>)}
      {!visible.length&&<tr><td colSpan="16" className="px-4 py-12 text-center text-sm font-bold text-[#727782]">No campaigns match this Result Type.</td></tr>}
    </tbody></table></div>
  </section>;
}
