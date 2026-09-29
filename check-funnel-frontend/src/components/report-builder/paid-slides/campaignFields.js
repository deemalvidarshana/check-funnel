export const campaignFields = [
  ["name", "Campaign Name", "text"],
  ["status", "Delivery", "status"],
  ["objective", "Objective", "text"],
  ["results", "Results", "number"],
  ["resultType", "Result Type", "text"],
  ["costPerResult", "Cost / Result", "money"],
  ["budget", "Budget", "money"],
  ["budgetType", "Budget Type", "text"],
  ["spend", "Amount Spent", "money"],
  ["reach", "Reach", "number"],
  ["impressions", "Impressions", "number"],
  ["frequency", "Frequency", "decimal"],
  ["cpm", "CPM", "money"],
  ["cpp", "Cost / 1K Reached", "money"],
  ["clicks", "Clicks", "number"],
  ["uniqueClicks", "Unique Clicks", "number"],
  ["linkClicks", "Link Clicks", "number"],
  ["ctr", "CTR", "percent"],
  ["linkCtr", "Link CTR", "percent"],
  ["cpc", "CPC", "money"],
  ["costPerLinkClick", "Cost / Link Click", "money"],
  ["landingPageViews", "Landing Page Views", "number"],
  ["costPerLandingPageView", "Cost / LPV", "money"],
  ["contentViews", "Content Views", "number"],
  ["addToCart", "Adds to Cart", "number"],
  ["initiateCheckout", "Checkouts", "number"],
  ["purchases", "Purchases", "number"],
  ["purchaseValue", "Purchase Value", "money"],
  ["purchaseRoas", "Purchase ROAS", "decimal"],
  ["leads", "Leads", "number"],
  ["costPerLead", "Cost / Lead", "money"],
  ["messagingConversations", "Messaging Conversations", "number"],
  ["costPerMessagingConversation", "Cost / Messaging Conversation", "money"],
  ["postEngagements", "Post Engagements", "number"],
  ["pageEngagements", "Page Engagements", "number"],
  ["videoViews", "Video Views", "number"],
  ["reactions", "Reactions", "number"],
  ["comments", "Comments", "number"],
  ["saves", "Saves", "number"],
  ["searches", "Searches", "number"],
  ["addPaymentInfo", "Payment Info Added", "number"],
  ["registrations", "Registrations", "number"],
  ["conversions", "Conversions", "number"],
  ["cpa", "CPA", "money"],
].map(([key, label, type]) => ({ key, label, type }));
export const summableCampaignFields = new Set([
  "results",
  "budget",
  "spend",
  "reach",
  "impressions",
  "clicks",
  "uniqueClicks",
  "linkClicks",
  "landingPageViews",
  "contentViews",
  "addToCart",
  "initiateCheckout",
  "purchases",
  "purchaseValue",
  "leads",
  "messagingConversations",
  "postEngagements",
  "pageEngagements",
  "videoViews",
  "reactions",
  "comments",
  "saves",
  "searches",
  "addPaymentInfo",
  "registrations",
  "conversions",
]);

export const campaignObjectiveKey = (campaign) =>
  String(campaign?.objective || "Other");

export const formatCampaignObjective = (objective) =>
  String(objective || "Other")
    .replace(/^OUTCOME_/, "")
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

export function defaultCampaignFieldsForObjective(objective) {
  const normalized = String(objective || "").toUpperCase();
  if (normalized.includes("SALE"))
    return ["name", "objective", "results", "spend", "purchases", "purchaseValue", "purchaseRoas"];
  if (normalized.includes("ENGAGEMENT"))
    return ["name", "objective", "results", "spend", "postEngagements", "reach", "impressions"];
  if (normalized.includes("LEAD"))
    return ["name", "objective", "results", "spend", "leads", "costPerLead", "reach"];
  if (normalized.includes("MESSAGE"))
    return ["name", "objective", "results", "spend", "messagingConversations", "costPerMessagingConversation", "reach"];
  if (normalized.includes("TRAFFIC") || normalized.includes("LINK CLICK"))
    return ["name", "objective", "results", "spend", "linkClicks", "costPerLinkClick", "landingPageViews"];
  if (normalized.includes("AWARENESS"))
    return ["name", "objective", "results", "spend", "reach", "impressions", "frequency"];
  return ["name", "objective", "results", "spend", "reach", "impressions"];
}

export function sortedCampaignRows(campaigns = []) {
  const rows = campaigns.filter((campaign) => Number(campaign.spend || 0) > 0);
  const objectiveSpend = rows.reduce((totals, campaign) => {
    const objective = campaignObjectiveKey(campaign);
    totals[objective] =
      (totals[objective] || 0) + Number(campaign.spend || 0);
    return totals;
  }, {});
  return rows.slice().sort((a, b) => {
    const objectiveA = campaignObjectiveKey(a);
    const objectiveB = campaignObjectiveKey(b);
    return (
      objectiveSpend[objectiveB] - objectiveSpend[objectiveA] ||
      objectiveA.localeCompare(objectiveB) ||
      Number(b.spend || 0) - Number(a.spend || 0)
    );
  });
}

export function campaignRowsWithObjectiveTotals(
  campaigns = [],
  showObjectiveTotals = true,
  objectiveTotalsOnly = false,
) {
  const sorted = sortedCampaignRows(campaigns);
  if (!showObjectiveTotals) return sorted;
  const groups = new Map();
  sorted.forEach((campaign) => {
    const objective = campaignObjectiveKey(campaign);
    if (!groups.has(objective)) groups.set(objective, []);
    groups.get(objective).push(campaign);
  });
  return [...groups.entries()].flatMap(([objective, rows]) => {
    const totalRow = {
      id: `objective-total-${objective}`,
      __objectiveTotal: true,
      __groupRows: rows,
      objective,
      name: `${objective} total`,
    };
    return objectiveTotalsOnly ? [totalRow] : [...rows, totalRow];
  });
}

export function campaignObjectiveGroups(campaigns = []) {
  const groups = new Map();
  sortedCampaignRows(campaigns).forEach((campaign) => {
    const objective = campaignObjectiveKey(campaign);
    if (!groups.has(objective)) groups.set(objective, []);
    groups.get(objective).push(campaign);
  });
  return [...groups.entries()].map(([objective, rows]) => ({ objective, rows }));
}

export function buildCampaignObjectivePages(campaigns = [], settings = {}) {
  const groups = campaignObjectiveGroups(campaigns);
  if (!groups.length)
    return [{
      objective: null,
      rows: [],
      allRows: [],
      fieldKeys: settings.paidCampaignFields || [],
      pageIndex: 0,
      pageCount: 1,
    }];

  return groups.flatMap(({ objective, rows }) => {
    const totalRow = {
      id: `objective-total-${objective}`,
      __objectiveTotal: true,
      __groupRows: rows,
      objective,
      name: `${formatCampaignObjective(objective)} total`,
    };
    const displayRows = settings.paidCampaignObjectiveTotalsOnly
      ? [totalRow]
      : settings.paidCampaignObjectiveTotals === false
        ? rows
        : [...rows, totalRow];
    const pageCount = Math.max(1, Math.ceil(displayRows.length / 6));
    const fieldKeys =
      settings.paidCampaignObjectiveFields?.[objective] ||
      defaultCampaignFieldsForObjective(objective);
    return Array.from({ length: pageCount }, (_, pageIndex) => ({
      objective,
      rows: displayRows.slice(pageIndex * 6, pageIndex * 6 + 6),
      allRows: rows,
      fieldKeys,
      pageIndex,
      pageCount,
    }));
  });
}

const metricColors = ["#2563eb", "#06b6d4", "#8b5cf6", "#22b982", "#ff536b"];
const preciseMoneyKeys = new Set([
  "costPerResult",
  "cpm",
  "cpp",
  "cpc",
  "costPerLinkClick",
  "costPerLandingPageView",
  "costPerLead",
  "costPerMessagingConversation",
  "cpa",
]);
const paidAnalyticsKeys = new Set([
  "spend",
  "reach",
  "impressions",
  "frequency",
  "clicks",
  "uniqueClicks",
  "linkClicks",
  "ctr",
  "linkCtr",
  "cpc",
  "cpm",
  "cpp",
  "costPerLinkClick",
  "landingPageViews",
  "costPerLandingPageView",
  "contentViews",
  "addToCart",
  "initiateCheckout",
  "purchases",
  "purchaseValue",
  "purchaseRoas",
  "leads",
  "costPerLead",
  "messagingConversations",
  "costPerMessagingConversation",
  "postEngagements",
  "pageEngagements",
  "videoViews",
  "reactions",
  "comments",
  "saves",
  "searches",
  "addPaymentInfo",
  "registrations",
  "results",
  "costPerResult",
  "conversions",
  "cpa",
]);
export const paidAnalyticsMetricOptions = campaignFields
  .filter((field) => paidAnalyticsKeys.has(field.key))
  .map((field, index) => ({
    ...field,
    color: metricColors[index % metricColors.length],
    money: field.type === "money",
    maximumFractionDigits: preciseMoneyKeys.has(field.key) ? 2 : 0,
    percent: field.type === "percent",
    decimal: field.type === "decimal",
  }));
