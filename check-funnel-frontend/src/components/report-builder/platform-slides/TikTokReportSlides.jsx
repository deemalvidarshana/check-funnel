import { tiktokMetricOptions } from "../reportData";
import {
  PlatformComparisonSlide,
  PlatformTableSlide,
} from "./PlatformSlideVisuals";

export function TikTokTableSlide({
  socialData,
  settings,
  sourceError,
}) {
  return (
    <PlatformTableSlide
      platform="TikTok"
      color="#111827"
      data={socialData?.platforms?.tiktok}
      options={tiktokMetricOptions}
      selected={settings.tiktokTableMetrics || []}
      sourceError={sourceError}
      periodLabel="Upload date"
      tableMode={settings.tiktokTableMode || "weekly"}
      rowLabel={(row) =>
        row.create_time
          ? new Date(Number(row.create_time) * 1000).toLocaleDateString(
              "en-GB",
              { day: "numeric", month: "short", year: "numeric" },
            )
          : row.week
      }
      rowsTransform={(rows) =>
        [...rows]
          .sort(
            (a, b) => Number(b.create_time || 0) - Number(a.create_time || 0),
          )
          .slice(0, 6)
      }
    />
  );
}
export function TikTokComparisonSlide({
  socialData,
  settings,
  monthWise = false,
  rangeComparison = false,
}) {
  const source = socialData?.platforms?.tiktok;
  const hasActivity = (rows = []) =>
    rows.some((row) =>
      tiktokMetricOptions.some((metric) => Number(row?.[metric.key] || 0) > 0),
    );
  const timestamp = (raw) => {
    if (!raw) return 0;
    const numeric = Number(raw);
    if (Number.isFinite(numeric) && numeric > 0)
      return numeric > 1e12 ? numeric : numeric * 1000;
    const parsed = new Date(raw).getTime();
    return Number.isFinite(parsed) ? parsed : 0;
  };
  const customRanges = socialData?.ranges?.custom;
  const rawVideos = source?.videos || source?.weekly || [];
  const rebuiltComparison = customRanges?.length
    ? [...customRanges].reverse().map((range) => {
        const since = new Date(`${range.since}T00:00:00`).getTime();
        const until = new Date(`${range.until}T23:59:59.999`).getTime();
        const videos = rawVideos.filter((video) => {
          const createdAt = timestamp(video.create_time);
          return createdAt >= since && createdAt <= until;
        });
        return {
          week: range.label,
          since: range.since,
          until: range.until,
          video_count: videos.length,
          view_count: videos.reduce(
            (sum, video) => sum + Number(video.view_count || 0),
            0,
          ),
          like_count: videos.reduce(
            (sum, video) => sum + Number(video.like_count || 0),
            0,
          ),
          comment_count: videos.reduce(
            (sum, video) => sum + Number(video.comment_count || 0),
            0,
          ),
          share_count: videos.reduce(
            (sum, video) => sum + Number(video.share_count || 0),
            0,
          ),
        };
      })
    : [];
  const comparisonRows = hasActivity(source?.comparisonRows)
    ? source.comparisonRows
    : rebuiltComparison;
  if (comparisonRows.length)
    return (
      <PlatformComparisonSlide
        platform="TikTok"
        color={settings.accent || "#111827"}
        data={{ ...source, comparisonRows }}
        options={tiktokMetricOptions}
        selected={settings.tiktokGraphMetrics || []}
        monthWise={monthWise}
        rangeComparison={rangeComparison}
      />
    );
  const monthly = source?.monthly || [];
  const lastActiveIndex = monthly.findLastIndex((row) =>
    tiktokMetricOptions.some((metric) => Number(row?.[metric.key] || 0) > 0),
  );
  const comparisonData =
    lastActiveIndex >= 0
      ? {
          ...source,
          monthly: monthly.slice(
            Math.max(0, lastActiveIndex - 1),
            lastActiveIndex + 1,
          ),
        }
      : { ...source, monthly: [] };
  return (
    <PlatformComparisonSlide
      platform="TikTok"
      color={settings.accent || "#111827"}
      data={comparisonData}
      options={tiktokMetricOptions}
      selected={settings.tiktokGraphMetrics || []}
      monthWise={monthWise}
      rangeComparison={rangeComparison}
    />
  );
}
