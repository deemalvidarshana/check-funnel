import { formatPaidAdsMoney, formatPaidAdsNumber } from '../../utils/paidAdsFormatters';

const groups = [
  { key: 'awareness', label: 'Awareness', color: '#06b6d4' },
  { key: 'engagement', label: 'Engagement', color: '#8b5cf6' },
  { key: 'enquiry', label: 'Lead & enquiry', color: '#10b981' },
  { key: 'other', label: 'Other', color: '#64748b' },
];

function groupKey(campaign) {
  const objective = String(campaign.objective || '').toUpperCase();
  const result = String(campaign.resultType || '').toLowerCase();
  if (objective.includes('LEAD') || objective.includes('MESSAGE') || result.includes('lead') || result.includes('messag')) return 'enquiry';
  if (objective.includes('AWARENESS') || objective === 'REACH' || result === 'reach') return 'awareness';
  if (objective.includes('ENGAGEMENT') || result.includes('engagement') || result.includes('video')) return 'engagement';
  return 'other';
}

function ratio(numerator, denominator, multiplier = 100) {
  return Number(denominator || 0) > 0 ? (Number(numerator || 0) / Number(denominator)) * multiplier : 0;
}

export default function PaidAdsBrandEnquiryJourney({ campaigns = [], totals, currency }) {
  const allocation = groups.map(group => {
    const rows = campaigns.filter(campaign => groupKey(campaign) === group.key);
    return { ...group, campaigns: rows.length, spend: rows.reduce((sum,row) => sum + Number(row.spend || 0),0), results: [...new Set(rows.map(row => row.resultType).filter(Boolean))] };
  }).filter(group => group.campaigns || group.key !== 'other');
  const totalSpend = Math.max(1,allocation.reduce((sum,group) => sum + group.spend,0));
  const metric = key => Number(totals[key]?.current || 0);
  const funnel = [
    { label:'Impressions',value:metric('impressions'),color:'#2563eb' },
    { label:'Link clicks',value:metric('linkClicks'),color:'#06b6d4' },
    { label:'Landing-page views',value:metric('landingPageViews'),color:'#0ea5e9' },
    { label:'Leads',value:metric('leads'),color:'#10b981' },
  ];
  const leads = metric('leads');
  const messages = metric('messagingConversations');
  const registrations = metric('registrations');
  const metaFormLeads = Math.min(leads, registrations);
  const websiteOrOtherLeads = Math.max(0, leads - metaFormLeads);
  const spend = metric('spend');
  funnel[funnel.length - 1] = { ...funnel.at(-1), label: 'Website / other leads', value: websiteOrOtherLeads };

  return <section className="mt-6 rounded-3xl border border-[#c2c6d3]/30 bg-white p-5 shadow-sm sm:p-6">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><h2 className="text-lg font-extrabold text-[#191c1d]">Brand demand and enquiry journey</h2><p className="mt-1 text-xs font-semibold text-[#727782]">Campaign investment separated by objective, followed by the website enquiry path.</p></div><span className="w-fit rounded-full bg-amber-50 px-4 py-2 text-[10px] font-extrabold text-amber-700">BRAND + ENQUIRY</span></div>

    <div className="mt-5 grid gap-4 xl:grid-cols-[0.9fr_1.6fr]">
      <div className="rounded-2xl border border-[#c2c6d3]/25 p-5"><h3 className="text-sm font-extrabold text-[#273548]">Spend by campaign objective</h3><p className="mt-1 text-[10px] font-semibold text-[#8a9099]">Keeps brand results separate from lead results.</p><div className="mt-5 space-y-4">{allocation.map(group => <div key={group.key}><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold text-[#354052]">{group.label}</p><p className="mt-0.5 text-[9px] font-semibold text-[#9aa0a9]">{group.campaigns} campaign{group.campaigns === 1 ? '' : 's'} · {group.results.join(', ') || 'No primary result'}</p></div><div className="text-right"><p className="text-xs font-extrabold text-[#273548]">{formatPaidAdsMoney(group.spend,currency)}</p><p className="text-[9px] font-bold text-[#8a9099]">{ratio(group.spend,totalSpend).toFixed(1)}%</p></div></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-[#edf0f4]"><div className="h-full rounded-full" style={{width:`${Math.max(group.spend ? 4 : 0,ratio(group.spend,totalSpend))}%`,backgroundColor:group.color}}/></div></div>)}</div></div>

      <div className="rounded-2xl border border-[#c2c6d3]/25 p-5"><h3 className="text-sm font-extrabold text-[#273548]">Website traffic path</h3><p className="mt-1 text-[10px] font-semibold text-[#8a9099]">Meta instant-form registrations and messaging are excluded from this sequential website funnel.</p><div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{funnel.map((stage,index) => { const prior=index ? funnel[index-1].value : 0; return <div key={stage.label} className="rounded-2xl bg-[#f8f9fa] p-4"><div className="flex items-center justify-between"><span className="flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-black text-white" style={{backgroundColor:stage.color}}>{index+1}</span>{index > 0 && <span className="text-[9px] font-extrabold text-[#8a9099]">{prior ? `${ratio(stage.value,prior).toFixed(1)}%` : '—'}</span>}</div><p className="mt-3 text-[10px] font-bold text-[#727782]">{stage.label}</p><p className="mt-1 text-xl font-black text-[#191c1d]">{formatPaidAdsNumber(stage.value)}</p></div>; })}</div><div className="mt-4 grid gap-3 sm:grid-cols-3"><div className="rounded-2xl border border-[#edf0f2] p-4"><p className="text-[10px] font-bold text-[#8a9099]">Click → landing rate</p><p className="mt-1 text-lg font-black text-[#273548]">{ratio(metric('landingPageViews'),metric('linkClicks')).toFixed(1)}%</p></div><div className="rounded-2xl border border-[#edf0f2] p-4"><p className="text-[10px] font-bold text-[#8a9099]">Landing → website/other lead</p><p className="mt-1 text-lg font-black text-emerald-600">{ratio(websiteOrOtherLeads,metric('landingPageViews')).toFixed(2)}%</p></div><div className="rounded-2xl border border-[#edf0f2] p-4"><p className="text-[10px] font-bold text-[#8a9099]">Cost per conversation</p><p className="mt-1 text-lg font-black text-[#273548]">{formatPaidAdsMoney(messages ? spend/messages : 0,currency)}</p></div></div></div>
    </div>

    <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4"><div className="grid gap-3 sm:grid-cols-4"><div><p className="text-[10px] font-bold uppercase tracking-wide text-amber-700">All leads</p><p className="mt-1 text-lg font-black text-amber-950">{formatPaidAdsNumber(leads)}</p></div><div><p className="text-[10px] font-bold uppercase tracking-wide text-amber-700">Meta-form registrations</p><p className="mt-1 text-lg font-black text-amber-950">{formatPaidAdsNumber(metaFormLeads)}</p></div><div><p className="text-[10px] font-bold uppercase tracking-wide text-amber-700">Website / other leads</p><p className="mt-1 text-lg font-black text-amber-950">{formatPaidAdsNumber(websiteOrOtherLeads)}</p></div><div><p className="text-[10px] font-bold uppercase tracking-wide text-amber-700">Messaging conversations</p><p className="mt-1 text-lg font-black text-amber-950">{formatPaidAdsNumber(messages)}</p></div></div><p className="mt-3 text-[10px] font-semibold leading-5 text-amber-800">Meta-form leads are inferred where lead and registration actions overlap. These outcomes are intentionally not added together because the same person can appear in more than one action.</p></div>
  </section>;
}
