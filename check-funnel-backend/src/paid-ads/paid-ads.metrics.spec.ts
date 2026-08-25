import {
  conversionCount,
  customPeriod,
  monthPeriod,
  normalizeCampaignResults,
  normalizeMetrics,
  percentageChange,
  precedingPeriod,
  previousMonthPeriod,
} from './paid-ads.metrics';

describe('paid ads metric normalization', () => {
  it('calculates derived metrics without double-counting conversions', () => {
    const result = normalizeMetrics({
      spend: '100', impressions: '2000', clicks: '100', reach: '1500',
      actions: [
        { action_type: 'offsite_conversion', value: '10' },
        { action_type: 'purchase', value: '7' },
      ],
    });
    expect(result).toEqual({ spend: 100, reach: 1500, impressions: 2000, clicks: 100, conversions: 10, ctr: 5, cpc: 1, cpa: 10 });
    expect(conversionCount([{ action_type: 'purchase', value: '3' }])).toBe(3);
  });

  it('builds calendar-month ranges including leap years', () => {
    expect(monthPeriod('2024-02')).toMatchObject({ since: '2024-02-01', until: '2024-02-29' });
    expect(previousMonthPeriod('2024-01')).toMatchObject({ since: '2023-12-01', until: '2023-12-31' });
  });

  it('builds and validates custom comparison ranges', () => {
    const current = customPeriod('2026-08-10', '2026-08-25');
    expect(current).toMatchObject({ since: '2026-08-10', until: '2026-08-25' });
    expect(precedingPeriod(current)).toMatchObject({ since: '2026-07-25', until: '2026-08-09' });
    expect(() => customPeriod('2026-08-25', '2026-08-10')).toThrow('since must be on or before until');
  });

  it('handles percentage comparisons with zero baselines', () => {
    expect(percentageChange(120, 100)).toBe(20);
    expect(percentageChange(0, 0)).toBe(0);
    expect(percentageChange(10, 0)).toBeNull();
  });

  it('normalizes objective-specific campaign results without double-counting Meta action variants', () => {
    const result = normalizeCampaignResults({
      spend: '200',
      reach: '1000',
      impressions: '2000',
      clicks: '100',
      inline_link_clicks: '80',
      unique_clicks: '70',
      actions: [
        { action_type: 'omni_purchase', value: '5' },
        { action_type: 'purchase', value: '5' },
        { action_type: 'offsite_conversion.fb_pixel_purchase', value: '5' },
        { action_type: 'landing_page_view', value: '60' },
        { action_type: 'add_to_cart', value: '12' },
      ],
      action_values: [
        { action_type: 'omni_purchase', value: '1000' },
        { action_type: 'purchase', value: '1000' },
      ],
    }, 'OUTCOME_SALES');

    expect(result).toMatchObject({
      results: 5,
      resultType: 'Purchases',
      costPerResult: 40,
      purchases: 5,
      purchaseValue: 1000,
      purchaseRoas: 5,
      landingPageViews: 60,
      addToCart: 12,
      linkClicks: 80,
      uniqueClicks: 70,
    });
  });

  it('maps legacy Meta campaign objectives to the correct result type', () => {
    const result = normalizeCampaignResults({
      spend: '90',
      impressions: '1000',
      inline_link_clicks: '30',
      actions: [{ action_type: 'landing_page_view', value: '20' }],
    }, 'LINK_CLICKS');

    expect(result).toMatchObject({
      results: 20,
      resultType: 'Landing page views',
      costPerResult: 4.5,
    });
  });
});
