import {
  BadGatewayException,
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import axios, { AxiosError } from 'axios';
import { ClientService } from '../client/client.service';
import { GoogleAnalyticsService } from './google-analytics.service';
import { Ga4RunReportResponse } from './google-analytics-report.types';
import {
  ga4ApiDate,
  ga4Comparison,
  ga4CustomPeriods,
  ga4EventMap,
  ga4MonthPeriods,
  ga4Number,
  ga4Rows,
} from './google-analytics-report.utils';
import {
  GA4_JOURNEY_EVENTS,
  GA4_LEAD_EVENTS,
  GA4_OVERVIEW_METRICS,
  ga4ChannelRequest,
  ga4DailyRequest,
  ga4DeviceRequest,
  ga4EcommerceBreakdownRequest,
  ga4EcommerceDailyRequest,
  ga4EventRequest,
  ga4InquiryChannelRequest,
  ga4InquiryBreakdownRequest,
  ga4InquiryDailyRequest,
  ga4LeadChannelRequest,
  ga4LeadBreakdownRequest,
  ga4LeadDailyRequest,
  ga4LifecycleRequest,
  ga4OverviewRequest,
  ga4PagePathRequest,
  ga4PagesRequest,
  ga4ProductPerformanceRequest,
  ga4TrafficBreakdownRequest,
} from './google-analytics-report.requests';
import {
  ga4InquiryJourney,
  ga4LeadJourney,
  ga4PurchaseJourney,
} from './google-analytics-report.journeys';

interface GoogleApiErrorResponse {
  error?: { message?: string };
}

@Injectable()
export class GoogleAnalyticsReportService {
  private readonly dataApiBaseUrl =
    'https://analyticsdata.googleapis.com/v1beta';

  constructor(
    private readonly googleAnalyticsService: GoogleAnalyticsService,
    private readonly clientService: ClientService,
  ) {}

  async getInsights(
    clientId: number,
    month: string,
    customRange?: {
      since?: string;
      until?: string;
      compareSince?: string;
      compareUntil?: string;
    },
  ) {
    const client = await this.clientService.findOne(clientId);
    if (!client.googleAnalyticsPropertyId) {
      throw new BadRequestException('No GA4 property is mapped to this client');
    }

    const propertyId = client.googleAnalyticsPropertyId;
    const customValues = [
      customRange?.since,
      customRange?.until,
      customRange?.compareSince,
      customRange?.compareUntil,
    ];
    const hasCustomRange = customValues.some(Boolean);
    if (hasCustomRange && customValues.some((value) => !value)) {
      throw new BadRequestException(
        'Custom comparison requires all four range dates',
      );
    }
    const periods = hasCustomRange
      ? ga4CustomPeriods(
          customRange!.since!,
          customRange!.until!,
          customRange!.compareSince!,
          customRange!.compareUntil!,
        )
      : ga4MonthPeriods(month);
    const accessToken = await this.googleAnalyticsService.getAccessToken();

    const [
      currentOverviewResponse,
      previousOverviewResponse,
      dailyResponse,
      previousDailyResponse,
      ecommerceDailyResponse,
      previousEcommerceDailyResponse,
      channelResponse,
      lifecycleResponse,
      currentEventsResponse,
      previousEventsResponse,
      deviceResponse,
      pagesResponse,
      leadChannelsResponse,
      leadDailyResponse,
      previousLeadDailyResponse,
      inquiryChannelsResponse,
      inquiryDailyResponse,
      previousInquiryDailyResponse,
      pagePathsResponse,
      ecommerceChannelsResponse,
      productPerformanceResponse,
    ] = await Promise.all([
      this.runReport(
        propertyId,
        accessToken,
        ga4OverviewRequest(periods.current),
      ),
      this.runReport(
        propertyId,
        accessToken,
        ga4OverviewRequest(periods.previous),
      ),
      this.runReport(propertyId, accessToken, ga4DailyRequest(periods.current)),
      this.runReport(
        propertyId,
        accessToken,
        ga4DailyRequest(periods.previous),
      ),
      this.runReport(
        propertyId,
        accessToken,
        ga4EcommerceDailyRequest(periods.current),
      ),
      this.runReport(
        propertyId,
        accessToken,
        ga4EcommerceDailyRequest(periods.previous),
      ),
      this.runReport(
        propertyId,
        accessToken,
        ga4ChannelRequest(periods.current),
      ),
      this.runReport(
        propertyId,
        accessToken,
        ga4LifecycleRequest(periods.current),
      ),
      this.runReport(
        propertyId,
        accessToken,
        ga4EventRequest(periods.current, GA4_JOURNEY_EVENTS),
      ),
      this.runReport(
        propertyId,
        accessToken,
        ga4EventRequest(periods.previous, GA4_JOURNEY_EVENTS),
      ),
      this.runReport(
        propertyId,
        accessToken,
        ga4DeviceRequest(periods.current),
      ),
      this.runReport(propertyId, accessToken, ga4PagesRequest(periods.current)),
      this.runReport(
        propertyId,
        accessToken,
        ga4LeadChannelRequest(periods.current),
      ),
      this.runReport(
        propertyId,
        accessToken,
        ga4LeadDailyRequest(periods.current),
      ),
      this.runReport(
        propertyId,
        accessToken,
        ga4LeadDailyRequest(periods.previous),
      ),
      this.runReport(
        propertyId,
        accessToken,
        ga4InquiryChannelRequest(periods.current),
      ),
      this.runReport(
        propertyId,
        accessToken,
        ga4InquiryDailyRequest(periods.current),
      ),
      this.runReport(
        propertyId,
        accessToken,
        ga4InquiryDailyRequest(periods.previous),
      ),
      this.runReport(
        propertyId,
        accessToken,
        ga4PagePathRequest(periods.current),
      ),
      this.runReport(
        propertyId,
        accessToken,
        ga4EcommerceBreakdownRequest(
          periods.current,
          'sessionDefaultChannelGroup',
        ),
      ),
      this.runReport(
        propertyId,
        accessToken,
        ga4ProductPerformanceRequest(periods.current),
      ),
    ]);

    const [
      sourceResponse,
      sourceInquiryResponse,
      sourceLeadResponse,
      sourceEcommerceResponse,
      landingResponse,
      landingInquiryResponse,
      landingLeadResponse,
    ] = await Promise.all([
      this.runReport(
        propertyId,
        accessToken,
        ga4TrafficBreakdownRequest(periods.current, 'sessionSourceMedium'),
      ),
      this.runReport(
        propertyId,
        accessToken,
        ga4InquiryBreakdownRequest(periods.current, 'sessionSourceMedium'),
      ),
      this.runReport(
        propertyId,
        accessToken,
        ga4LeadBreakdownRequest(periods.current, 'sessionSourceMedium'),
      ),
      this.runReport(
        propertyId,
        accessToken,
        ga4EcommerceBreakdownRequest(periods.current, 'sessionSourceMedium'),
      ),
      this.runReport(
        propertyId,
        accessToken,
        ga4TrafficBreakdownRequest(
          periods.current,
          'landingPagePlusQueryString',
        ),
      ),
      this.runReport(
        propertyId,
        accessToken,
        ga4InquiryBreakdownRequest(
          periods.current,
          'landingPagePlusQueryString',
        ),
      ),
      this.runReport(
        propertyId,
        accessToken,
        ga4LeadBreakdownRequest(periods.current, 'landingPagePlusQueryString'),
      ),
    ]);

    const currentOverview = ga4Rows(currentOverviewResponse)[0] || {};
    const previousOverview = ga4Rows(previousOverviewResponse)[0] || {};
    const currentEvents = ga4EventMap(ga4Rows(currentEventsResponse));
    const previousEvents = ga4EventMap(ga4Rows(previousEventsResponse));

    const currentAov = divide(
      currentOverview.purchaseRevenue,
      currentOverview.transactions,
    );
    const previousAov = divide(
      previousOverview.purchaseRevenue,
      previousOverview.transactions,
    );
    const currentLeads =
      currentEvents.generate_lead || currentEvents.form_submit || 0;
    const previousLeads =
      previousEvents.generate_lead || previousEvents.form_submit || 0;

    const currentTransactions = ga4Number(currentOverview.transactions);
    const previousTransactions = ga4Number(previousOverview.transactions);
    const currentSessions = ga4Number(currentOverview.sessions);
    const previousSessions = ga4Number(previousOverview.sessions);
    const currentPurchasers = ga4Number(currentOverview.totalPurchasers);
    const previousPurchasers = ga4Number(previousOverview.totalPurchasers);
    const currentUsers = ga4Number(currentOverview.activeUsers);
    const previousUsers = ga4Number(previousOverview.activeUsers);
    const currentPageViews = ga4Number(currentOverview.screenPageViews);
    const previousPageViews = ga4Number(previousOverview.screenPageViews);

    const metrics = Object.fromEntries(
      GA4_OVERVIEW_METRICS.map((metric) => [
        metric,
        ga4Comparison(
          ga4Number(currentOverview[metric]),
          ga4Number(previousOverview[metric]),
        ),
      ]),
    );

    return {
      source: 'google-analytics-data-api',
      syncedAt: new Date().toISOString(),
      client: { id: client.id, name: client.name },
      property: {
        id: propertyId,
        name: client.googleAnalyticsPropertyName || propertyId,
        currencyCode: currentOverviewResponse.metadata?.currencyCode || 'USD',
        timeZone: currentOverviewResponse.metadata?.timeZone || 'UTC',
      },
      period: periods.current,
      comparisonPeriod: periods.previous,
      metrics: {
        ...metrics,
        averageOrderValue: ga4Comparison(currentAov, previousAov),
        leads: ga4Comparison(currentLeads, previousLeads),
        viewsPerSession: rateComparison(
          currentPageViews,
          currentSessions,
          previousPageViews,
          previousSessions,
        ),
        ecommerceConversionRate: rateComparison(
          currentTransactions,
          currentSessions,
          previousTransactions,
          previousSessions,
        ),
        purchaserRate: rateComparison(
          currentPurchasers,
          currentUsers,
          previousPurchasers,
          previousUsers,
        ),
        cartToCheckoutRate: rateComparison(
          currentEvents.begin_checkout,
          currentEvents.add_to_cart,
          previousEvents.begin_checkout,
          previousEvents.add_to_cart,
        ),
        checkoutToPurchaseRate: rateComparison(
          currentEvents.purchase,
          currentEvents.begin_checkout,
          previousEvents.purchase,
          previousEvents.begin_checkout,
        ),
        productViews: eventComparison(
          'view_item',
          currentEvents,
          previousEvents,
        ),
        addToCarts: eventComparison(
          'add_to_cart',
          currentEvents,
          previousEvents,
        ),
        checkoutStarts: eventComparison(
          'begin_checkout',
          currentEvents,
          previousEvents,
        ),
        purchases: eventComparison('purchase', currentEvents, previousEvents),
        productViewToCartRate: rateComparison(
          currentEvents.add_to_cart,
          currentEvents.view_item,
          previousEvents.add_to_cart,
          previousEvents.view_item,
        ),
        formSubmits: eventComparison(
          'form_submit',
          currentEvents,
          previousEvents,
        ),
        formStarts: eventComparison(
          'form_start',
          currentEvents,
          previousEvents,
        ),
        enquiries: eventComparison('contact', currentEvents, previousEvents),
        visitorToEnquiryRate: rateComparison(
          currentEvents.contact,
          currentSessions,
          previousEvents.contact,
          previousSessions,
        ),
        formStartToEnquiryRate: rateComparison(
          currentEvents.contact,
          currentEvents.form_start,
          previousEvents.contact,
          previousEvents.form_start,
        ),
        formDropOffs: ga4Comparison(
          Math.max(
            ga4Number(currentEvents.form_start) -
              ga4Number(currentEvents.contact),
            0,
          ),
          Math.max(
            ga4Number(previousEvents.form_start) -
              ga4Number(previousEvents.contact),
            0,
          ),
        ),
        qualifiedLeads: eventComparison(
          'qualify_lead',
          currentEvents,
          previousEvents,
        ),
        workingLeads: eventComparison(
          'working_lead',
          currentEvents,
          previousEvents,
        ),
        convertedLeads: eventComparison(
          'close_convert_lead',
          currentEvents,
          previousEvents,
        ),
        disqualifiedLeads: eventComparison(
          'disqualify_lead',
          currentEvents,
          previousEvents,
        ),
        unconvertedLeads: eventComparison(
          'close_unconvert_lead',
          currentEvents,
          previousEvents,
        ),
        formToLeadRate: rateComparison(
          currentLeads,
          currentEvents.form_submit,
          previousLeads,
          previousEvents.form_submit,
        ),
        visitorToLeadRate: rateComparison(
          currentLeads,
          currentSessions,
          previousLeads,
          previousSessions,
        ),
        leadQualificationRate: rateComparison(
          currentEvents.qualify_lead,
          currentLeads,
          previousEvents.qualify_lead,
          previousLeads,
        ),
        leadConversionRate: rateComparison(
          currentEvents.close_convert_lead,
          currentLeads,
          previousEvents.close_convert_lead,
          previousLeads,
        ),
      },
      daily: ga4Rows(dailyResponse).map((row) => ({
        ...row,
        date: ga4ApiDate(String(row.date || '')),
      })),
      previousDaily: ga4Rows(previousDailyResponse).map((row) => ({
        ...row,
        date: ga4ApiDate(String(row.date || '')),
      })),
      ecommerceDaily: mergeDailyEventRows(
        ga4Rows(dailyResponse),
        mapEcommerceStageRows(ga4Rows(ecommerceDailyResponse), 'date'),
      ),
      previousEcommerceDaily: mergeDailyEventRows(
        ga4Rows(previousDailyResponse),
        mapEcommerceStageRows(ga4Rows(previousEcommerceDailyResponse), 'date'),
      ),
      leadDaily: mergeDailyEventRows(
        ga4Rows(dailyResponse),
        mapLeadStageRows(ga4Rows(leadDailyResponse), 'date'),
      ),
      previousLeadDaily: mergeDailyEventRows(
        ga4Rows(previousDailyResponse),
        mapLeadStageRows(ga4Rows(previousLeadDailyResponse), 'date'),
      ),
      inquiryDaily: mergeDailyInquiryRows(
        ga4Rows(dailyResponse),
        mapInquiryStageRows(ga4Rows(inquiryDailyResponse), 'date'),
      ),
      previousInquiryDaily: mergeDailyInquiryRows(
        ga4Rows(previousDailyResponse),
        mapInquiryStageRows(ga4Rows(previousInquiryDailyResponse), 'date'),
      ),
      channels: mergeEventBreakdownRows(
        ga4Rows(channelResponse),
        mapEcommerceStageRows(
          ga4Rows(ecommerceChannelsResponse),
          'sessionDefaultChannelGroup',
        ),
        'sessionDefaultChannelGroup',
        ecommerceStageDefaults(),
        ['purchases', 'checkoutStarts', 'addToCarts'],
      ),
      ecommerceSources: mergeEventBreakdownRows(
        ga4Rows(sourceResponse),
        mapEcommerceStageRows(
          ga4Rows(sourceEcommerceResponse),
          'sessionSourceMedium',
        ),
        'sessionSourceMedium',
        ecommerceStageDefaults(),
        ['purchases', 'checkoutStarts', 'addToCarts'],
      ),
      lifecycle: ga4Rows(lifecycleResponse),
      purchaseJourney: ga4PurchaseJourney(currentEvents, currentSessions),
      leadJourney: ga4LeadJourney(currentEvents, currentSessions),
      inquiryJourney: ga4InquiryJourney(currentEvents, currentSessions),
      leadChannels: mergeEventBreakdownRows(
        ga4Rows(channelResponse),
        mapLeadStageRows(
          ga4Rows(leadChannelsResponse),
          'sessionDefaultChannelGroup',
        ),
        'sessionDefaultChannelGroup',
        leadStageDefaults(),
        ['convertedLeads', 'qualifiedLeads', 'leads', 'formSubmits'],
      ),
      leadSources: mergeEventBreakdownRows(
        ga4Rows(sourceResponse),
        mapLeadStageRows(ga4Rows(sourceLeadResponse), 'sessionSourceMedium'),
        'sessionSourceMedium',
        leadStageDefaults(),
        ['convertedLeads', 'qualifiedLeads', 'leads', 'formSubmits'],
      ),
      inquiryChannels: mergeInquiryBreakdownRows(
        ga4Rows(channelResponse),
        mapInquiryStageRows(
          ga4Rows(inquiryChannelsResponse),
          'sessionDefaultChannelGroup',
        ),
        'sessionDefaultChannelGroup',
      ),
      inquirySources: mergeInquiryBreakdownRows(
        ga4Rows(sourceResponse),
        mapInquiryStageRows(
          ga4Rows(sourceInquiryResponse),
          'sessionSourceMedium',
        ),
        'sessionSourceMedium',
      ),
      inquiryLandingPages: mergeLandingPageRows(
        mergeInquiryBreakdownRows(
          ga4Rows(landingResponse),
          mapInquiryStageRows(
            ga4Rows(landingInquiryResponse),
            'landingPagePlusQueryString',
          ),
          'landingPagePlusQueryString',
        ),
        ga4Rows(pagePathsResponse),
      ),
      leadLandingPages: mergeLandingPageRows(
        mergeEventBreakdownRows(
          ga4Rows(landingResponse),
          mapLeadStageRows(
            ga4Rows(landingLeadResponse),
            'landingPagePlusQueryString',
          ),
          'landingPagePlusQueryString',
          leadStageDefaults(),
          ['convertedLeads', 'qualifiedLeads', 'leads', 'formSubmits'],
        ),
        ga4Rows(pagePathsResponse),
      ),
      productPerformance: ga4Rows(productPerformanceResponse),
      devices: ga4Rows(deviceResponse),
      topPages: ga4Rows(pagesResponse),
      tracking: {
        purchaseEventsDetected: ga4Number(currentEvents.purchase) > 0,
        leadEventsDetected: GA4_LEAD_EVENTS.some(
          (event) => ga4Number(currentEvents[event]) > 0,
        ),
        inquiryEventsDetected:
          ga4Number(currentEvents.form_start) > 0 ||
          ga4Number(currentEvents.contact) > 0,
        checkoutTrackingGap:
          ga4Number(currentEvents.begin_checkout) > 0 &&
          ga4Number(currentEvents.purchase) === 0,
        leadTrackingGap:
          ga4Number(currentEvents.form_submit) > 0 &&
          ga4Number(currentEvents.generate_lead) === 0,
      },
    };
  }

  private async runReport(
    propertyId: string,
    accessToken: string,
    request: Record<string, unknown>,
  ): Promise<Ga4RunReportResponse> {
    try {
      const response = await axios.post<Ga4RunReportResponse>(
        `${this.dataApiBaseUrl}/properties/${propertyId}:runReport`,
        request,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          timeout: 30000,
        },
      );
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<GoogleApiErrorResponse>;
      throw new BadGatewayException({
        message:
          axiosError.response?.data?.error?.message ||
          (axiosError.code === 'ECONNABORTED'
            ? 'Google Analytics request timed out. Please retry.'
            : 'Google Analytics Data API is temporarily unreachable. Please retry.'),
        provider: 'google-analytics',
        providerStatus: axiosError.response?.status || null,
      });
    }
  }
}

function divide(numerator: unknown, denominator: unknown) {
  const safeDenominator = ga4Number(denominator);
  return safeDenominator ? ga4Number(numerator) / safeDenominator : 0;
}

function eventComparison(
  eventName: string,
  current: Record<string, number>,
  previous: Record<string, number>,
) {
  return ga4Comparison(
    ga4Number(current[eventName]),
    ga4Number(previous[eventName]),
  );
}

function rateComparison(
  currentNumerator: unknown,
  currentDenominator: unknown,
  previousNumerator: unknown,
  previousDenominator: unknown,
) {
  return ga4Comparison(
    divide(currentNumerator, currentDenominator),
    divide(previousNumerator, previousDenominator),
  );
}

function mapLeadStageRows(
  rows: Array<Record<string, string | number>>,
  groupKey:
    | 'date'
    | 'sessionDefaultChannelGroup'
    | 'sessionSourceMedium'
    | 'landingPagePlusQueryString',
) {
  const groups = new Map<string, Record<string, string | number>>();
  const stageKeys: Record<string, string> = {
    form_submit: 'formSubmits',
    generate_lead: 'leads',
    qualify_lead: 'qualifiedLeads',
    working_lead: 'workingLeads',
    close_convert_lead: 'convertedLeads',
    disqualify_lead: 'disqualifiedLeads',
    close_unconvert_lead: 'unconvertedLeads',
  };

  rows.forEach((row) => {
    const group = String(row[groupKey] || 'Unassigned');
    const current = groups.get(group) || {
      [groupKey]: group,
      ...leadStageDefaults(),
      eventCount: 0,
    };
    const value = ga4Number(row.eventCount);
    const stageKey = stageKeys[String(row.eventName || '')];
    if (stageKey) current[stageKey] = value;
    current.eventCount = ga4Number(current.eventCount) + value;
    groups.set(group, current);
  });

  return [...groups.values()].sort(
    (left, right) => ga4Number(right.eventCount) - ga4Number(left.eventCount),
  );
}

function leadStageDefaults() {
  return {
    formSubmits: 0,
    leads: 0,
    qualifiedLeads: 0,
    workingLeads: 0,
    convertedLeads: 0,
    disqualifiedLeads: 0,
    unconvertedLeads: 0,
  };
}

function mapEcommerceStageRows(
  rows: Array<Record<string, string | number>>,
  groupKey: 'date' | 'sessionDefaultChannelGroup' | 'sessionSourceMedium',
) {
  const groups = new Map<string, Record<string, string | number>>();
  const stageKeys: Record<string, string> = {
    view_item: 'productViews',
    add_to_cart: 'addToCarts',
    begin_checkout: 'checkoutStarts',
    purchase: 'purchases',
  };

  rows.forEach((row) => {
    const stageKey = stageKeys[String(row.eventName || '')];
    if (!stageKey) return;
    const group = String(row[groupKey] || 'Unassigned');
    const current = groups.get(group) || {
      [groupKey]: group,
      ...ecommerceStageDefaults(),
      eventCount: 0,
    };
    const value = ga4Number(row.eventCount);
    current[stageKey] = value;
    current.eventCount = ga4Number(current.eventCount) + value;
    groups.set(group, current);
  });

  return [...groups.values()];
}

function ecommerceStageDefaults() {
  return {
    productViews: 0,
    addToCarts: 0,
    checkoutStarts: 0,
    purchases: 0,
  };
}

function mergeDailyEventRows(
  dailyRows: Array<Record<string, string | number>>,
  eventRows: Array<Record<string, string | number>>,
) {
  const eventsByDate = new Map(
    eventRows.map((row) => [String(row.date || ''), row]),
  );

  return dailyRows.map((row) => {
    const date = String(row.date || '');
    return {
      ...row,
      ...(eventsByDate.get(date) || {}),
      date: ga4ApiDate(date),
    };
  });
}

function mergeEventBreakdownRows(
  baseRows: Array<Record<string, string | number>>,
  eventRows: Array<Record<string, string | number>>,
  groupKey:
    | 'sessionDefaultChannelGroup'
    | 'sessionSourceMedium'
    | 'landingPagePlusQueryString',
  defaults: Record<string, number>,
  sortKeys: string[],
) {
  const merged = new Map<string, Record<string, string | number>>();

  baseRows.forEach((row) => {
    const group = String(row[groupKey] || 'Unassigned');
    merged.set(group, { ...row, ...defaults });
  });
  eventRows.forEach((row) => {
    const group = String(row[groupKey] || 'Unassigned');
    merged.set(group, {
      ...(merged.get(group) || {
        [groupKey]: group,
        sessions: 0,
        activeUsers: 0,
        engagementRate: 0,
        ...defaults,
      }),
      ...row,
    });
  });

  return [...merged.values()].sort((left, right) => {
    for (const key of sortKeys) {
      const difference = ga4Number(right[key]) - ga4Number(left[key]);
      if (difference) return difference;
    }
    return ga4Number(right.sessions) - ga4Number(left.sessions);
  });
}

function mapInquiryStageRows(
  rows: Array<Record<string, string | number>>,
  groupKey:
    | 'date'
    | 'sessionDefaultChannelGroup'
    | 'sessionSourceMedium'
    | 'landingPagePlusQueryString',
) {
  const groups = new Map<string, Record<string, string | number>>();
  const stageKeys: Record<string, string> = {
    form_start: 'formStarts',
    contact: 'enquiries',
  };

  rows.forEach((row) => {
    const stageKey = stageKeys[String(row.eventName || '')];
    if (!stageKey) return;
    const group = String(row[groupKey] || 'Unassigned');
    const current = groups.get(group) || {
      [groupKey]: group,
      formStarts: 0,
      enquiries: 0,
    };
    current[stageKey] = ga4Number(row.eventCount);
    groups.set(group, current);
  });

  return [...groups.values()];
}

function mergeDailyInquiryRows(
  dailyRows: Array<Record<string, string | number>>,
  inquiryRows: Array<Record<string, string | number>>,
) {
  const inquiriesByDate = new Map(
    inquiryRows.map((row) => [String(row.date || ''), row]),
  );

  return dailyRows.map((row) => {
    const date = String(row.date || '');
    const inquiry = inquiriesByDate.get(date) || {};
    return {
      ...row,
      formStarts: ga4Number(inquiry.formStarts),
      enquiries: ga4Number(inquiry.enquiries),
      date: ga4ApiDate(date),
    };
  });
}

function mergeInquiryBreakdownRows(
  baseRows: Array<Record<string, string | number>>,
  inquiryRows: Array<Record<string, string | number>>,
  groupKey:
    | 'sessionDefaultChannelGroup'
    | 'sessionSourceMedium'
    | 'landingPagePlusQueryString',
) {
  const merged = new Map<string, Record<string, string | number>>();

  baseRows.forEach((row) => {
    const group = String(row[groupKey] || 'Unassigned');
    merged.set(group, { ...row, formStarts: 0, enquiries: 0 });
  });
  inquiryRows.forEach((row) => {
    const group = String(row[groupKey] || 'Unassigned');
    merged.set(group, {
      ...(merged.get(group) || { [groupKey]: group, sessions: 0 }),
      formStarts: ga4Number(row.formStarts),
      enquiries: ga4Number(row.enquiries),
    });
  });

  return [...merged.values()].sort(
    (left, right) =>
      ga4Number(right.enquiries) - ga4Number(left.enquiries) ||
      ga4Number(right.formStarts) - ga4Number(left.formStarts) ||
      ga4Number(right.sessions) - ga4Number(left.sessions),
  );
}

function mergeLandingPageRows(
  landingRows: Array<Record<string, string | number>>,
  pageRows: Array<Record<string, string | number>>,
) {
  const pagesByPath = new Map(
    pageRows.map((row) => [String(row.pagePathPlusQueryString || ''), row]),
  );

  return landingRows.map((row) => {
    const page = pagesByPath.get(String(row.landingPagePlusQueryString || ''));
    return {
      ...row,
      pageUsers: ga4Number(page?.activeUsers),
      screenPageViews: ga4Number(page?.screenPageViews),
    };
  });
}
