import { BadRequestException } from '@nestjs/common';
import { CampaignResultMetrics, MetaActionValue, MetaInsightRow, PaidAdsMetrics, PaidAdsPeriod } from './paid-ads.types';

export function numeric(value: unknown): number {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

const conversionPriority = [
  'offsite_conversion',
  'omni_purchase',
  'purchase',
  'offsite_conversion.fb_pixel_purchase',
  'lead',
];

export function conversionCount(actions: MetaActionValue[] = []): number {
  for (const actionType of conversionPriority) {
    const action = actions.find((item) => item.action_type === actionType);
    if (action) return numeric(action.value);
  }
  return 0;
}

export function valuesByAction(rows: MetaActionValue[] = []): Record<string, number> {
  return Object.fromEntries(rows.map((row) => [row.action_type, numeric(row.value)]));
}

function firstAction(actions: Record<string, number>, priorities: string[]): number {
  for (const actionType of priorities) {
    if (actions[actionType] !== undefined) return actions[actionType];
  }
  return 0;
}

function maxAction(actions: Record<string, number>, aliases: string[]): number {
  return Math.max(0, ...aliases.map((actionType) => actions[actionType] ?? 0));
}

function cost(spend: number, result: number): number {
  return result > 0 ? spend / result : 0;
}

export function normalizeCampaignResults(
  row: MetaInsightRow,
  objective = '',
  primaryResultHint?: 'leads' | 'messaging',
): CampaignResultMetrics {
  const spend = numeric(row.spend);
  const impressions = numeric(row.impressions);
  const actions = valuesByAction(row.actions);
  const actionValues = valuesByAction(row.action_values);
  const linkClicks = numeric(row.inline_link_clicks) || firstAction(actions, ['link_click']);
  const outboundClicks = maxAction(valuesByAction(row.outbound_clicks), ['outbound_click']);
  const uniqueOutboundClicks = maxAction(valuesByAction(row.unique_outbound_clicks), ['outbound_click']);
  const outboundCtr = maxAction(valuesByAction(row.outbound_clicks_ctr), ['outbound_click'])
    || (impressions > 0 ? (outboundClicks / impressions) * 100 : 0);
  const costPerOutboundClick = maxAction(valuesByAction(row.cost_per_outbound_click), ['outbound_click'])
    || cost(spend, outboundClicks);
  const landingPageViews = firstAction(actions, ['landing_page_view', 'omni_landing_page_view']);
  const contentViews = firstAction(actions, ['omni_view_content', 'view_content', 'offsite_conversion.fb_pixel_view_content', 'onsite_web_view_content', 'onsite_web_app_view_content']);
  const addToCart = firstAction(actions, ['omni_add_to_cart', 'add_to_cart', 'offsite_conversion.fb_pixel_add_to_cart', 'onsite_web_add_to_cart', 'onsite_web_app_add_to_cart']);
  const initiateCheckout = firstAction(actions, ['omni_initiated_checkout', 'initiate_checkout', 'offsite_conversion.fb_pixel_initiate_checkout', 'onsite_web_initiate_checkout']);
  const purchases = firstAction(actions, ['omni_purchase', 'purchase', 'offsite_conversion.fb_pixel_purchase', 'onsite_web_purchase', 'onsite_web_app_purchase', 'web_in_store_purchase', 'web_app_in_store_purchase']);
  const purchaseValue = firstAction(actionValues, ['omni_purchase', 'purchase', 'offsite_conversion.fb_pixel_purchase', 'onsite_web_purchase', 'onsite_web_app_purchase', 'web_in_store_purchase', 'web_app_in_store_purchase']);
  const metaFormLeads = maxAction(actions, ['onsite_conversion.lead_grouped', 'onsite_conversion.lead']);
  const pixelWebsiteLeads = firstAction(actions, ['offsite_conversion.fb_pixel_lead']);
  const combinedWebLeads = firstAction(actions, ['onsite_web_lead']);
  const websiteLeads = pixelWebsiteLeads || Math.max(0, combinedWebLeads - metaFormLeads);
  // `lead` is Meta's overall result. Destination-specific action aliases can
  // overlap with it, so use the largest value rather than adding aliases.
  const leads = Math.max(firstAction(actions, ['lead']), metaFormLeads + websiteLeads);
  const messagingConversations = firstAction(actions, ['onsite_conversion.messaging_conversation_started_7d', 'onsite_conversion.messaging_first_reply', 'onsite_conversion.total_messaging_connection']);
  const messagingConnections = firstAction(actions, ['onsite_conversion.total_messaging_connection']);
  const messagingFirstReplies = firstAction(actions, ['onsite_conversion.messaging_first_reply']);
  const postEngagements = firstAction(actions, ['post_engagement', 'post_interaction_net', 'post_interaction_gross']);
  const pageEngagements = firstAction(actions, ['page_engagement']);
  const videoViews = firstAction(actions, ['video_view']);
  const reactions = firstAction(actions, ['post_reaction', 'like', 'onsite_conversion.post_net_like']);
  const comments = firstAction(actions, ['comment', 'onsite_conversion.post_net_comment']);
  const saves = firstAction(actions, ['onsite_conversion.post_save', 'onsite_conversion.post_net_save']);
  const searches = firstAction(actions, ['omni_search', 'search', 'offsite_conversion.fb_pixel_search']);
  const addPaymentInfo = firstAction(actions, ['add_payment_info', 'offsite_conversion.fb_pixel_add_payment_info']);
  const registrations = maxAction(actions, ['complete_registration', 'offsite_conversion.fb_pixel_complete_registration']);
  const purchaseRoas = firstAction(valuesByAction(row.website_purchase_roas), ['omni_purchase', 'purchase'])
    || firstAction(valuesByAction(row.purchase_roas), ['omni_purchase', 'purchase'])
    || (spend > 0 ? purchaseValue / spend : 0);

  const normalizedObjective = objective.toUpperCase();
  let results = conversionCount(row.actions);
  let resultType = 'Conversions';
  const isLead = normalizedObjective.includes('LEAD');
  const isSales = normalizedObjective.includes('SALES')
    || normalizedObjective.includes('CONVERSION')
    || normalizedObjective.includes('CATALOG');
  const isTraffic = normalizedObjective.includes('TRAFFIC')
    || normalizedObjective.includes('LINK_CLICK');
  const isMessaging = normalizedObjective.includes('MESSAGE');
  const isEngagement = normalizedObjective.includes('ENGAGEMENT')
    || normalizedObjective.includes('POST_ENGAGEMENT');
  const isAwareness = normalizedObjective.includes('AWARENESS')
    || normalizedObjective === 'REACH';
  const isVideo = normalizedObjective.includes('VIDEO');

  if (isLead) {
    // Meta's generic `lead` action may be emitted alongside a messaging
    // conversation even when the campaign's real result is messaging. Only
    // let destination-specific form/website leads take priority over messages.
    const destinationSpecificLeads = metaFormLeads + websiteLeads;
    const shouldUseMessaging = primaryResultHint === 'messaging'
      || (primaryResultHint !== 'leads' && messagingConversations > 0 && destinationSpecificLeads === 0);
    results = shouldUseMessaging ? messagingConversations : leads;
    resultType = shouldUseMessaging ? 'Messaging conversations' : 'Leads';
  } else if (isSales) {
    results = purchases || conversionCount(row.actions);
    resultType = purchases > 0 ? 'Purchases' : 'Conversions';
  } else if (isTraffic) {
    results = landingPageViews || linkClicks;
    resultType = landingPageViews > 0 ? 'Landing page views' : 'Link clicks';
  } else if (isMessaging) {
    results = messagingConversations;
    resultType = 'Messaging conversations';
  } else if (isEngagement) {
    results = postEngagements || messagingConversations || videoViews;
    resultType = postEngagements > 0 ? 'Post engagements' : messagingConversations > 0 ? 'Messaging conversations' : 'Video views';
  } else if (isAwareness) {
    results = numeric(row.reach);
    resultType = 'Reach';
  } else if (isVideo) {
    results = videoViews;
    resultType = 'Video views';
  }

  return {
    frequency: numeric(row.frequency) || (numeric(row.reach) > 0 ? impressions / numeric(row.reach) : 0),
    uniqueClicks: numeric(row.unique_clicks),
    linkClicks,
    linkCtr: numeric(row.inline_link_click_ctr) || (impressions > 0 ? (linkClicks / impressions) * 100 : 0),
    outboundClicks,
    uniqueOutboundClicks,
    outboundCtr,
    costPerOutboundClick,
    cpm: numeric(row.cpm) || (impressions > 0 ? (spend / impressions) * 1000 : 0),
    cpp: numeric(row.cpp),
    costPerLinkClick: numeric(row.cost_per_inline_link_click) || cost(spend, linkClicks),
    landingPageViews,
    costPerLandingPageView: cost(spend, landingPageViews),
    contentViews,
    addToCart,
    initiateCheckout,
    purchases,
    purchaseValue,
    purchaseRoas,
    leads,
    metaFormLeads,
    websiteLeads,
    costPerLead: cost(spend, leads),
    messagingConversations,
    messagingConnections,
    messagingFirstReplies,
    costPerMessagingConversation: cost(spend, messagingConversations),
    postEngagements,
    pageEngagements,
    videoViews,
    reactions,
    comments,
    saves,
    searches,
    addPaymentInfo,
    registrations,
    results,
    resultType,
    costPerResult: cost(spend, results),
    rawActions: actions,
    rawActionValues: actionValues,
  };
}

export function normalizeMetrics(row: MetaInsightRow = {}): PaidAdsMetrics {
  const spend = numeric(row.spend);
  const impressions = numeric(row.impressions);
  const clicks = numeric(row.clicks);
  const conversions = conversionCount(row.actions);
  return {
    spend,
    reach: numeric(row.reach),
    impressions,
    clicks,
    conversions,
    ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
    cpc: clicks > 0 ? spend / clicks : 0,
    cpa: conversions > 0 ? spend / conversions : 0,
  };
}

export function percentageChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return ((current - previous) / previous) * 100;
}

export function monthPeriod(month: string): PaidAdsPeriod {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
    throw new BadRequestException('month must use YYYY-MM format');
  }
  const [year, monthNumber] = month.split('-').map(Number);
  const lastDay = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  const monthName = new Date(Date.UTC(year, monthNumber - 1, 1)).toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' });
  return {
    since: `${year}-${String(monthNumber).padStart(2, '0')}-01`,
    until: `${year}-${String(monthNumber).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`,
    label: monthName,
  };
}

export function previousMonthPeriod(month: string): PaidAdsPeriod {
  const [year, monthNumber] = month.split('-').map(Number);
  const previous = new Date(Date.UTC(year, monthNumber - 2, 1));
  return monthPeriod(`${previous.getUTCFullYear()}-${String(previous.getUTCMonth() + 1).padStart(2, '0')}`);
}

function parseIsoDate(value: string, fieldName: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new BadRequestException(`${fieldName} must use YYYY-MM-DD format`);
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new BadRequestException(`${fieldName} must be a valid date`);
  }
  return date;
}

function rangeLabel(since: Date, until: Date): string {
  const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' };
  return `${since.toLocaleDateString('en-GB', options)} – ${until.toLocaleDateString('en-GB', options)}`;
}

export function customPeriod(sinceValue: string, untilValue: string): PaidAdsPeriod {
  const since = parseIsoDate(sinceValue, 'since');
  const until = parseIsoDate(untilValue, 'until');
  if (since > until) throw new BadRequestException('since must be on or before until');

  const durationDays = Math.round((until.getTime() - since.getTime()) / 86_400_000) + 1;
  if (durationDays > 366) throw new BadRequestException('Custom date ranges cannot exceed 366 days');

  return { since: sinceValue, until: untilValue, label: rangeLabel(since, until) };
}

export function precedingPeriod(period: PaidAdsPeriod): PaidAdsPeriod {
  const since = parseIsoDate(period.since, 'since');
  const until = parseIsoDate(period.until, 'until');
  const durationMs = until.getTime() - since.getTime();
  const previousUntil = new Date(since.getTime() - 86_400_000);
  const previousSince = new Date(previousUntil.getTime() - durationMs);
  return customPeriod(previousSince.toISOString().slice(0, 10), previousUntil.toISOString().slice(0, 10));
}
