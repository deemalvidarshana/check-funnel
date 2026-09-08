import { formatPaidAdsMoney, formatPaidAdsNumber } from '../../utils/paidAdsFormatters';

const objectiveGroups = [
  { key: 'awareness', label: 'Awareness', color: '#10b8ce' },
  { key: 'engagement', label: 'Engagement', color: '#8b5cf6' },
  { key: 'enquiry', label: 'Lead & enquiry', color: '#10b981' },
];

function groupKey(campaign) {
  const objective = String(campaign.objective || '').toUpperCase();
  const result = String(campaign.resultType || '').toLowerCase();
  if (objective.includes('LEAD') || objective.includes('MESSAGE') || result.includes('lead') || result.includes('messag')) return 'enquiry';
  if (objective.includes('AWARENESS') || objective === 'REACH' || result === 'reach') return 'awareness';
  if (objective.includes('ENGAGEMENT') || result.includes('engagement') || result.includes('video')) return 'engagement';
  return 'other';
}

function sumRows(rows, key) {
  return rows.reduce((sum, row) => sum + Number(row[key] || 0), 0);
}

function percentage(value, total) {
  return total > 0 ? (value / total) * 100 : 0;
}

function resultLabel(rows) {
  const labels = [...new Set(rows.map(row => row.resultType).filter(Boolean))];
  return labels.length === 1 ? labels[0] : labels.length > 1 ? 'Mixed results' : 'No primary result';
}

function ObjectiveRow({ label, rows, totalSpend, currency, color }) {
  const spend = sumRows(rows, 'spend');
  const share = percentage(spend, totalSpend);
  return <div>
    <div className="flex items-end justify-between gap-4">
      <div className="min-w-0">
        <h4 className="text-xs font-extrabold text-[#334155]">{label}</h4>
        <p className="mt-0.5 truncate text-[9px] font-bold text-[#9299a4]">{rows.length} campaign{rows.length === 1 ? '' : 's'} · {resultLabel(rows)}</p>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-xs font-black tabular-nums text-[#334155]">{formatPaidAdsMoney(spend, currency)}</p>
        <p className="mt-0.5 text-[9px] font-bold tabular-nums text-[#9299a4]">{share.toFixed(1)}%</p>
      </div>
    </div>
    <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-[#e9edf1]">
      <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${share}%`, backgroundColor: color }} />
    </div>
  </div>;
}

function JourneyStep({ number, label, value, rate, color }) {
  return <div className="min-w-0 rounded-2xl bg-[#f6f7f8] px-4 py-4">
    <div className="flex items-center justify-between gap-2">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-black text-white" style={{ backgroundColor: color }}>{number}</span>
      {rate != null && <span className="text-[9px] font-extrabold tabular-nums text-[#8b929d]">{rate}</span>}
    </div>
    <p className="mt-4 text-[10px] font-bold leading-4 text-[#7b8491]">{label}</p>
    <p className="mt-2 whitespace-nowrap text-xl font-black leading-none tracking-[-0.03em] tabular-nums text-[#191c1d]">{formatPaidAdsNumber(value)}</p>
  </div>;
}

function RateCard({ label, value, accent = false }) {
  return <div className="rounded-2xl border border-[#e4e8ec] bg-white px-4 py-4">
    <p className="text-[10px] font-bold leading-4 text-[#8b929d]">{label}</p>
    <p className={`mt-2 text-lg font-black tracking-[-0.02em] tabular-nums ${accent ? 'text-emerald-600' : 'text-[#273548]'}`}>{value}</p>
  </div>;
}

function SummaryMetric({ label, value }) {
  return <div className="min-w-0">
    <p className="text-[9px] font-extrabold uppercase tracking-[0.04em] text-amber-700">{label}</p>
    <p className="mt-2 text-lg font-black leading-none tabular-nums text-[#3b1c09]">{value}</p>
  </div>;
}

export default function PaidAdsBrandEnquiryJourney({ campaigns = [], totals = {}, currency }) {
  const metric = key => Number(totals[key]?.current || 0);
  const grouped = Object.fromEntries(objectiveGroups.map(group => [group.key, campaigns.filter(campaign => groupKey(campaign) === group.key)]));
  const totalSpend = metric('spend');
  const linkClicks = metric('linkClicks');
  const landingViews = metric('landingPageViews');
  const websiteLeads = metric('websiteLeads');
  const leads = metric('leads');
  const metaFormLeads = metric('metaFormLeads');
  const messages = metric('messagingConversations');
  const clickToLandingRate = percentage(landingViews, linkClicks);
  const landingToLeadRate = percentage(websiteLeads, landingViews);
  const costPerConversation = messages > 0 ? totalSpend / messages : 0;

  return <section className="mt-6 rounded-3xl border border-[#dfe3e7] bg-white p-5 shadow-sm sm:p-6">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h2 className="text-lg font-extrabold text-[#191c1d]">Brand demand and enquiry journey</h2>
        <p className="mt-1 text-xs font-semibold text-[#727782]">Campaign investment separated by objective, followed by the website enquiry path.</p>
      </div>
      <span className="w-fit shrink-0 rounded-full bg-amber-50 px-4 py-2 text-[10px] font-extrabold text-amber-700">BRAND + ENQUIRY</span>
    </div>

    <div className="mt-5 grid min-w-0 gap-4 xl:grid-cols-[minmax(300px,0.72fr)_minmax(0,1.28fr)]">
      <article className="rounded-2xl border border-[#e3e7eb] bg-white p-5">
        <h3 className="text-sm font-extrabold text-[#273548]">Spend by campaign objective</h3>
        <p className="mt-1 text-[10px] font-semibold text-[#8b929d]">Keeps brand results separate from lead results.</p>
        <div className="mt-6 space-y-5">
          {objectiveGroups.map(group => <ObjectiveRow key={group.key} label={group.label} rows={grouped[group.key]} totalSpend={totalSpend} currency={currency} color={group.color} />)}
        </div>
      </article>

      <article className="min-w-0 rounded-2xl border border-[#e3e7eb] bg-white p-5">
        <h3 className="text-sm font-extrabold text-[#273548]">Website traffic path</h3>
        <p className="mt-1 text-[10px] font-semibold text-[#8b929d]">Meta instant-form leads and messaging are excluded from this sequential website funnel.</p>
        <div className="mt-6 grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <JourneyStep number="1" label="Impressions" value={metric('impressions')} color="#2563eb" />
          <JourneyStep number="2" label="Link clicks" value={linkClicks} rate={`${percentage(linkClicks, metric('impressions')).toFixed(1)}%`} color="#06b6d4" />
          <JourneyStep number="3" label="Landing-page views" value={landingViews} rate={`${clickToLandingRate.toFixed(1)}%`} color="#0ea5e9" />
          <JourneyStep number="4" label="Website leads" value={websiteLeads} rate={`${landingToLeadRate.toFixed(1)}%`} color="#10b981" />
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <RateCard label="Click → landing rate" value={`${clickToLandingRate.toFixed(1)}%`} />
          <RateCard label="Landing → website lead" value={`${landingToLeadRate.toFixed(2)}%`} accent />
          <RateCard label="Cost per conversation" value={formatPaidAdsMoney(costPerConversation, currency)} />
        </div>
      </article>
    </div>

    <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50/80 px-5 py-5">
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryMetric label="All leads" value={formatPaidAdsNumber(leads)} />
        <SummaryMetric label="Meta-form leads" value={formatPaidAdsNumber(metaFormLeads)} />
        <SummaryMetric label="Website leads" value={formatPaidAdsNumber(websiteLeads)} />
        <SummaryMetric label="Messaging conversations" value={formatPaidAdsNumber(messages)} />
      </div>
      <p className="mt-5 text-[9px] font-semibold leading-4 text-amber-800">All leads use Meta's overall lead result. Meta-form and website leads are destination-specific classifications and are not added again; messaging is a separate enquiry channel and may overlap with leads.</p>
    </div>
  </section>;
}
