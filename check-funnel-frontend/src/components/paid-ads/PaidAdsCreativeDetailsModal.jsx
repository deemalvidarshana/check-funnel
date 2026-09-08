import { useEffect, useState } from 'react';
import { formatPaidAdsMoney, formatPaidAdsNumber } from '../../utils/paidAdsFormatters';

function safeRate(numerator, denominator, multiplier = 1) {
  const bottom = Number(denominator || 0);
  return bottom > 0 ? (Number(numerator || 0) / bottom) * multiplier : 0;
}

function percent(value) {
  return `${Number(value || 0).toFixed(2)}%`;
}

function DetailCard({ label, value, tone = 'text-[#003870]' }) {
  return <div className="rounded-2xl border border-slate-100 bg-[#f8fafc] p-3.5"><p className="text-[9px] font-extrabold uppercase tracking-[0.12em] text-[#8a9099]">{label}</p><p className={`mt-1 truncate text-base font-black ${tone}`} title={String(value)}>{value}</p></div>;
}

function modeContent(creative, currency, mode) {
  if (mode === 'ecommerce') {
    return {
      title: 'Ecommerce Ad Performance',
      subtitle: 'Sales journey and purchase efficiency',
      metrics: [
        ['Spend', formatPaidAdsMoney(creative.spend, currency)],
        ['Landing views', formatPaidAdsNumber(creative.landingPageViews)],
        ['Content views', formatPaidAdsNumber(creative.contentViews)],
        ['Adds to cart', formatPaidAdsNumber(creative.addToCart)],
        ['Checkouts', formatPaidAdsNumber(creative.initiateCheckout)],
        ['Purchases', formatPaidAdsNumber(creative.purchases), 'text-emerald-700'],
        ['Revenue', formatPaidAdsMoney(creative.purchaseValue, currency), 'text-emerald-700'],
        ['Purchase ROAS', `${Number(creative.purchaseRoas || 0).toFixed(2)}x`],
        ['Cost / purchase', formatPaidAdsMoney(safeRate(creative.spend, creative.purchases), currency)],
        ['LPV → purchase', percent(safeRate(creative.purchases, creative.landingPageViews, 100))],
      ],
    };
  }
  if (mode === 'brand-enquiry') {
    return {
      title: 'Brand & Enquiry Ad Performance',
      subtitle: 'Awareness, engagement and enquiry outcomes',
      metrics: [
        ['Spend', formatPaidAdsMoney(creative.spend, currency)],
        ['Reach', formatPaidAdsNumber(creative.reach)],
        ['Impressions', formatPaidAdsNumber(creative.impressions)],
        ['Frequency', Number(creative.frequency || 0).toFixed(2)],
        ['Engagements', formatPaidAdsNumber(creative.postEngagements)],
        ['Video views', formatPaidAdsNumber(creative.videoViews)],
        ['Landing views', formatPaidAdsNumber(creative.landingPageViews)],
        ['Leads', formatPaidAdsNumber(creative.leads), 'text-emerald-700'],
        ['Messages', formatPaidAdsNumber(creative.messagingConversations), 'text-teal-700'],
        ['Cost / lead', formatPaidAdsMoney(safeRate(creative.spend, creative.leads), currency)],
      ],
    };
  }
  return {
    title: 'Ad Performance Details',
    subtitle: 'Delivery, traffic and conversion performance',
    metrics: [
      ['Spend', formatPaidAdsMoney(creative.spend, currency)],
      ['Reach', formatPaidAdsNumber(creative.reach)],
      ['Impressions', formatPaidAdsNumber(creative.impressions)],
      ['Frequency', Number(creative.frequency || 0).toFixed(2)],
      ['Clicks', formatPaidAdsNumber(creative.clicks)],
      ['CTR', percent(creative.ctr)],
      ['CPC', formatPaidAdsMoney(creative.cpc, currency)],
      ['Conversions', formatPaidAdsNumber(creative.conversions), 'text-rose-600'],
      ['CPA', formatPaidAdsMoney(creative.cpa, currency)],
      ['Result type', creative.resultType || '—'],
    ],
  };
}

export default function PaidAdsCreativeDetailsModal({ creative, currency, mode, onClose }) {
  const [imageFailed, setImageFailed] = useState(false);
  const content = creative ? modeContent(creative, currency, mode) : null;

  useEffect(() => {
    if (!creative) return undefined;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = event => event.key === 'Escape' && onClose();
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [creative, onClose]);

  if (!creative) return null;
  const hasImage = creative.thumbnailUrl && !imageFailed;

  return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={`${creative.name} details`} onClick={onClose}>
    <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-[32px] bg-white shadow-2xl md:flex-row" onClick={event => event.stopPropagation()}>
      <div className="relative min-h-60 w-full bg-[#eef1f5] md:w-[40%]">
        {hasImage ? <img src={creative.thumbnailUrl} alt={creative.name} className="h-full max-h-[92vh] w-full object-cover" onError={() => setImageFailed(true)} referrerPolicy="no-referrer" /> : <div className="flex h-full min-h-72 items-center justify-center bg-[linear-gradient(145deg,#003870,#2563eb)]"><span className="flex h-20 w-20 items-center justify-center rounded-3xl border border-white/20 bg-white/10 text-3xl font-black text-white">M</span></div>}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-6 pt-16 text-white"><span className="rounded-full bg-white/20 px-3 py-1 text-[9px] font-extrabold backdrop-blur">META · {creative.mediaType || 'AD CREATIVE'}</span><p className="mt-3 line-clamp-2 text-lg font-black">{creative.headline || creative.name}</p></div>
        <button type="button" onClick={onClose} className="absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-black/25 text-white backdrop-blur md:hidden" aria-label="Close ad details"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m6 6 12 12M18 6 6 18" /></svg></button>
      </div>

      <div className="flex w-full flex-col overflow-y-auto p-5 sm:p-7 md:w-[60%]">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-5"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-[#0866ff]/10 px-2.5 py-1 text-[9px] font-extrabold text-[#0866ff]">META AD</span><span className={`rounded-full px-2.5 py-1 text-[9px] font-extrabold ${String(creative.status).includes('ACTIVE') ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{String(creative.status || 'UNKNOWN').replaceAll('_', ' ')}</span></div><h2 className="mt-3 text-xl font-black leading-tight text-[#191c1d]">{content.title}</h2><p className="mt-1 text-xs font-semibold text-[#727782]">{content.subtitle}</p></div><button type="button" onClick={onClose} className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-50 text-slate-400 transition hover:bg-slate-100 md:flex" aria-label="Close ad details"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m6 6 12 12M18 6 6 18" /></svg></button></div>

        <div className="py-5"><p className="text-[9px] font-extrabold uppercase tracking-[0.12em] text-[#8a9099]">Ad & campaign</p><h3 className="mt-2 text-sm font-extrabold text-[#273548]">{creative.name}</h3><p className="mt-1 text-xs font-semibold text-[#727782]">{creative.campaignName}</p>{creative.callToAction && <span className="mt-3 inline-flex rounded-full bg-[#003870]/5 px-3 py-1.5 text-[10px] font-extrabold text-[#003870]">CTA · {creative.callToAction}</span>}</div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">{content.metrics.map(([label, value, tone]) => <DetailCard key={label} label={label} value={value} tone={tone} />)}</div>

        {(creative.body || creative.description) && <div className="mt-5 rounded-2xl border border-slate-100 p-4"><p className="text-[9px] font-extrabold uppercase tracking-[0.12em] text-[#8a9099]">Ad copy</p>{creative.headline && <p className="mt-2 text-sm font-extrabold text-[#273548]">{creative.headline}</p>}{creative.body && <p className="mt-2 whitespace-pre-line text-xs font-medium leading-5 text-[#59606b]">{creative.body}</p>}{creative.description && <p className="mt-2 text-[11px] font-semibold text-[#8a9099]">{creative.description}</p>}</div>}

        {creative.destinationUrl && <a href={creative.destinationUrl} target="_blank" rel="noopener noreferrer" className="mt-5 flex h-12 shrink-0 items-center justify-center gap-2 rounded-2xl bg-[#003870] text-sm font-bold text-white transition hover:bg-[#002b56]">Open ad destination <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3" /></svg></a>}
      </div>
    </div>
  </div>;
}
