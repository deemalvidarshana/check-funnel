export const paidMetricOptions = [
  { key: "spend", label: "Spend", color: "#2563eb", money: true },
  { key: "reach", label: "Reach", color: "#06b6d4" },
  { key: "impressions", label: "Impressions", color: "#8b5cf6" },
  { key: "clicks", label: "Clicks", color: "#22b982" },
  { key: "conversions", label: "Conversions", color: "#ff536b" },
];

export const facebookMetricOptions = [
  { key: "static_posts", label: "Static Posts" },
  { key: "no_of_reels", label: "Reels" },
  { key: "total_views", label: "Total Views" },
  { key: "views.organic", label: "Views (Organic)" },
  { key: "views.ads", label: "Views (Ads)" },
  { key: "three_second_views.organic", label: "3s Views (Organic)" },
  { key: "three_second_views.ads", label: "3s Views (Ads)" },
  { key: "content_interactions.interactions_total", label: "Engagements" },
  { key: "new_follows", label: "New Follows" },
  { key: "unfollows", label: "Unfollows" },
  { key: "total_followers", label: "Total Followers" },
];

export const instagramMetricOptions = [
  { key: "no_of_posts", label: "Posts" },
  { key: "no_of_reels", label: "Reels" },
  { key: "total_views", label: "Total Views" },
  { key: "views.organic", label: "Views (Organic)" },
  { key: "views.ads", label: "Views (Ads)" },
  { key: "reach.organic", label: "Reach (Organic)" },
  { key: "reach.ads", label: "Reach (Ads)" },
  { key: "content_interactions.total", label: "Interactions" },
  { key: "total_followers", label: "Total Followers" },
];

export const tiktokMetricOptions = [
  { key: "video_count", weeklyKey: "video_count", label: "Videos" },
  { key: "view_count", label: "Views" },
  { key: "like_count", label: "Likes" },
  { key: "comment_count", label: "Comments" },
  { key: "share_count", label: "Shares" },
];

export const defaultReportSettings = {
  title: "Marketing Performance Report",
  subtitle: "Social media and paid advertising performance overview",
  accent: "#003870",
  sections: {
    executive: true,
    paidTrend: true,
    campaigns: false,
    socialTrend: false,
    instagramTable: true,
    instagramGraph: true,
    tiktokTable: true,
    tiktokGraph: true,
    paidOverview: true,
    paidDailyTrend: true,
    paidCampaignTable: true,
    paidConversionFunnel: true,
  },
  paidMetrics: paidMetricOptions.map((metric) => metric.key),
  facebookTableMetrics: facebookMetricOptions.map((metric) => metric.key),
  facebookGraphMetrics: facebookMetricOptions.map((metric) => metric.key),
  instagramTableMetrics: instagramMetricOptions.map((metric) => metric.key),
  instagramGraphMetrics: instagramMetricOptions.map((metric) => metric.key),
  tiktokTableMetrics: tiktokMetricOptions.map((metric) => metric.key),
  tiktokGraphMetrics: tiktokMetricOptions.map((metric) => metric.key),
  paidOverviewMetrics: paidMetricOptions.map((metric) => metric.key),
  paidTrendMetrics: paidMetricOptions.map((metric) => metric.key),
  paidCampaignFields: [
    "name",
    "status",
    "objective",
    "results",
    "spend",
    "reach",
    "impressions",
  ],
  paidFunnelMetrics: [
    "landingPageViews",
    "addToCart",
    "initiateCheckout",
    "purchases",
  ],
};

export function valueAtPath(object, path) {
  return path.split(".").reduce((value, key) => value?.[key], object);
}

export function compactNumber(value) {
  return new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(Number(value || 0));
}

export function formatMetric(value, metric, currency = "USD") {
  if (metric.money)
    return new Intl.NumberFormat("en", {
      style: "currency",
      currency,
      minimumFractionDigits: metric.maximumFractionDigits || 0,
      maximumFractionDigits: metric.maximumFractionDigits ?? 0,
    }).format(Number(value || 0));
  if (metric.percent) return `${Number(value || 0).toFixed(2)}%`;
  if (metric.decimal) return Number(value || 0).toFixed(2);
  return new Intl.NumberFormat("en", { maximumFractionDigits: 0 }).format(
    Number(value || 0),
  );
}

const socialMetricCandidates = {
  facebook: [
    {
      key: "content_interactions.interactions_total",
      label: "Interactions",
      color: "#2563eb",
    },
    { key: "views.organic", label: "Organic Views", color: "#22b982" },
    { key: "views.ads", label: "Paid Views", color: "#8b5cf6" },
  ],
  instagram: [
    {
      key: "content_interactions.total",
      label: "Interactions",
      color: "#8b5cf6",
    },
    { key: "reach.organic", label: "Organic Reach", color: "#22b982" },
    { key: "reach.ads", label: "Paid Reach", color: "#ff536b" },
  ],
  tiktok: [
    { key: "view_count", label: "Views", color: "#111827" },
    { key: "like_count", label: "Likes", color: "#ff536b" },
    { key: "comment_count", label: "Comments", color: "#06b6d4" },
  ],
};

export function getSocialChart(socialData) {
  if (!socialData?.platforms) return null;
  const platformKey = ["facebook", "instagram", "tiktok"].find(
    (key) => socialData.platforms[key]?.available,
  );
  if (!platformKey) return null;
  const platform = socialData.platforms[platformKey];
  const rows = platform.monthly?.length
    ? platform.monthly
    : platform.weekly || [];
  const candidates = socialMetricCandidates[platformKey] || [];
  const metrics = candidates.filter((metric) =>
    rows.some((row) => Number(valueAtPath(row, metric.key) || 0) !== 0),
  );
  return {
    platformKey,
    label: platform.label || platformKey,
    rows,
    metrics: metrics.length ? metrics : candidates.slice(0, 1),
  };
}

export function totalSocialMetric(rows, key) {
  return rows.reduce((sum, row) => sum + Number(valueAtPath(row, key) || 0), 0);
}

export function monthLabel(month) {
  if (!month) return "";
  const [year, value] = month.split("-").map(Number);
  return new Date(year, value - 1, 1).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });
}
