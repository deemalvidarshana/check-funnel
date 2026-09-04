import { Ga4Period } from './google-analytics-report.types';

export const GA4_OVERVIEW_METRICS = [
  'activeUsers',
  'sessions',
  'engagementRate',
  'keyEvents',
  'totalRevenue',
  'purchaseRevenue',
  'transactions',
  'totalPurchasers',
  'screenPageViews',
];

export const GA4_JOURNEY_EVENTS = [
  'session_start',
  'view_item',
  'add_to_cart',
  'begin_checkout',
  'add_shipping_info',
  'add_payment_info',
  'purchase',
  'form_start',
  'contact',
  'form_submit',
  'generate_lead',
  'qualify_lead',
  'working_lead',
  'close_convert_lead',
  'disqualify_lead',
  'close_unconvert_lead',
];

export const GA4_LEAD_EVENTS = [
  'form_submit',
  'generate_lead',
  'qualify_lead',
  'working_lead',
  'close_convert_lead',
  'disqualify_lead',
  'close_unconvert_lead',
];

export const GA4_INQUIRY_EVENTS = ['form_start', 'contact'];

export const GA4_ECOMMERCE_EVENTS = [
  'view_item',
  'add_to_cart',
  'begin_checkout',
  'purchase',
];

export function ga4OverviewRequest(period: Ga4Period) {
  return reportRequest(period, [], GA4_OVERVIEW_METRICS);
}

export function ga4DailyRequest(period: Ga4Period) {
  return {
    ...reportRequest(
      period,
      ['date'],
      [
        'sessions',
        'activeUsers',
        'screenPageViews',
        'keyEvents',
        'totalRevenue',
        'transactions',
      ],
    ),
    orderBys: [{ dimension: { dimensionName: 'date' } }],
    limit: '100',
  };
}

export function ga4ChannelRequest(period: Ga4Period) {
  return {
    ...reportRequest(
      period,
      ['sessionDefaultChannelGroup'],
      [
        'sessions',
        'activeUsers',
        'engagementRate',
        'keyEvents',
        'totalRevenue',
        'transactions',
      ],
    ),
    orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
    limit: '20',
  };
}

export function ga4LifecycleRequest(period: Ga4Period) {
  return {
    ...reportRequest(
      period,
      ['newVsReturning'],
      ['activeUsers', 'transactions', 'keyEvents', 'totalRevenue'],
    ),
    limit: '10',
  };
}

export function ga4EventRequest(period: Ga4Period, events: string[]) {
  return {
    ...reportRequest(period, ['eventName'], ['eventCount', 'keyEvents']),
    dimensionFilter: inListFilter('eventName', events),
    limit: '50',
  };
}

export function ga4LeadDailyRequest(period: Ga4Period) {
  return {
    ...reportRequest(period, ['date', 'eventName'], ['eventCount']),
    dimensionFilter: inListFilter('eventName', GA4_LEAD_EVENTS),
    orderBys: [{ dimension: { dimensionName: 'date' } }],
    limit: '500',
  };
}

export function ga4EcommerceDailyRequest(period: Ga4Period) {
  return eventBreakdownRequest(period, 'date', GA4_ECOMMERCE_EVENTS, '500');
}

export function ga4InquiryDailyRequest(period: Ga4Period) {
  return eventBreakdownRequest(period, 'date', GA4_INQUIRY_EVENTS, '500');
}

export function ga4DeviceRequest(period: Ga4Period) {
  return {
    ...reportRequest(
      period,
      ['deviceCategory'],
      [
        'sessions',
        'activeUsers',
        'engagementRate',
        'keyEvents',
        'totalRevenue',
      ],
    ),
    orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
    limit: '10',
  };
}

export function ga4PagesRequest(period: Ga4Period) {
  return {
    ...reportRequest(period, ['pageTitle'], ['screenPageViews']),
    orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
    limit: '10',
  };
}

export function ga4PagePathRequest(period: Ga4Period) {
  return {
    ...reportRequest(
      period,
      ['pagePathPlusQueryString'],
      ['activeUsers', 'screenPageViews'],
    ),
    orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
    limit: '1000',
  };
}

export function ga4LeadChannelRequest(period: Ga4Period) {
  return {
    ...reportRequest(
      period,
      ['sessionDefaultChannelGroup', 'eventName'],
      ['eventCount'],
    ),
    dimensionFilter: inListFilter('eventName', GA4_LEAD_EVENTS),
    orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
    limit: '20',
  };
}

export function ga4LeadBreakdownRequest(
  period: Ga4Period,
  dimension:
    | 'sessionDefaultChannelGroup'
    | 'sessionSourceMedium'
    | 'landingPagePlusQueryString',
) {
  return eventBreakdownRequest(period, dimension, GA4_LEAD_EVENTS, '200');
}

export function ga4EcommerceBreakdownRequest(
  period: Ga4Period,
  dimension: 'sessionDefaultChannelGroup' | 'sessionSourceMedium',
) {
  return eventBreakdownRequest(period, dimension, GA4_ECOMMERCE_EVENTS, '100');
}

export function ga4InquiryChannelRequest(period: Ga4Period) {
  return eventBreakdownRequest(
    period,
    'sessionDefaultChannelGroup',
    GA4_INQUIRY_EVENTS,
    '50',
  );
}

export function ga4ProductPerformanceRequest(period: Ga4Period) {
  return {
    ...reportRequest(
      period,
      ['itemName', 'itemId'],
      [
        'itemsViewed',
        'itemsAddedToCart',
        'itemsCheckedOut',
        'itemsPurchased',
        'itemRevenue',
      ],
    ),
    orderBys: [{ metric: { metricName: 'itemsViewed' }, desc: true }],
    limit: '20',
  };
}

export function ga4TrafficBreakdownRequest(
  period: Ga4Period,
  dimension: 'sessionSourceMedium' | 'landingPagePlusQueryString',
) {
  return {
    ...reportRequest(
      period,
      [dimension],
      [
        'sessions',
        'activeUsers',
        'engagementRate',
        'transactions',
        'totalRevenue',
      ],
    ),
    orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
    limit: '20',
  };
}

export function ga4InquiryBreakdownRequest(
  period: Ga4Period,
  dimension: 'sessionSourceMedium' | 'landingPagePlusQueryString',
) {
  return eventBreakdownRequest(period, dimension, GA4_INQUIRY_EVENTS, '100');
}

function eventBreakdownRequest(
  period: Ga4Period,
  groupDimension: string,
  events: string[],
  limit: string,
) {
  return {
    ...reportRequest(period, [groupDimension, 'eventName'], ['eventCount']),
    dimensionFilter: inListFilter('eventName', events),
    orderBys: [{ dimension: { dimensionName: groupDimension } }],
    limit,
  };
}

function reportRequest(
  period: Ga4Period,
  dimensions: string[],
  metrics: string[],
) {
  return {
    dateRanges: [{ startDate: period.startDate, endDate: period.endDate }],
    dimensions: dimensions.map((name) => ({ name })),
    metrics: metrics.map((name) => ({ name })),
    keepEmptyRows: true,
  };
}

function inListFilter(fieldName: string, values: string[]) {
  return {
    filter: {
      fieldName,
      inListFilter: { values, caseSensitive: true },
    },
  };
}
