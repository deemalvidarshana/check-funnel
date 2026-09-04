import {
  ga4ApiDate,
  ga4CustomPeriods,
  ga4EventMap,
  ga4MonthPeriods,
  ga4Rows,
} from './google-analytics-report.utils';

describe('Google Analytics report utilities', () => {
  it('builds current and previous periods across a year boundary', () => {
    expect(ga4MonthPeriods('2026-01')).toEqual({
      current: {
        startDate: '2026-01-01',
        endDate: '2026-01-31',
        label: 'January 2026',
      },
      previous: {
        startDate: '2025-12-01',
        endDate: '2025-12-31',
        label: 'December 2025',
      },
    });
  });

  it('compares a partial current month with the same elapsed days', () => {
    expect(
      ga4MonthPeriods('2026-09', new Date('2026-09-02T10:00:00Z')),
    ).toEqual({
      current: {
        startDate: '2026-09-01',
        endDate: '2026-09-02',
        label: 'September 2026',
      },
      previous: {
        startDate: '2026-08-01',
        endDate: '2026-08-02',
        label: 'August 2026',
      },
    });
  });

  it('builds validated custom comparison periods', () => {
    expect(
      ga4CustomPeriods('2026-08-05', '2026-08-20', '2026-07-05', '2026-07-20'),
    ).toEqual({
      current: {
        startDate: '2026-08-05',
        endDate: '2026-08-20',
        label: '5 Aug 2026 – 20 Aug 2026',
      },
      previous: {
        startDate: '2026-07-05',
        endDate: '2026-07-20',
        label: '5 Jul 2026 – 20 Jul 2026',
      },
    });
  });

  it('rejects invalid custom comparison dates', () => {
    expect(() =>
      ga4CustomPeriods('2026-08-20', '2026-08-05', '2026-07-05', '2026-07-20'),
    ).toThrow('Range start dates must be before end dates');
  });

  it('maps Data API headers to typed row values', () => {
    const rows = ga4Rows({
      dimensionHeaders: [{ name: 'eventName' }],
      metricHeaders: [{ name: 'eventCount' }],
      rows: [
        {
          dimensionValues: [{ value: 'generate_lead' }],
          metricValues: [{ value: '12' }],
        },
      ],
    });

    expect(rows).toEqual([{ eventName: 'generate_lead', eventCount: 12 }]);
    expect(ga4EventMap(rows)).toEqual({ generate_lead: 12 });
  });

  it('formats compact GA4 dates', () => {
    expect(ga4ApiDate('20260902')).toBe('2026-09-02');
  });
});
