import { BadRequestException } from '@nestjs/common';
import {
  Ga4MetricComparison,
  Ga4Period,
  Ga4ReportRow,
  Ga4RunReportResponse,
} from './google-analytics-report.types';

export function ga4MonthPeriods(
  month: string,
  today = new Date(),
): {
  current: Ga4Period;
  previous: Ga4Period;
} {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month || '')) {
    throw new BadRequestException('Month must use YYYY-MM format');
  }

  const [year, monthNumber] = month.split('-').map(Number);
  const currentStart = new Date(Date.UTC(year, monthNumber - 1, 1));
  const previousStart = new Date(Date.UTC(year, monthNumber - 2, 1));
  const isCurrentMonth =
    today.getUTCFullYear() === year && today.getUTCMonth() === monthNumber - 1;
  const comparableDay = isCurrentMonth ? today.getUTCDate() : undefined;

  return {
    current: periodFromStart(currentStart, comparableDay),
    previous: periodFromStart(previousStart, comparableDay),
  };
}

export function ga4CustomPeriods(
  startDate: string,
  endDate: string,
  comparisonStartDate: string,
  comparisonEndDate: string,
): { current: Ga4Period; previous: Ga4Period } {
  const values = [startDate, endDate, comparisonStartDate, comparisonEndDate];
  if (values.some((value) => !/^\d{4}-\d{2}-\d{2}$/.test(value || ''))) {
    throw new BadRequestException('Custom ranges must use YYYY-MM-DD dates');
  }

  const dates = values.map((value) => new Date(`${value}T00:00:00Z`));
  if (
    dates.some(
      (date, index) =>
        Number.isNaN(date.getTime()) || isoDate(date) !== values[index],
    )
  ) {
    throw new BadRequestException('Custom ranges contain an invalid date');
  }
  if (startDate > endDate || comparisonStartDate > comparisonEndDate) {
    throw new BadRequestException('Range start dates must be before end dates');
  }

  const maxRangeDays = 366;
  const rangeDays = (start: Date, end: Date) =>
    Math.floor((end.getTime() - start.getTime()) / 86_400_000) + 1;
  if (
    rangeDays(dates[0], dates[1]) > maxRangeDays ||
    rangeDays(dates[2], dates[3]) > maxRangeDays
  ) {
    throw new BadRequestException('Custom ranges cannot exceed 366 days');
  }

  const toPeriod = (start: string, end: string): Ga4Period => ({
    startDate: start,
    endDate: end,
    label: `${formatPeriodDate(start)} – ${formatPeriodDate(end)}`,
  });

  return {
    current: toPeriod(startDate, endDate),
    previous: toPeriod(comparisonStartDate, comparisonEndDate),
  };
}

function formatPeriodDate(value: string) {
  return new Date(`${value}T00:00:00Z`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

function periodFromStart(start: Date, throughDay?: number): Ga4Period {
  const lastDay = new Date(
    Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 0),
  ).getUTCDate();
  const end = new Date(
    Date.UTC(
      start.getUTCFullYear(),
      start.getUTCMonth(),
      Math.min(throughDay || lastDay, lastDay),
    ),
  );
  return {
    startDate: isoDate(start),
    endDate: isoDate(end),
    label: start.toLocaleDateString('en-GB', {
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    }),
  };
}

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function ga4Rows(response: Ga4RunReportResponse): Ga4ReportRow[] {
  const dimensions = response.dimensionHeaders || [];
  const metrics = response.metricHeaders || [];

  return (response.rows || []).map((row) => {
    const normalized: Ga4ReportRow = {};
    dimensions.forEach((header, index) => {
      normalized[header.name] = row.dimensionValues?.[index]?.value || '';
    });
    metrics.forEach((header, index) => {
      normalized[header.name] = ga4Number(row.metricValues?.[index]?.value);
    });
    return normalized;
  });
}

export function ga4Number(value: unknown): number {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function ga4PercentageChange(current: number, previous: number): number {
  if (previous === 0) return current === 0 ? 0 : 100;
  return ((current - previous) / Math.abs(previous)) * 100;
}

export function ga4Comparison(
  current: number,
  previous: number,
): Ga4MetricComparison {
  return {
    current,
    previous,
    change: ga4PercentageChange(current, previous),
  };
}

export function ga4EventMap(rows: Ga4ReportRow[]): Record<string, number> {
  return Object.fromEntries(
    rows.map((row) => [String(row.eventName || ''), ga4Number(row.eventCount)]),
  );
}

export function ga4ApiDate(value: string): string {
  return /^\d{8}$/.test(value)
    ? `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`
    : value;
}
