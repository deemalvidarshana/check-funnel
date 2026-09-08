import { useEffect, useMemo, useRef, useState } from 'react';
import PaidAdsCreativeDetailsModal from './PaidAdsCreativeDetailsModal';

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

function CreativeFilterDropdown({ value, options, open, onToggle, onChange, width = 'w-[165px]' }) {
  const selected = options.find(option => option.value === value) || options[0];
  return <div className={`relative ${width}`}>
    <button type="button" onClick={onToggle} className="flex h-10 w-full items-center justify-between gap-3 rounded-full border border-[#c2c6d3]/20 bg-[#f3f4f5]/50 px-4 font-bold text-[#003870] shadow-sm transition-all hover:bg-[#f3f4f5]" aria-expanded={open}>
      <span className="truncate text-left text-xs">{selected.label}</span>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className={`shrink-0 text-[#727782] transition-transform duration-200 ${open ? 'rotate-180' : ''}`}><polyline points="6 9 12 15 18 9" /></svg>
    </button>
    {open && <div className="absolute right-0 top-full z-50 mt-2 max-h-64 w-full min-w-48 overflow-y-auto rounded-2xl border border-[#c2c6d3]/20 bg-white py-1 shadow-xl">{options.map(option => <button key={option.value} type="button" onClick={() => onChange(option.value)} className={`w-full px-4 py-2.5 text-left text-xs font-bold transition hover:bg-[#f3f4f5] ${value === option.value ? 'bg-[#003870]/5 text-[#003870]' : 'text-[#727782]'}`}>{option.label}</button>)}</div>}
  </div>;
}

function CreativeCard({ creative, currency, mode, onOpenDetails }) {
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
        <button type="button" onClick={() => onOpenDetails(creative)} className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/30 text-white opacity-100 shadow-lg backdrop-blur-md transition hover:bg-white/45 active:scale-90 md:opacity-0 md:group-hover:opacity-100" aria-label={`View details for ${creative.name}`}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="12" cy="12" r="10" /><path d="M12 11v5M12 8h.01" /></svg></button>
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
  const [openDropdown, setOpenDropdown] = useState('');
  const [delivery, setDelivery] = useState('all');
  const [campaign, setCampaign] = useState('all');
  const [resultFilter, setResultFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCreative, setSelectedCreative] = useState(null);
  const dropdownRef = useRef(null);
  const itemsPerPage = 10;

  useEffect(() => {
    const close = event => dropdownRef.current && !dropdownRef.current.contains(event.target) && setOpenDropdown('');
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);
  const campaignOptions = useMemo(() => [
    { value: 'all', label: 'All Campaigns' },
    ...[...new Set(creatives.map(creative => creative.campaignName).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b))
      .map(name => ({ value: name, label: name })),
  ], [creatives]);
  const resultOptions = mode === 'ecommerce' ? [
    { value: 'all', label: 'All Purchase Results' },
    { value: 'with-purchases', label: 'With Purchases' },
    { value: 'no-purchases', label: 'No Purchases' },
  ] : mode === 'brand-enquiry' ? [
    { value: 'all', label: 'All Enquiry Results' },
    { value: 'with-leads', label: 'With Leads' },
    { value: 'with-messages', label: 'With Messages' },
    { value: 'engagement-only', label: 'Engagement Only' },
    { value: 'no-enquiries', label: 'No Enquiries' },
  ] : [
    { value: 'all', label: 'All Conversion Results' },
    { value: 'with-conversions', label: 'With Conversions' },
    { value: 'no-conversions', label: 'No Conversions' },
  ];
  const effectiveCampaign = campaignOptions.some(option => option.value === campaign) ? campaign : 'all';
  const rankedCreatives = useMemo(() => creatives
    .filter(creative => {
      const status = String(creative.status || '').toUpperCase();
      if (delivery === 'active') return status === 'ACTIVE' || status.endsWith('_ACTIVE');
      if (delivery === 'paused') return status === 'PAUSED' || status.includes('_PAUSED');
      return true;
    })
    .filter(creative => effectiveCampaign === 'all' || creative.campaignName === effectiveCampaign)
    .filter(creative => {
      if (resultFilter === 'all') return true;
      if (resultFilter === 'with-purchases') return Number(creative.purchases || 0) > 0;
      if (resultFilter === 'no-purchases') return Number(creative.purchases || 0) === 0;
      if (resultFilter === 'with-leads') return Number(creative.leads || 0) > 0;
      if (resultFilter === 'with-messages') return Number(creative.messagingConversations || 0) > 0;
      if (resultFilter === 'engagement-only') return Number(creative.postEngagements || 0) > 0 && Number(creative.leads || 0) === 0 && Number(creative.messagingConversations || 0) === 0;
      if (resultFilter === 'no-enquiries') return Number(creative.leads || 0) === 0 && Number(creative.messagingConversations || 0) === 0;
      if (resultFilter === 'with-conversions') return Number(creative.conversions || 0) > 0;
      if (resultFilter === 'no-conversions') return Number(creative.conversions || 0) === 0;
      return true;
    })
    .sort((a, b) => Number(b[ranking] || 0) - Number(a[ranking] || 0)), [creatives, ranking, delivery, effectiveCampaign, resultFilter]);
  const totalPages = Math.max(1, Math.ceil(rankedCreatives.length / itemsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const visibleCreatives = rankedCreatives.slice((safePage - 1) * itemsPerPage, safePage * itemsPerPage);
  const changeFilter = (setter, value) => {
    setter(value);
    setCurrentPage(1);
    setOpenDropdown('');
  };

  return (
    <section className="mt-6 flex w-full flex-col rounded-3xl border border-[#c2c6d3]/30 bg-white p-6 shadow-sm">
      <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div><h2 className="text-lg font-bold text-[#191c1d]">{mode === 'ecommerce' ? 'Ecommerce creative performance' : mode === 'brand-enquiry' ? 'Brand and enquiry creative performance' : 'Creative Performance'}</h2><p className="mt-1 text-xs font-semibold text-[#727782]">{mode === 'ecommerce' ? 'Ads ranked by purchase revenue and sales efficiency' : mode === 'brand-enquiry' ? 'Compare which ads create reach, leads and messaging conversations' : 'Ads from the selected month'}</p></div>
        <div className="flex w-full flex-wrap items-center gap-2 xl:w-auto xl:justify-end" ref={dropdownRef}>
          <CreativeFilterDropdown value={delivery} open={openDropdown === 'delivery'} onToggle={() => setOpenDropdown(value => value === 'delivery' ? '' : 'delivery')} onChange={value => changeFilter(setDelivery, value)} width="w-[145px]" options={[{ value: 'all', label: 'All Delivery' }, { value: 'active', label: 'Active' }, { value: 'paused', label: 'Paused' }]} />
          <CreativeFilterDropdown value={effectiveCampaign} open={openDropdown === 'campaign'} onToggle={() => setOpenDropdown(value => value === 'campaign' ? '' : 'campaign')} onChange={value => changeFilter(setCampaign, value)} width="w-[190px]" options={campaignOptions} />
          <CreativeFilterDropdown value={resultFilter} open={openDropdown === 'results'} onToggle={() => setOpenDropdown(value => value === 'results' ? '' : 'results')} onChange={value => changeFilter(setResultFilter, value)} width="w-[180px]" options={resultOptions} />
          <CreativeFilterDropdown value={ranking} open={openDropdown === 'ranking'} onToggle={() => setOpenDropdown(value => value === 'ranking' ? '' : 'ranking')} onChange={value => changeFilter(setRanking, value)} width="w-[175px]" options={options.map(option => ({ value: option.key, label: `Rank by ${option.label}` }))} />
        </div>
      </div>

      {visibleCreatives.length ? (
        <>
          <div className="no-scrollbar flex gap-5 overflow-x-auto pb-4">{visibleCreatives.map(creative => <CreativeCard key={creative.id} creative={creative} currency={currency} mode={mode} onOpenDetails={setSelectedCreative} />)}</div>
          {totalPages > 1 && <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
            <div className="text-xs font-bold text-[#727782]">Page <span className="text-[#003870]">{safePage}</span> of {totalPages}</div>
            <div className="flex items-center gap-2">
              <button onClick={() => setCurrentPage(page => Math.max(1, page - 1))} disabled={safePage === 1} className={`rounded-full p-2 transition-all ${safePage === 1 ? 'cursor-not-allowed text-slate-300' : 'text-[#003870] hover:bg-slate-100'}`} aria-label="Previous creative page"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6" /></svg></button>
              <button onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))} disabled={safePage === totalPages} className={`rounded-full p-2 transition-all ${safePage === totalPages ? 'cursor-not-allowed text-slate-300' : 'text-[#003870] hover:bg-slate-100'}`} aria-label="Next creative page"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg></button>
            </div>
          </div>}
        </>
      ) : <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 py-10 text-center text-sm font-medium text-slate-500">No ads match the selected filters.</div>}
      <PaidAdsCreativeDetailsModal creative={selectedCreative} currency={currency} mode={mode} onClose={() => setSelectedCreative(null)} />
    </section>
  );
}
