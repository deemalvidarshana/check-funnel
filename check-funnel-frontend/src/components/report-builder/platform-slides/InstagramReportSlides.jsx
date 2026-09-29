import { instagramMetricOptions } from "../reportData";
import {
  PlatformComparisonSlide,
  PlatformTableSlide,
} from "./PlatformSlideVisuals";

export function InstagramTableSlide({
  socialData,
  settings,
  sourceError,
}) {
  return (
    <PlatformTableSlide
      platform="Instagram"
      color="#c13584"
      data={socialData?.platforms?.instagram}
      options={instagramMetricOptions}
      selected={settings.instagramTableMetrics || []}
      sourceError={sourceError}
      periodLabel="Week period"
      tableMode={settings.instagramTableMode || "weekly"}
    />
  );
}
export function InstagramComparisonSlide({
  socialData,
  settings,
  monthWise = false,
  rangeComparison = false,
}) {
  return (
    <PlatformComparisonSlide
      platform="Instagram"
      color={settings.accent || "#c13584"}
      data={socialData?.platforms?.instagram}
      options={instagramMetricOptions}
      selected={settings.instagramGraphMetrics || []}
      monthWise={monthWise}
      rangeComparison={rangeComparison}
    />
  );
}
