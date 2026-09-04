import {
  ga4DailyRequest,
  ga4PagePathRequest,
} from './google-analytics-report.requests';

const period = {
  startDate: '2026-08-01',
  endDate: '2026-08-31',
  label: 'August 2026',
};

describe('Google Analytics report requests', () => {
  it('includes page views in the daily traffic series', () => {
    const request = ga4DailyRequest(period);

    expect(request.metrics).toContainEqual({ name: 'screenPageViews' });
  });

  it('requests exact page-path users and views separately from landing attribution', () => {
    const request = ga4PagePathRequest(period);

    expect(request.dimensions).toEqual([{ name: 'pagePathPlusQueryString' }]);
    expect(request.metrics).toEqual([
      { name: 'activeUsers' },
      { name: 'screenPageViews' },
    ]);
  });
});
