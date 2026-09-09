import { useEffect, useMemo, useState } from 'react';
import { formatPaidAdsChange, formatPaidAdsMoney, formatPaidAdsNumber } from '../../utils/paidAdsFormatters';

const baseCards = [
  { key: 'spend', label: 'Ad spend', icon: '$', color: '#2563eb', tint: '#eaf1ff', type: 'money' },
  { key: 'reach', label: 'People reached', icon: '◎', color: '#06b6d4', tint: '#e5f8fb', type: 'number' },
  { key: 'postEngagements', label: 'Post engagements', icon: '♥', color: '#8b5cf6', tint: '#f1ebff', type: 'number' },
  { key: 'videoViews', label: 'Video views', icon: '▶', color: '#f97316', tint: '#fff0e7', type: 'number' },
  { key: 'landingPageViews', label: 'Landing-page views', icon: '↗', color: '#0ea5e9', tint: '#e8f6fd', type: 'number' },
  { key: 'leads', label: 'Leads', icon: '✓', color: '#10b981', tint: '#e7f8f1', type: 'number' },
  { key: 'messagingConversations', label: 'Messaging conversations', icon: '◌', color: '#14b8a6', tint: '#e6f8f6', type: 'number' },
];

const efficiencyCards = {
  leads: { key: 'primaryCostPerLead', fallbackKey: 'costPerLead', label: 'Cost per lead', icon: '↓', color: '#f59e0b', tint: '#fff7df', type: 'money', inverse: true },
  messaging: { key: 'primaryCostPerMessagingConversation', fallbackKey: 'costPerMessagingConversation', label: 'Cost per conversation', icon: '↓', color: '#14b8a6', tint: '#e6f8f6', type: 'money', inverse: true },
};

function value(metric, type, currency) {
  return type === 'money' ? formatPaidAdsMoney(metric, currency) : formatPaidAdsNumber(metric);
}

export default function PaidAdsBrandEnquiryMetricCards({ totals, currency, campaigns = [] }) {
  const availableEfficiencyCards = useMemo(() => {
    const resultTypes = new Set(campaigns.map(campaign => String(campaign.resultType || '').toLowerCase()));
    const available = [];
    if (resultTypes.has('leads')) available.push(efficiencyCards.leads);
    if (resultTypes.has('messaging conversations')) available.push(efficiencyCards.messaging);
    if (available.length === 0) {
      if (Number(totals?.leads?.current || 0) > 0) available.push(efficiencyCards.leads);
      if (Number(totals?.messagingConversations?.current || 0) > 0) available.push(efficiencyCards.messaging);
    }
    return available.length > 0 ? available : [efficiencyCards.leads];
  }, [campaigns, totals]);
  const [efficiencyIndex, setEfficiencyIndex] = useState(0);
  useEffect(() => setEfficiencyIndex(0), [availableEfficiencyCards.length]);
  const cards = [...baseCards, availableEfficiencyCards[Math.min(efficiencyIndex, availableEfficiencyCards.length - 1)]];

  return <section className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
    {cards.map(card => {
      const metric = totals[card.key] || totals[card.fallbackKey] || { current: 0, previous: 0, change: 0 };
      const up = metric.change == null || metric.change >= 0;
      const favorable = metric.change == null || (card.inverse ? metric.change <= 0 : metric.change >= 0);
      const isEfficiencyCard = Boolean(card.fallbackKey);
      return <article key={card.key} className="relative flex min-w-0 flex-col rounded-2xl border border-[#c2c6d3]/30 bg-white p-5 shadow-sm transition hover:shadow-md">
        {isEfficiencyCard && availableEfficiencyCards.length > 1 && <div className="absolute right-3 top-3 flex items-center gap-1">
          <button type="button" aria-label="Previous enquiry efficiency metric" onClick={() => setEfficiencyIndex(index => Math.max(0, index - 1))} disabled={efficiencyIndex === 0} className="flex h-7 w-7 items-center justify-center rounded-full text-lg font-bold text-[#727782] transition hover:bg-[#f3f4f5] hover:text-[#003870] disabled:cursor-not-allowed disabled:opacity-25">‹</button>
          <button type="button" aria-label="Next enquiry efficiency metric" onClick={() => setEfficiencyIndex(index => Math.min(availableEfficiencyCards.length - 1, index + 1))} disabled={efficiencyIndex === availableEfficiencyCards.length - 1} className="flex h-7 w-7 items-center justify-center rounded-full text-lg font-bold text-[#727782] transition hover:bg-[#f3f4f5] hover:text-[#003870] disabled:cursor-not-allowed disabled:opacity-25">›</button>
        </div>}
        <div className="flex items-center gap-4"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-xl font-black" style={{ color: card.color, backgroundColor: card.tint }}>{card.icon}</span><div className="min-w-0"><p className="truncate text-[13px] font-bold text-[#727782]">{card.label}</p><p className="mt-0.5 truncate text-2xl font-black tracking-tight text-[#191c1d]" title={value(metric.current, card.type, currency)}>{value(metric.current, card.type, currency)}</p></div></div>
        <div className="mt-5 flex items-center justify-between gap-2 text-[11px] font-bold"><span className="truncate text-[#727782]">Previous: {value(metric.previous, card.type, currency)}</span><span className={`shrink-0 ${metric.change == null ? 'text-[#8a9099]' : favorable ? 'text-green-600' : 'text-red-500'}`}>{metric.change == null ? 'New' : `${up ? '↑' : '↓'} ${formatPaidAdsChange(metric.change)}`}</span></div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#f1f5f9]"><div className="h-full rounded-full" style={{ width: `${Math.min(100, Math.max(5, Math.abs(metric.change || 0) * 3))}%`, backgroundColor: card.color }}/></div>
      </article>;
    })}
  </section>;
}
