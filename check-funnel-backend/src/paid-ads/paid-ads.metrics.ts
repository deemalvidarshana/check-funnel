import { BadRequestException } from '@nestjs/common';
import { MetaActionValue, MetaInsightRow, PaidAdsMetrics, PaidAdsPeriod } from './paid-ads.types';

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
