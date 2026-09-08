import { BadGatewayException, BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosError } from 'axios';
import { ClientService } from '../client/client.service';
import { customPeriod, monthPeriod, normalizeCampaignResults, normalizeMetrics, percentageChange, precedingPeriod, previousMonthPeriod } from './paid-ads.metrics';
import { MetaInsightRow, PaidAdsPeriod } from './paid-ads.types';

interface MetaCampaign {
  id: string;
  name: string;
  objective?: string;
  effective_status?: string;
  daily_budget?: string;
  lifetime_budget?: string;
}

interface MetaAd {
  id: string;
  name: string;
  effective_status?: string;
  creative?: {
    id?: string;
    name?: string;
    thumbnail_url?: string;
    image_url?: string;
  };
}

interface MetaCreative {
  id: string;
  name?: string;
  thumbnail_url?: string;
  image_url?: string;
  effective_object_story_id?: string;
  object_story_spec?: {
    link_data?: {
      picture?: string;
      message?: string;
      name?: string;
      description?: string;
      link?: string;
      call_to_action?: { type?: string; value?: { link?: string } };
    };
    video_data?: {
      image_url?: string;
      message?: string;
      title?: string;
      link_description?: string;
      call_to_action?: { type?: string; value?: { link?: string } };
    };
  };
}

interface PaidAdsRangeOptions {
  since?: string;
  until?: string;
  compareSince?: string;
  compareUntil?: string;
  campaignId?: string;
}

@Injectable()
export class PaidAdsService {
  private readonly graphBaseUrl: string;
  private readonly timeoutMs = 30000;

  constructor(
    private readonly clientService: ClientService,
    configService: ConfigService,
  ) {
    const version = configService.get<string>('META_GRAPH_API_VERSION') || 'v25.0';
    this.graphBaseUrl = `https://graph.facebook.com/${version}`;
  }

  async getMonthlyComparison(clientId: number, monthsValue: string) {
    const months = [...new Set(String(monthsValue || '').split(',').map((month) => month.trim()).filter(Boolean))];
    if (months.length === 0) {
      throw new BadRequestException('Select at least one month');
    }
    months.forEach((month) => monthPeriod(month));

    const client = await this.clientService.findOne(clientId);
    if (!client.metaAdsAccessToken) {
      throw new BadRequestException('This client does not have a Meta Ads access token');
    }

    const accountId = await this.resolveAdAccountId(client.metaAdAccountId, client.metaAdsAccessToken);
    const rows: Array<{ month: string; label: string; metrics: Record<string, number> }> = [];
    for (let index = 0; index < months.length; index += 4) {
      const chunk = months.slice(index, index + 4);
      const chunkRows = await Promise.all(chunk.map(async (month) => {
        const period = monthPeriod(month);
        const [insightRows, campaignRows] = await Promise.all([
          this.fetchInsights(accountId, client.metaAdsAccessToken!, period, 'account'),
          this.fetchInsights(accountId, client.metaAdsAccessToken!, period, 'campaign'),
        ]);
        const campaigns = campaignRows.map((row) => this.normalizeCampaign(row));
        return {
          month,
          label: period.label,
          metrics: this.reconcileJourneyTotals(this.normalizeFullMetrics(insightRows[0] || {}), campaigns),
        };
      }));
      rows.push(...chunkRows);
    }

    return { months: rows };
  }

  async getInsights(clientId: number, month: string, range: PaidAdsRangeOptions = {}) {
    const client = await this.clientService.findOne(clientId);
    if (!client.metaAdsAccessToken) {
      throw new BadRequestException('This client does not have a Meta Ads access token');
    }

    const accessToken = client.metaAdsAccessToken;
    const accountId = await this.resolveAdAccountId(client.metaAdAccountId, accessToken);
    const hasCurrentRange = Boolean(range.since || range.until);
    const hasComparisonRange = Boolean(range.compareSince || range.compareUntil);
    if (hasCurrentRange && (!range.since || !range.until)) {
      throw new BadRequestException('Both since and until are required for a custom range');
    }
    if (hasComparisonRange && (!range.compareSince || !range.compareUntil)) {
      throw new BadRequestException('Both compareSince and compareUntil are required for a custom comparison');
    }
    if (hasComparisonRange && !hasCurrentRange) {
      throw new BadRequestException('A custom comparison requires a custom current range');
    }

    const currentPeriod = hasCurrentRange
      ? customPeriod(range.since!, range.until!)
      : monthPeriod(month);
    const previousPeriod = hasComparisonRange
      ? customPeriod(range.compareSince!, range.compareUntil!)
      : hasCurrentRange
        ? precedingPeriod(currentPeriod)
        : previousMonthPeriod(month);

    const [account, currentTotalRows, previousTotalRows, dailyRows, previousDailyRows, campaignRows, previousCampaignRows, campaigns, adRows, ads, ageRows, genderRows, countryRows, deviceRows, campaignDailyRows] = await Promise.all([
      this.graphGet(`/${accountId}`, accessToken, { fields: 'id,name,currency,timezone_name' }),
      this.fetchInsights(accountId, accessToken, currentPeriod, 'account'),
      this.fetchInsights(accountId, accessToken, previousPeriod, 'account'),
      this.fetchInsights(accountId, accessToken, currentPeriod, 'account', 1),
      this.fetchInsights(accountId, accessToken, previousPeriod, 'account', 1),
      this.fetchInsights(accountId, accessToken, currentPeriod, 'campaign'),
      this.fetchInsights(accountId, accessToken, previousPeriod, 'campaign'),
      this.fetchCampaigns(accountId, accessToken),
      this.fetchInsights(accountId, accessToken, currentPeriod, 'ad'),
      this.fetchAds(accountId, accessToken),
      this.fetchBreakdown(accountId, accessToken, currentPeriod, 'age'),
      this.fetchBreakdown(accountId, accessToken, currentPeriod, 'gender'),
      this.fetchBreakdown(accountId, accessToken, currentPeriod, 'country'),
      this.fetchBreakdown(accountId, accessToken, currentPeriod, 'impression_device'),
      range.campaignId
        ? this.fetchInsights(accountId, accessToken, currentPeriod, 'campaign', 1, range.campaignId)
        : Promise.resolve([]),
    ]);

    const currentAdIds = new Set(adRows.map((row) => row.ad_id).filter((id): id is string => Boolean(id)));
    const creativeIds = [...new Set(
      ads
        .filter((ad) => currentAdIds.has(ad.id))
        .map((ad) => ad.creative?.id)
        .filter((id): id is string => Boolean(id)),
    )];
    const adCreatives = await this.fetchAdCreatives(creativeIds, accessToken);
    const storyThumbnails = await this.fetchStoryThumbnails(
      adCreatives,
      [client.facebookApiKey, accessToken].filter((token): token is string => Boolean(token)),
    );

    const campaignsById = new Map(campaigns.map((campaign) => [campaign.id, campaign]));
    const adsById = new Map(ads.map((ad) => [ad.id, ad]));
    const adCreativesById = new Map(adCreatives.map((creative) => [creative.id, creative]));
    const normalizedCampaigns = campaignRows.map((row) => this.normalizeCampaign(row, campaignsById.get(row.campaign_id || '')));
    const normalizedPreviousCampaigns = previousCampaignRows.map((row) => this.normalizeCampaign(row, campaignsById.get(row.campaign_id || '')));
    const current = this.reconcileJourneyTotals(this.normalizeFullMetrics(currentTotalRows[0] || {}), normalizedCampaigns);
    const previous = this.reconcileJourneyTotals(this.normalizeFullMetrics(previousTotalRows[0] || {}), normalizedPreviousCampaigns);

    return {
      source: 'meta-marketing-api',
      syncedAt: new Date().toISOString(),
      client: { id: client.id, name: client.name },
      account: { id: accountId, name: account.name || accountId, currency: account.currency || 'USD', timezone: account.timezone_name || 'UTC' },
      period: currentPeriod,
      comparisonPeriod: previousPeriod,
      totals: this.withComparison(current, previous),
      daily: dailyRows.map((row) => this.normalizeDaily(row)),
      previousDaily: previousDailyRows.map((row) => this.normalizeDaily(row)),
      campaigns: normalizedCampaigns,
      selectedCampaign: range.campaignId
        ? this.normalizeCampaign(
          campaignRows.find((row) => row.campaign_id === range.campaignId) || {},
          campaignsById.get(range.campaignId),
        )
        : null,
      campaignDaily: campaignDailyRows.map((row) => this.normalizeDaily(row)),
      creatives: adRows
        .map((row) => {
          const ad = adsById.get(row.ad_id || '');
          const creative = adCreativesById.get(ad?.creative?.id || '');
          return this.normalizeCreative(row, ad, creative, storyThumbnails.get(creative?.id || ''));
        })
        .sort((a, b) => b.spend - a.spend),
      audience: {
        age: this.normalizeBreakdown(ageRows, 'age'),
        gender: this.normalizeBreakdown(genderRows, 'gender'),
        countries: this.normalizeBreakdown(countryRows, 'country'),
        devices: this.normalizeBreakdown(deviceRows, 'impression_device'),
      },
    };
  }

  private withComparison(current: Record<string, number>, previous: Record<string, number>) {
    return Object.fromEntries(Object.keys(current).map((key) => {
      return [key, { current: current[key], previous: previous[key] || 0, change: percentageChange(current[key], previous[key] || 0) }];
    }));
  }

  private normalizeFullMetrics(row: MetaInsightRow): Record<string, number> {
    const {
      resultType: _resultType,
      rawActions: _rawActions,
      rawActionValues: _rawActionValues,
      ...resultMetrics
    } = normalizeCampaignResults(row);
    return { ...normalizeMetrics(row), ...resultMetrics };
  }

  private reconcileJourneyTotals(
    accountMetrics: Record<string, number>,
    campaigns: Array<Record<string, unknown>>,
  ): Record<string, number> {
    const sum = (key: string) => campaigns.reduce((total, campaign) => total + Number(campaign[key] || 0), 0);
    const leads = sum('leads');
    const metaFormLeads = sum('metaFormLeads');
    const websiteLeads = sum('websiteLeads');
    const registrations = sum('registrations');
    const messagingConversations = sum('messagingConversations');
    const messagingConnections = sum('messagingConnections');
    const messagingFirstReplies = sum('messagingFirstReplies');

    return {
      ...accountMetrics,
      leads,
      metaFormLeads,
      websiteLeads,
      registrations,
      messagingConversations,
      messagingConnections,
      messagingFirstReplies,
      costPerLead: leads > 0 ? accountMetrics.spend / leads : 0,
      costPerMessagingConversation: messagingConversations > 0 ? accountMetrics.spend / messagingConversations : 0,
    };
  }

  private normalizeDaily(row: MetaInsightRow) {
    return {
      date: row.date_start,
      ...this.normalizeFullMetrics(row),
    };
  }

  private normalizeCampaign(row: MetaInsightRow, campaign?: MetaCampaign) {
    const metrics = normalizeMetrics(row);
    const objective = row.objective || campaign?.objective || '—';
    const rawBudget = campaign?.lifetime_budget || campaign?.daily_budget;
    return {
      id: row.campaign_id || campaign?.id,
      name: row.campaign_name || campaign?.name || 'Unnamed campaign',
      status: campaign?.effective_status || 'UNKNOWN',
      objective,
      budget: rawBudget ? Number(rawBudget) / 100 : null,
      budgetType: campaign?.lifetime_budget ? 'lifetime' : campaign?.daily_budget ? 'daily' : null,
      ...metrics,
      ...normalizeCampaignResults(row, objective),
    };
  }

  private normalizeCreative(row: MetaInsightRow, ad?: MetaAd, creative?: MetaCreative, storyThumbnail?: string) {
    const linkData = creative?.object_story_spec?.link_data;
    const videoData = creative?.object_story_spec?.video_data;
    const callToAction = videoData?.call_to_action || linkData?.call_to_action;
    return {
      id: row.ad_id || ad?.id,
      name: row.ad_name || ad?.name || 'Unnamed ad',
      campaignName: row.campaign_name || 'Unknown campaign',
      status: ad?.effective_status || 'UNKNOWN',
      thumbnailUrl:
        storyThumbnail
        || creative?.object_story_spec?.video_data?.image_url
        || creative?.object_story_spec?.link_data?.picture
        || creative?.thumbnail_url
        || creative?.image_url
        || ad?.creative?.thumbnail_url
        || ad?.creative?.image_url
        || null,
      creativeId: ad?.creative?.id || null,
      creativeName: creative?.name || ad?.creative?.name || null,
      mediaType: videoData ? 'Video' : linkData ? 'Image / link' : 'Ad creative',
      body: videoData?.message || linkData?.message || null,
      headline: videoData?.title || linkData?.name || null,
      description: videoData?.link_description || linkData?.description || null,
      callToAction: callToAction?.type?.replaceAll('_', ' ') || null,
      destinationUrl: callToAction?.value?.link || linkData?.link || null,
      ...normalizeMetrics(row),
      ...normalizeCampaignResults(row),
    };
  }

  private normalizeBreakdown(rows: Array<MetaInsightRow & Record<string, unknown>>, dimension: string) {
    return rows
      .map((row) => ({ key: String(row[dimension] || 'unknown'), ...normalizeMetrics(row), ...normalizeCampaignResults(row) }))
      .sort((a, b) => b.conversions - a.conversions);
  }

  private async resolveAdAccountId(configuredId: string | null, accessToken: string): Promise<string> {
    if (configuredId) return configuredId.startsWith('act_') ? configuredId : `act_${configuredId}`;
    let response: any;
    try {
      response = await this.graphGet('/me/adaccounts', accessToken, { fields: 'id,name,account_status', limit: 100 });
    } catch {
      throw new BadRequestException('Save this client’s Meta Ad Account ID (act_...) and use a token with ads_read permission');
    }
    const accessible = (response.data || []).filter((account: any) => Number(account.account_status) === 1);
    if (accessible.length === 1) return accessible[0].id;
    if (accessible.length === 0) throw new BadRequestException('No active Meta ad account is accessible with this token');
    throw new BadRequestException('Multiple Meta ad accounts are accessible. Save the Meta Ad Account ID on this client for accurate mapping');
  }

  private fetchInsights(accountId: string, token: string, period: PaidAdsPeriod, level: 'account' | 'campaign' | 'ad', timeIncrement?: number, campaignId?: string) {
    const metricFields = [
      'date_start', 'date_stop', 'spend', 'reach', 'impressions', 'clicks',
      'frequency', 'unique_clicks', 'inline_link_clicks', 'inline_link_click_ctr',
      'outbound_clicks', 'unique_outbound_clicks', 'outbound_clicks_ctr', 'cost_per_outbound_click',
      'ctr', 'cpc', 'cpm', 'cpp', 'cost_per_inline_link_click',
      'actions', 'action_values', 'cost_per_action_type',
      'purchase_roas', 'website_purchase_roas',
    ];
    const fields = level === 'campaign'
      ? [
        'campaign_id', 'campaign_name', 'objective', ...metricFields,
      ]
      : level === 'ad'
        ? ['ad_id', 'ad_name', 'campaign_id', 'campaign_name', ...metricFields]
        : metricFields;
    return this.graphGetAll(`/${accountId}/insights`, token, {
      fields: fields.join(','),
      level,
      time_range: JSON.stringify({ since: period.since, until: period.until }),
      ...(timeIncrement ? { time_increment: timeIncrement } : {}),
      ...(campaignId ? { filtering: JSON.stringify([{ field: 'campaign.id', operator: 'EQUAL', value: campaignId }]) } : {}),
      limit: 500,
    });
  }

  private fetchCampaigns(accountId: string, token: string): Promise<MetaCampaign[]> {
    return this.graphGetAll(`/${accountId}/campaigns`, token, {
      fields: 'id,name,objective,effective_status,daily_budget,lifetime_budget',
      limit: 500,
    });
  }

  private fetchAds(accountId: string, token: string): Promise<MetaAd[]> {
    return this.graphGetAll(`/${accountId}/ads`, token, {
      fields: 'id,name,effective_status,creative{id,name,thumbnail_url,image_url}',
      limit: 500,
    });
  }

  private async fetchAdCreatives(creativeIds: string[], token: string): Promise<MetaCreative[]> {
    if (creativeIds.length === 0) return [];

    const chunks: string[][] = [];
    for (let index = 0; index < creativeIds.length; index += 50) {
      chunks.push(creativeIds.slice(index, index + 50));
    }

    const responses = await Promise.all(chunks.map((ids) => this.graphGet('/', token, {
      ids: ids.join(','),
      fields: 'id,name,thumbnail_url,image_url,effective_object_story_id,object_story_spec',
      thumbnail_width: 1200,
      thumbnail_height: 675,
    })));

    return responses.flatMap((response) => Object.values(response) as MetaCreative[]);
  }

  private async fetchStoryThumbnails(creatives: MetaCreative[], tokens: string[]): Promise<Map<string, string>> {
    const storyToCreative = new Map<string, string>();
    creatives.forEach((creative) => {
      if (creative.effective_object_story_id) {
        storyToCreative.set(creative.effective_object_story_id, creative.id);
      }
    });

    const thumbnails = new Map<string, string>();
    const uniqueTokens = [...new Set(tokens)];

    for (const token of uniqueTokens) {
      const remainingStories = [...storyToCreative.entries()]
        .filter(([, creativeId]) => !thumbnails.has(creativeId))
        .map(([storyId]) => storyId);

      for (let index = 0; index < remainingStories.length; index += 50) {
        const storyIds = remainingStories.slice(index, index + 50);
        try {
          const response = await this.graphGet('/', token, {
            ids: storyIds.join(','),
            fields: 'id,full_picture,attachments{media,type,subattachments}',
          });

          Object.entries(response).forEach(([storyId, rawStory]) => {
            const story = rawStory as any;
            const attachment = story.attachments?.data?.[0];
            const subAttachment = attachment?.subattachments?.data?.[0];
            const image = story.full_picture
              || attachment?.media?.image?.src
              || subAttachment?.media?.image?.src;
            const creativeId = storyToCreative.get(storyId);
            if (creativeId && image) thumbnails.set(creativeId, image);
          });
        } catch {
          // A page token can only read stories belonging to pages it manages.
          // The next available token may still resolve the remaining stories.
        }
      }
    }

    return thumbnails;
  }

  private fetchBreakdown(accountId: string, token: string, period: PaidAdsPeriod, breakdown: 'age' | 'gender' | 'country' | 'impression_device') {
    return this.graphGetAll(`/${accountId}/insights`, token, {
      fields: 'spend,reach,impressions,clicks,actions,action_values,purchase_roas,website_purchase_roas',
      level: 'account',
      breakdowns: breakdown,
      time_range: JSON.stringify({ since: period.since, until: period.until }),
      limit: 500,
    });
  }

  private async graphGetAll(path: string, accessToken: string, params: Record<string, unknown>): Promise<any[]> {
    const rows: any[] = [];
    let url: string | null = `${this.graphBaseUrl}${path}`;
    let requestParams: Record<string, unknown> = { ...params, access_token: accessToken };
    while (url) {
      const response = await this.rawGet(url, requestParams);
      rows.push(...(response.data || []));
      url = response.paging?.next || null;
      requestParams = {};
    }
    return rows;
  }

  private graphGet(path: string, accessToken: string, params: Record<string, unknown>) {
    return this.rawGet(`${this.graphBaseUrl}${path}`, { ...params, access_token: accessToken });
  }

  private async rawGet(url: string, params: Record<string, unknown>) {
    const maxAttempts = 3;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        const response = await axios.get(url, { params, timeout: this.timeoutMs });
        return response.data;
      } catch (error) {
        const axiosError = error as AxiosError<any>;
        const metaMessage = axiosError.response?.data?.error?.message;
        const status = axiosError.response?.status;
        const retryable = !axiosError.response || (status !== undefined && status >= 500);

        if (retryable && attempt < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, attempt * 400));
          continue;
        }

        const networkMessage = axiosError.code === 'ECONNABORTED'
          ? 'Meta Marketing API request timed out. Please retry.'
          : 'Meta Marketing API is temporarily unreachable. Please retry.';

        throw new BadGatewayException({
          message: metaMessage || networkMessage,
          provider: 'meta',
          providerStatus: status || null,
        });
      }
    }

    throw new BadGatewayException('Meta Marketing API request failed');
  }
}
