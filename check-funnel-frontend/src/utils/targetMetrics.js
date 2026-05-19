export const TARGET_GROWTH_RATE = 0.4;
export const TARGET_MULTIPLIER = 1 + TARGET_GROWTH_RATE;
export const TARGET_MONTH_COUNT = 6;

export const PLATFORM_LABELS = {
  facebook: "Facebook",
  instagram: "Instagram",
  tiktok: "TikTok",
};

const METRIC_CONFIGS = {
  facebook: [
    {
      key: "organicViews",
      label: "Organic Views",
      shortLabel: "Views",
      minimumTarget: 1000,
      getValue: (row) => row.views?.organic,
    },
    {
      key: "engagements",
      label: "Engagements",
      shortLabel: "Eng.",
      minimumTarget: 100,
      getValue: (row) => row.content_interactions?.interactions_total,
    },
    {
      key: "followerGain",
      label: "Follower Gain",
      shortLabel: "Follows",
      minimumTarget: 20,
      getValue: (row) => row.new_follows,
    },
  ],
  instagram: [
    {
      key: "organicViews",
      label: "Organic Views",
      shortLabel: "Views",
      minimumTarget: 1000,
      getValue: (row) => row.views?.organic,
    },
    {
      key: "contentInteractions",
      label: "Content Interactions",
      shortLabel: "Interactions",
      minimumTarget: 100,
      getValue: (row) => row.content_interactions?.total,
    },
  ],
  tiktok: [
    {
      key: "videoViews",
      label: "Video Views",
      shortLabel: "Views",
      minimumTarget: 1000,
      getValue: (row) => row.videoViews,
    },
    {
      key: "videoEngagements",
      label: "Video Engagements",
      shortLabel: "Eng.",
      minimumTarget: 100,
      getValue: (row) => row.videoEngagements,
    },
  ],
};

export function getMetricConfigs(platform) {
  return METRIC_CONFIGS[platform] || [];
}

export function normalizeActiveChannels(client) {
  if (Array.isArray(client?.activeChannels)) return client.activeChannels;
  if (typeof client?.activeChannels === "string") {
    try {
      const parsed = JSON.parse(client.activeChannels);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      return client.activeChannels.split(",").map((item) => item.trim()).filter(Boolean);
    }
  }
  return [];
}

export function hasPlatformCredentials(client, platform) {
  if (!client) return false;

  if (platform === "facebook") {
    return Boolean(client.facebookPageId && client.facebookApiKey);
  }

  if (platform === "instagram") {
    return Boolean(client.instagramAccountId && client.instagramApiKey);
  }

  if (platform === "tiktok") {
    return Boolean(client.tiktokApiKey && client.tiktokClientKey && client.tiktokClientSecret);
  }

  return false;
}

export function isClientActiveForPlatform(client, platform) {
  return normalizeActiveChannels(client).includes(platform) || hasPlatformCredentials(client, platform);
}

export function formatLocalDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatMonthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function formatMonthLabel(date) {
  return date.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
}

export function generateMonthlyRanges(referenceDate = new Date(), monthCount = TARGET_MONTH_COUNT) {
  const currentMonthKey = formatMonthKey(referenceDate);
  const ranges = [];

  for (let i = 0; i < monthCount; i += 1) {
    const sinceDate = new Date(referenceDate.getFullYear(), referenceDate.getMonth() - i, 1);
    const untilDate = i === 0
      ? new Date(referenceDate)
      : new Date(referenceDate.getFullYear(), referenceDate.getMonth() - i + 1, 0);

    const monthKey = formatMonthKey(sinceDate);
    ranges.push({
      monthKey,
      monthLabel: formatMonthLabel(sinceDate),
      label: `${sinceDate.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} - ${untilDate.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`,
      since: formatLocalDate(sinceDate),
      until: formatLocalDate(untilDate),
      isCurrentMonth: monthKey === currentMonthKey,
    });
  }

  return ranges.reverse();
}

export function attachRangeMetadata(row, range) {
  return {
    ...row,
    monthKey: range.monthKey,
    monthLabel: range.monthLabel,
    label: range.label,
    since: row?.since || range.since,
    until: row?.until || range.until,
    isCurrentMonth: range.isCurrentMonth,
  };
}

export function buildTiktokMonthlyData(videos = [], referenceDate = new Date()) {
  const ranges = generateMonthlyRanges(referenceDate);

  return ranges.map((range) => {
    const totals = videos.reduce((acc, video) => {
      if (!video.create_time) return acc;
      const videoDate = new Date(video.create_time * 1000);
      if (formatMonthKey(videoDate) !== range.monthKey) return acc;

      const videoEngagements = (Number(video.like_count) || 0)
        + (Number(video.comment_count) || 0)
        + (Number(video.share_count) || 0);

      return {
        videoViews: acc.videoViews + (Number(video.view_count) || 0),
        videoEngagements: acc.videoEngagements + videoEngagements,
        videoCount: acc.videoCount + 1,
      };
    }, { videoViews: 0, videoEngagements: 0, videoCount: 0 });

    return attachRangeMetadata(totals, range);
  });
}

function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function average(values) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function calculateTarget(averageValue, metric) {
  const growthTarget = Math.ceil(averageValue * TARGET_MULTIPLIER);
  const minimumTarget = metric.minimumTarget || 0;
  const target = Math.max(growthTarget, minimumTarget);

  return {
    target,
    growthTarget,
    ruleApplied: target > growthTarget ? "minimum" : "growth",
  };
}

export function buildTargetSummary({ client, platform, monthlyData = [], generatedAt = new Date() }) {
  const metrics = getMetricConfigs(platform);
  const completedMonths = monthlyData.filter((row) => !row.isCurrentMonth && !row.error);
  const currentMonth = monthlyData.find((row) => row.isCurrentMonth);

  if (!completedMonths.length) {
    return {
      clientId: client.id,
      clientName: client.name,
      platform,
      generatedAt: generatedAt.toISOString(),
      status: "no_data",
      message: "No completed monthly data found for target calculation.",
      completedMonthCount: 0,
      currentMonthLabel: currentMonth?.monthLabel || formatMonthLabel(generatedAt),
      metricTargets: metrics.map((metric) => ({
        key: metric.key,
        label: metric.label,
        average: 0,
        target: 0,
        currentMonth: 0,
        ruleApplied: "none",
      })),
    };
  }

  const metricTargets = metrics.map((metric) => {
    const values = completedMonths.map((row) => toNumber(metric.getValue(row)));
    const averageValue = average(values);
    const targetResult = calculateTarget(averageValue, metric);
    const currentValue = currentMonth ? toNumber(metric.getValue(currentMonth)) : 0;

    return {
      key: metric.key,
      label: metric.label,
      shortLabel: metric.shortLabel,
      average: averageValue,
      target: targetResult.target,
      growthTarget: targetResult.growthTarget,
      currentMonth: currentValue,
      progress: targetResult.target > 0 ? currentValue / targetResult.target : 0,
      ruleApplied: targetResult.ruleApplied,
      minimumTarget: metric.minimumTarget || 0,
    };
  });

  return {
    clientId: client.id,
    clientName: client.name,
    platform,
    generatedAt: generatedAt.toISOString(),
    status: "ready",
    completedMonthCount: completedMonths.length,
    completedMonthLabels: completedMonths.map((row) => row.monthLabel),
    currentMonthLabel: currentMonth?.monthLabel || formatMonthLabel(generatedAt),
    metricTargets,
  };
}

export function formatNumber(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "N/A";
  return Math.round(Number(value)).toLocaleString();
}

export function formatPercent(value) {
  if (!Number.isFinite(value)) return "0%";
  return `${Math.round(value * 100)}%`;
}
