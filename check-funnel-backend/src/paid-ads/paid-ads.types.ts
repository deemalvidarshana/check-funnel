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
  frequency?: string;
  clicks?: string;
  unique_clicks?: string;
  inline_link_clicks?: string;
  inline_link_click_ctr?: string;
  outbound_clicks?: MetaActionValue[];
  unique_outbound_clicks?: MetaActionValue[];
  outbound_clicks_ctr?: MetaActionValue[];
  cost_per_outbound_click?: MetaActionValue[];
  ctr?: string;
  cpc?: string;
  cpm?: string;
  cpp?: string;
  cost_per_inline_link_click?: string;
  actions?: MetaActionValue[];
  action_values?: MetaActionValue[];
  cost_per_action_type?: MetaActionValue[];
  purchase_roas?: MetaActionValue[];
  website_purchase_roas?: MetaActionValue[];
}

export interface CampaignResultMetrics {
  frequency: number;
  uniqueClicks: number;
  linkClicks: number;
  linkCtr: number;
  outboundClicks: number;
  uniqueOutboundClicks: number;
  outboundCtr: number;
  costPerOutboundClick: number;
  cpm: number;
  cpp: number;
  costPerLinkClick: number;
  landingPageViews: number;
  costPerLandingPageView: number;
  contentViews: number;
  addToCart: number;
  initiateCheckout: number;
  purchases: number;
  purchaseValue: number;
  purchaseRoas: number;
  leads: number;
  metaFormLeads: number;
  websiteLeads: number;
  costPerLead: number;
  messagingConversations: number;
  messagingConnections: number;
  messagingFirstReplies: number;
  costPerMessagingConversation: number;
  postEngagements: number;
  pageEngagements: number;
  videoViews: number;
  reactions: number;
  comments: number;
  saves: number;
  searches: number;
  addPaymentInfo: number;
  registrations: number;
  results: number;
  resultType: string;
  costPerResult: number;
  rawActions: Record<string, number>;
  rawActionValues: Record<string, number>;
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
