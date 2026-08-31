import { instagramMetricOptions } from "../reportData";
import {
  PlatformComparisonSlide,
  PlatformTableSlide,
} from "./PlatformSlideVisuals";

export function InstagramTableSlide({ socialData, settings, sourceError }) {
  return (
    <PlatformTableSlide
      platform="Instagram"
      color="#c13584"
      data={socialData?.platforms?.instagram}
      options={instagramMetricOptions}
      selected={settings.instagramTableMetrics || []}
      sourceError={sourceError}
      periodLabel="Week period"
    />
  );
}
export function InstagramComparisonSlide({ socialData, settings }) {
  return (
    <PlatformComparisonSlide
      platform="Instagram"
      color={settings.accent || "#c13584"}
      data={socialData?.platforms?.instagram}
      options={instagramMetricOptions}
      selected={settings.instagramGraphMetrics || []}
    />
  );
}
