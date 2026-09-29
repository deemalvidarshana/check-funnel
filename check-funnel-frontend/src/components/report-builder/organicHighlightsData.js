const metricDefinitions = {
  facebook: [
    ["static_posts", "Static posts"],
    ["no_of_reels", "Reels"],
    ["total_views", "Total views"],
    ["views.organic", "Organic views"],
    ["content_interactions.interactions_total", "Engagements"],
    ["new_follows", "New follows"],
  ],
  instagram: [
    ["no_of_posts", "Posts"],
    ["no_of_reels", "Reels"],
    ["total_views", "Total views"],
    ["views.organic", "Organic views"],
    ["reach.organic", "Organic reach"],
    ["content_interactions.total", "Interactions"],
  ],
  tiktok: [
    ["video_count", "Videos"],
    ["view_count", "Views"],
    ["like_count", "Likes"],
    ["comment_count", "Comments"],
    ["share_count", "Shares"],
  ],
};

function metricValue(row, path) {
  const value = path.split(".").reduce((part, key) => part?.[key], row);
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

export function buildOrganicHighlightsInput({ client, socialData, comparisonMode, month, instruction }) {
  const platforms = Object.entries(metricDefinitions).flatMap(([key, definitions]) => {
    const source = socialData?.platforms?.[key];
    if (!source?.available) return [];
    const sourceRows = Array.isArray(source.comparisonRows)
      ? source.comparisonRows
      : (source.monthly || []).filter((row) => row.since?.startsWith(month));
    const periods = sourceRows.filter((row) => !row.error).slice(-10).map((row) => ({
      label: String(row.week || "Period").slice(0, 80),
      since: row.since,
      until: row.until,
      metrics: definitions.flatMap(([path, label]) => {
        const value = metricValue(row, path);
        return value === null ? [] : [{ label, value }];
      }),
    })).filter((row) => row.metrics.length);
    return periods.length ? [{ platform: key, periods }] : [];
  });

  return {
    clientName: String(client?.name || "Selected client").slice(0, 100),
    clientContext: String(client?.shortDescription || "").slice(0, 240),
    reportingMonth: month,
    comparisonMode,
    instruction: String(instruction || "").trim().slice(0, 600),
    platforms,
  };
}
