import { conversionCount, monthPeriod, normalizeMetrics, percentageChange, previousMonthPeriod } from './paid-ads.metrics';

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

  it('handles percentage comparisons with zero baselines', () => {
    expect(percentageChange(120, 100)).toBe(20);
    expect(percentageChange(0, 0)).toBe(0);
    expect(percentageChange(10, 0)).toBeNull();
  });
});
