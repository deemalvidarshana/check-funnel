export interface MetaActionValue {
  action_type: string;
  value: string;
}

export interface MetaInsightRow {
  date_start?: string;
  date_stop?: string;
  campaign_id?: string;
  campaign_name?: string;
  ad_id?: string;
  ad_name?: string;
  objective?: string;
  spend?: string;
  reach?: string;
  impressions?: string;
  clicks?: string;
  actions?: MetaActionValue[];
}

export interface PaidAdsMetrics {
  spend: number;
  reach: number;
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
  cpc: number;
  cpa: number;
}

export interface PaidAdsPeriod {
  since: string;
  until: string;
  label: string;
}
