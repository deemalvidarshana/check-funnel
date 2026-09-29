import { ClientInsightsReportService } from './client-insights-report.service';

describe('ClientInsightsReportService comparison series', () => {
  it('returns separate calendar-month points within each selected range', async () => {
    const clientService = {
      findOne: jest.fn().mockResolvedValue({
        id: 1,
        name: 'Example',
        facebookPageId: 'page',
        facebookApiKey: 'token',
        instagramAccountId: 'account',
        instagramApiKey: 'token',
        tiktokApiKey: 'token',
        tiktokClientKey: 'key',
        tiktokClientSecret: 'secret',
      }),
    };
    const facebookService = {
      getInsights: jest.fn().mockImplementation(async ({ since }) => ({
        views: { organic: Number(since.slice(5, 7)), ads: 0 },
      })),
    };
    const instagramService = {
      getRangeInsights: jest.fn().mockImplementation(async ({ ranges }) => ({
        weeks: ranges.map((range) => ({
          since: range.since,
          until: range.until,
          views: { organic: Number(range.since.slice(5, 7)), ads: 0 },
        })),
      })),
    };
    const tiktokService = {
      getInsights: jest.fn().mockResolvedValue({
        videos: ['2026-05-15', '2026-06-15', '2026-07-15', '2026-08-15'].map(
          (date) => ({
            create_time: Math.floor(new Date(`${date}T12:00:00Z`).getTime() / 1000),
            view_count: Number(date.slice(5, 7)),
          }),
        ),
      }),
    };
    const service = new ClientInsightsReportService(
      clientService as never,
      facebookService as never,
      instagramService as never,
      tiktokService as never,
    );
    const ranges = [
      { label: 'Selected', since: '2026-07-10', until: '2026-08-20' },
      { label: 'Compare', since: '2026-05-10', until: '2026-06-25' },
    ];

    const report = await service.buildReport(1, undefined, ranges);
    for (const platform of ['facebook', 'instagram', 'tiktok']) {
      const series = report.platforms[platform].comparisonSeries;
      expect(series).toHaveLength(2);
      expect(series[0].rows.map((row) => row.week)).toEqual([
        'Jul 2026',
        'Aug 2026',
      ]);
      expect(series[1].rows.map((row) => row.week)).toEqual([
        'May 2026',
        'Jun 2026',
      ]);
      expect(series[0].rows.map((row) => row.since)).toEqual([
        '2026-07-10',
        '2026-08-01',
      ]);
      expect(series[1].rows.map((row) => row.until)).toEqual([
        '2026-05-31',
        '2026-06-25',
      ]);
    }
    expect(report.platforms.facebook.comparisonSeries[0].rows.map((row) => row.views.organic)).toEqual([7, 8]);
    expect(report.platforms.instagram.comparisonSeries[1].rows.map((row) => row.views.organic)).toEqual([5, 6]);
    expect(report.platforms.tiktok.comparisonSeries[0].rows.map((row) => row.view_count)).toEqual([7, 8]);
  });
});
