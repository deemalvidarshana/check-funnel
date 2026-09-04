export interface Ga4Period {
  startDate: string;
  endDate: string;
  label: string;
}

export interface Ga4MetricComparison {
  current: number;
  previous: number;
  change: number;
}

export interface Ga4ReportRow {
  [key: string]: string | number;
}

export interface Ga4RunReportResponse {
  dimensionHeaders?: Array<{ name: string }>;
  metricHeaders?: Array<{ name: string; type?: string }>;
  rows?: Array<{
    dimensionValues?: Array<{ value?: string }>;
    metricValues?: Array<{ value?: string }>;
  }>;
  metadata?: {
    currencyCode?: string;
    timeZone?: string;
  };
}
