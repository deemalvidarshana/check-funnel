import axios from 'axios';
import { PaidAdsService } from './paid-ads.service';

describe('PaidAdsService', () => {
  afterEach(() => jest.restoreAllMocks());

  it('requires the dedicated Meta Ads token without falling back to the Facebook token', async () => {
    const clientService = {
      findOne: jest.fn().mockResolvedValue({ id: 19, name: 'Test Client', facebookApiKey: 'page-token', metaAdAccountId: 'act_123' }),
    };
    const configService = { get: jest.fn().mockReturnValue('v25.0') };
    const service = new PaidAdsService(clientService as any, configService as any);

    await expect(service.getInsights(19, '2026-08')).rejects.toThrow('Meta Ads access token');
  });

  it('maps account totals, daily series, comparison, and campaign rows from Meta responses', async () => {
    const clientService = {
      findOne: jest.fn().mockResolvedValue({ id: 19, name: 'Test Client', metaAdsAccessToken: 'test-token', metaAdAccountId: 'act_123' }),
    };
    const configService = { get: jest.fn().mockReturnValue('v25.0') };
    let accountAttempts = 0;
    jest.spyOn(axios, 'get').mockImplementation(async (url: string, config: any) => {
      if (url.endsWith('/act_123')) {
        accountAttempts += 1;
        if (accountAttempts === 1) {
          const networkError = new Error('Temporary Meta network failure') as Error & { code: string };
          networkError.code = 'ENOTFOUND';
          throw networkError;
        }
        return { data: { id: 'act_123', name: 'Test Ads', currency: 'USD', timezone_name: 'UTC' } };
      }
      if (url.endsWith('/act_123/campaigns')) return { data: { data: [{ id: 'c1', name: 'Campaign One', objective: 'OUTCOME_SALES', effective_status: 'ACTIVE', lifetime_budget: '50000', adsets: { data: [] } }] } };
      if (url.endsWith('/act_123/ads')) return { data: { data: [{ id: 'a1', name: 'Creative Ad', effective_status: 'ACTIVE', creative: { id: 'cr1', thumbnail_url: 'https://example.com/creative.jpg' } }] } };
      if (url.endsWith('/v25.0/')) {
        if (config.params.ids === 'story1') {
          return { data: { story1: { id: 'story1', full_picture: 'https://example.com/story.jpg' } } };
        }
        return { data: { cr1: { id: 'cr1', thumbnail_url: 'https://example.com/creative-large.jpg', effective_object_story_id: 'story1' } } };
      }
      if (url.endsWith('/act_123/insights')) {
        const range = JSON.parse(config.params.time_range);
        if (config.params.breakdowns) return { data: { data: [{ [config.params.breakdowns]: 'sample', spend: '20', reach: '200', impressions: '250', clicks: '10', actions: [{ action_type: 'offsite_conversion', value: '2' }] }] } };
        if (config.params.level === 'campaign') return { data: { data: [{ campaign_id: 'c1', campaign_name: 'Campaign One', spend: '100', reach: '800', impressions: '1000', clicks: '50', actions: [{ action_type: 'offsite_conversion', value: '5' }] }] } };
        if (config.params.level === 'ad') return { data: { data: [{ ad_id: 'a1', ad_name: 'Creative Ad', campaign_id: 'c1', campaign_name: 'Campaign One', spend: '60', reach: '500', impressions: '600', clicks: '30', actions: [{ action_type: 'offsite_conversion', value: '3' }] }] } };
        if (config.params.time_increment === 1) return { data: { data: [{ date_start: range.since, spend: range.since.startsWith('2026-08') ? '10' : '8', reach: '80', impressions: '100', clicks: '5', actions: [{ action_type: 'offsite_conversion', value: '1' }] }] } };
        return { data: { data: [{ spend: range.since.startsWith('2026-08') ? '100' : '80', reach: '800', impressions: '1000', clicks: '50', actions: [{ action_type: 'offsite_conversion', value: range.since.startsWith('2026-08') ? '5' : '4' }] }] } };
      }
      throw new Error(`Unexpected Meta URL ${url}`);
    });

    const service = new PaidAdsService(clientService as any, configService as any);
    const result = await service.getInsights(19, '2026-08');

    expect(result.account).toMatchObject({ id: 'act_123', currency: 'USD' });
    expect(result.totals.spend).toMatchObject({ current: 100, previous: 80, change: 25 });
    expect(result.daily).toHaveLength(1);
    expect(result.previousDaily).toHaveLength(1);
    expect(result.campaigns[0]).toMatchObject({ id: 'c1', status: 'ACTIVE', budget: 500, spend: 100, conversions: 5, cpa: 20 });
    expect(result.creatives[0]).toMatchObject({ id: 'a1', name: 'Creative Ad', thumbnailUrl: 'https://example.com/story.jpg', spend: 60, conversions: 3 });
    expect(result.audience.age[0]).toMatchObject({ key: 'sample', conversions: 2 });
    expect(result.audience.countries[0]).toMatchObject({ key: 'sample', conversions: 2 });
    expect(result.audience.regions[0]).toMatchObject({ key: 'sample', conversions: 2 });
    expect(result.audience.devices[0]).toMatchObject({ key: 'sample', reach: 200 });
    expect(accountAttempts).toBe(2);
  });

  it('fetches exact calendar-month buckets for both custom ranges', async () => {
    const clientService = {
      findOne: jest.fn().mockResolvedValue({ id: 19, metaAdsAccessToken: 'test-token', metaAdAccountId: 'act_123' }),
    };
    const configService = { get: jest.fn().mockReturnValue('v25.0') };
    const requested: string[] = [];
    jest.spyOn(axios, 'get').mockImplementation(async (_url: string, config: any) => {
      const range = JSON.parse(config.params.time_range);
      requested.push(`${config.params.level}:${range.since}:${range.until}`);
      const month = Number(range.since.slice(5, 7));
      return { data: { data: config.params.level === 'campaign'
        ? [{ campaign_id: `c${month}`, actions: [{ action_type: 'lead', value: '1' }] }]
        : [{ spend: String(month * 10), reach: String(month * 100), impressions: String(month * 200) }],
      } };
    });

    const service = new PaidAdsService(clientService as any, configService as any);
    const result = await service.getRangeMonthlyComparison(
      19, '2026-07-10', '2026-08-20', '2026-05-10', '2026-06-25',
    );

    expect(result.comparisonSeries[0].rows.map((row) => row?.week)).toEqual(['Jul 2026', 'Aug 2026']);
    expect(result.comparisonSeries[1].rows.map((row) => row?.week)).toEqual(['May 2026', 'Jun 2026']);
    expect(result.comparisonSeries[0].rows.map((row) => row?.reach)).toEqual([700, 800]);
    expect(requested).toContain('account:2026-07-10:2026-07-31');
    expect(requested).toContain('account:2026-08-01:2026-08-20');
    expect(requested).toContain('account:2026-05-10:2026-05-31');
    expect(requested).toContain('account:2026-06-01:2026-06-25');
    expect(requested).toHaveLength(8);
  });
});
