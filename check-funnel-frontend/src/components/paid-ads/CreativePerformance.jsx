import { useEffect, useMemo, useRef, useState } from 'react';

const rankingOptions = [
  { key: 'spend', label: 'Spend' },
  { key: 'reach', label: 'Reach' },
  { key: 'ctr', label: 'CTR' },
  { key: 'conversions', label: 'Conversions' },
];

const ecommerceRankingOptions = [
  { key: 'purchaseValue', label: 'Purchase Revenue' },
  { key: 'purchases', label: 'Purchases' },
  { key: 'purchaseRoas', label: 'Purchase ROAS' },
  { key: 'spend', label: 'Spend' },
];

const brandEnquiryRankingOptions = [
  { key: 'leads', label: 'Leads' },
  { key: 'messagingConversations', label: 'Messages' },
  { key: 'postEngagements', label: 'Engagements' },
  { key: 'reach', label: 'Reach' },
  { key: 'spend', label: 'Spend' },
];

function compactNumber(value) {
  const number = Number(value || 0);
  if (number >= 1_000_000) return `${(number / 1_000_000).toFixed(1).replace('.0', '')}M`;
  if (number >= 1_000) return `${(number / 1_000).toFixed(1).replace('.0', '')}K`;
  return number.toLocaleString();
}

function compactMoney(value, currency) {
  const number = Number(value || 0);
  const amount = number >= 1_000_000
    ? `${(number / 1_000_000).toFixed(1).replace('.0', '')}M`
    : number >= 1_000
      ? `${(number / 1_000).toFixed(1).replace('.0', '')}K`
      : number.toLocaleString(undefined, { maximumFractionDigits: 0 });
  return `${currency} ${amount}`;
}

function MetricIcon({ type }) {
  if (type === 'spend') return <path d="M12 2v20M17 5.5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />;
  if (type === 'reach') return <><circle cx="9" cy="8" r="3" /><path d="M3 20v-1a6 6 0 0 1 12 0v1M16 5.5a3 3 0 0 1 0 5.5M18 14a5 5 0 0 1 3 4.5V20" /></>;
  if (type === 'ctr') return <><path d="M4 17 10 11l4 4 6-7" /><path d="M14 8h6v6" /></>;
  return <><path d="M12 3v18M3 12h18" /><circle cx="12" cy="12" r="9" /></>;
}

function CreativeCard({ creative, currency, mode }) {
  const [failedImage, setFailedImage] = useState('');
  const showFallback = !creative.thumbnailUrl || failedImage === creative.thumbnailUrl;
  const metrics = mode === 'ecommerce' ? [
    { key: 'spend', value: compactMoney(creative.spend, currency) },
    { key: 'purchases', value: `${compactNumber(creative.purchases)} purchases` },
    { key: 'purchaseValue', value: compactMoney(creative.purchaseValue, currency) },
    { key: 'purchaseRoas', value: `${Number(creative.purchaseRoas || 0).toFixed(2)}x ROAS` },
  ] : mode === 'brand-enquiry' ? [
    { key: 'spend', value: compactMoney(creative.spend, currency) },
    { key: 'reach', value: `${compactNumber(creative.reach)} reached` },
    { key: 'leads', value: `${compactNumber(creative.leads)} leads` },
    { key: 'messages', value: `${compactNumber(creative.messagingConversations)} messages` },
  ] : [
    { key: 'spend', value: compactMoney(creative.spend, currency) },
    { key: 'reach', value: compactNumber(creative.reach) },
    { key: 'ctr', value: `${Number(creative.ctr || 0).toFixed(2)}%` },
    { key: 'conversions', value: compactNumber(creative.conversions) },
  ];

  return (
    <article className="flex w-[180px] shrink-0 flex-col">
      <div className="group relative mb-3 aspect-[9/16] w-full overflow-hidden rounded-[24px] bg-[#f3f4f5] shadow-sm">
        {showFallback ? (
          <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,#003870,#2d6cb4)]"><span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 text-2xl font-black text-white">M</span></div>
        ) : (
          <img src={creative.thumbnailUrl} alt={creative.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" referrerPolicy="no-referrer" onError={() => setFailedImage(creative.thumbnailUrl)} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/5" />
        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[9px] font-extrabold text-[#0866ff] shadow-sm backdrop-blur">META</span>
        <span className="absolute bottom-3 left-3 max-w-[150px] truncate rounded-full bg-black/25 px-2.5 py-1 text-[9px] font-bold text-white backdrop-blur" title={creative.status}>{creative.status.replaceAll('_', ' ')}</span>
      </div>

      <div className="px-1">
        <h3 className="line-clamp-1 text-[13px] font-bold leading-snug text-[#191c1d]" title={creative.name}>{creative.name}</h3>
        <p className="mt-1 line-clamp-1 text-[10px] font-semibold text-[#8a9099]" title={creative.campaignName}>{creative.campaignName}</p>
        <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 border-t border-[#edf0f2] pt-3">
          {metrics.map(metric => (
            <div key={metric.key} className="flex min-w-0 items-center gap-1.5 text-[#727782]">
              <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><MetricIcon type={metric.key} /></svg>
              <span className="truncate text-[10px] font-bold" title={metric.value}>{metric.value}</span>
            </div>
          ))}
        </div>
      </div>
    </article>
  );
}

export default function CreativePerformance({ creatives = [], currency, mode = 'all' }) {
  const options = mode === 'ecommerce' ? ecommerceRankingOptions : mode === 'brand-enquiry' ? brandEnquiryRankingOptions : rankingOptions;
  const [ranking, setRanking] = useState(mode === 'ecommerce' ? 'purchaseValue' : mode === 'brand-enquiry' ? 'leads' : 'spend');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const dropdownRef = useRef(null);
  const itemsPerPage = 10;

  useEffect(() => {
    const close = event => dropdownRef.current && !dropdownRef.current.contains(event.target) && setDropdownOpen(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);
  const rankedCreatives = useMemo(() => [...creatives].sort((a, b) => Number(b[ranking] || 0) - Number(a[ranking] || 0)), [creatives, ranking]);
  const totalPages = Math.max(1, Math.ceil(rankedCreatives.length / itemsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const visibleCreatives = rankedCreatives.slice((safePage - 1) * itemsPerPage, safePage * itemsPerPage);
  const rankingLabel = options.find(option => option.key === ranking)?.label;

  return (
    <section className="mt-6 flex w-full flex-col rounded-3xl border border-[#c2c6d3]/30 bg-white p-6 shadow-sm">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div><h2 className="text-lg font-bold text-[#191c1d]">{mode === 'ecommerce' ? 'Ecommerce creative performance' : mode === 'brand-enquiry' ? 'Brand and enquiry creative performance' : 'Creative Performance'}</h2><p className="mt-1 text-xs font-semibold text-[#727782]">{mode === 'ecommerce' ? 'Ads ranked by purchase revenue and sales efficiency' : mode === 'brand-enquiry' ? 'Compare which ads create reach, leads and messaging conversations' : 'Ads from the selected month'}</p></div>
        <div className="relative" ref={dropdownRef}>
          <button onClick={() => setDropdownOpen(value => !value)} className="flex h-10 items-center gap-3 rounded-full border border-[#c2c6d3]/20 bg-[#f3f4f5]/50 px-5 font-bold text-[#003870] shadow-sm transition-all hover:bg-[#f3f4f5]">
            <span className="text-sm">Rank by {rankingLabel}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className={`text-[#727782] transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}><polyline points="6 9 12 15 18 9" /></svg>
          </button>
          {dropdownOpen && <div className="absolute right-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-2xl border border-[#c2c6d3]/20 bg-white py-1 shadow-xl">{options.map(option => <button key={option.key} onClick={() => { setRanking(option.key); setCurrentPage(1); setDropdownOpen(false); }} className={`w-full px-4 py-2.5 text-left text-sm font-bold transition hover:bg-[#f3f4f5] ${ranking === option.key ? 'bg-[#003870]/5 text-[#003870]' : 'text-[#727782]'}`}>{option.label}</button>)}</div>}
        </div>
      </div>

      {visibleCreatives.length ? (
        <>
          <div className="no-scrollbar flex gap-5 overflow-x-auto pb-4">{visibleCreatives.map(creative => <CreativeCard key={creative.id} creative={creative} currency={currency} mode={mode} />)}</div>
          {totalPages > 1 && <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
            <div className="text-xs font-bold text-[#727782]">Page <span className="text-[#003870]">{safePage}</span> of {totalPages}</div>
            <div className="flex items-center gap-2">
              <button onClick={() => setCurrentPage(page => Math.max(1, page - 1))} disabled={safePage === 1} className={`rounded-full p-2 transition-all ${safePage === 1 ? 'cursor-not-allowed text-slate-300' : 'text-[#003870] hover:bg-slate-100'}`} aria-label="Previous creative page"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6" /></svg></button>
              <button onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))} disabled={safePage === totalPages} className={`rounded-full p-2 transition-all ${safePage === totalPages ? 'cursor-not-allowed text-slate-300' : 'text-[#003870] hover:bg-slate-100'}`} aria-label="Next creative page"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg></button>
            </div>
          </div>}
        </>
      ) : <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 py-10 text-center text-sm font-medium text-slate-500">No creative performance data for this month.</div>}
    </section>
  );
}
