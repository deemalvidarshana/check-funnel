import { useState, useEffect, useMemo, useRef } from "react";
import { useParams } from "react-router-dom";
import MetricTabs from "../../components/insights/MetricTabs";
import PlatformSelector from "../../components/insights/PlatformSelector";
import ContentVelocityChart from "../../components/insights/ContentVelocityChart";
import ContentBreakdownTable from "../../components/insights/ContentBreakdownTable";
import DateRangeSelector from "../../components/insights/DateRangeSelector";
import OverviewMetricsCard from "../../components/insights/OverviewMetricsCard";
import {
  getPublicClientInfo,
  getPublicFacebookInsights,
  getPublicInstagramInsights,
  getPublicInstagramRangeInsights,
  getPublicTiktokInsights,
} from "../../api/publicInsights";
import { buildMonthComparisonRanges } from "../../utils/monthComparisonChart";

const FACEBOOK_INSIGHTS_PAGE_SIZE = 6;
const MONTH_COMPARISON_RANGE = "month_compare";
const TIKTOK_DATE_RANGES = [
  { label: "Last 6 Videos", value: "7" },
  { label: "Last 6 Months", value: "30" },
];

function getTiktokSixMonthStart() {
  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth() - 5, 1);
}

function isWithinTiktokSixMonthWindow(video) {
  if (!video?.create_time) return false;
  return new Date(video.create_time * 1000) >= getTiktokSixMonthStart();
}

function buildTiktokMonthlyChartData(videos = []) {
  const today = new Date();
  const buckets = [];
  const bucketMap = new Map();

  for (let i = 5; i >= 0; i -= 1) {
    const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const bucket = {
      id: key,
      week: date.toLocaleDateString("en-GB", { month: "short", year: "numeric" }),
      create_time: Math.floor(date.getTime() / 1000),
      view_count: 0,
      like_count: 0,
      comment_count: 0,
      share_count: 0,
      video_count: 0,
    };

    buckets.push(bucket);
    bucketMap.set(key, bucket);
  }

  videos.forEach((video) => {
    if (!isWithinTiktokSixMonthWindow(video)) return;

    const createdAt = new Date(video.create_time * 1000);
    const key = `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, "0")}`;
    const bucket = bucketMap.get(key);

    if (!bucket) return;

    bucket.view_count += video.view_count || 0;
    bucket.like_count += video.like_count || 0;
    bucket.comment_count += video.comment_count || 0;
    bucket.share_count += video.share_count || 0;
    bucket.video_count += 1;
  });

  return buckets;
}

export default function PublicReport() {
  const { shareToken } = useParams();

  const [activeTab, setActiveTab] = useState("Content Counts");
  const [activePlatform, setActivePlatform] = useState("facebook");
  const [timeRange, setTimeRange] = useState("7");
  const [tableTimeRange, setTableTimeRange] = useState("7");
  const [client, setClient] = useState(null);
  const [insightData, setInsightData] = useState([]);
  const [monthComparisonChart, setMonthComparisonChart] = useState(null);
  const [isChartRefreshing, setIsChartRefreshing] = useState(false);
  const [platformStats, setPlatformStats] = useState({});
  const [loading, setLoading] = useState(true);

  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsPage, setInsightsPage] = useState(1);
  const [tiktokTablePage, setTiktokTablePage] = useState(1);
  const [error, setError] = useState(null);
  const insightsRequestId = useRef(0);

  useEffect(() => {
    const fetchInfo = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getPublicClientInfo(shareToken);
        const channels = Array.isArray(data.activeChannels)
          ? [...data.activeChannels]
          : (data.activeChannels || "").split(",").filter(Boolean).map((s) => s.trim());

        const normalizedData = { ...data, activeChannels: channels };
        setClient(normalizedData);

        if (channels.length > 0) {
          setActivePlatform(channels[0]);
        }
      } catch (err) {
        setError("This report is no longer available or the link is invalid.");
      } finally {
        setLoading(false);
      }
    };

    fetchInfo();
  }, [shareToken]);

  const generateWeeks = (page = 1, pageSize = FACEBOOK_INSIGHTS_PAGE_SIZE) => {
    const weeks = [];
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const currentMonday = new Date(today);
    currentMonday.setDate(today.getDate() - diffToMonday);

    const formatDate = (date) => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, "0");
      const d = String(date.getDate()).padStart(2, "0");
      return `${y}-${m}-${d}`;
    };

    const startIndex = (page - 1) * pageSize;

    for (let rangeIndex = startIndex; rangeIndex < startIndex + pageSize; rangeIndex += 1) {
      if (rangeIndex === 0) {
        const currentWeekSince = new Date(currentMonday);
        const currentWeekUntil = new Date(today);
        weeks.push({
          label: `${currentWeekSince.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} - ${currentWeekUntil.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`,
          since: formatDate(currentWeekSince),
          until: formatDate(currentWeekUntil),
        });
      } else {
        const untilDate = new Date(currentMonday);
        untilDate.setDate(currentMonday.getDate() - ((rangeIndex - 1) * 7) - 1);

        const sinceDate = new Date(untilDate);
        sinceDate.setDate(untilDate.getDate() - 6);

        weeks.push({
          label: `${sinceDate.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} - ${untilDate.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`,
          since: formatDate(sinceDate),
          until: formatDate(untilDate),
        });
      }
    }

    return weeks.reverse();
  };

  const generateMonths = (page = 1, pageSize = FACEBOOK_INSIGHTS_PAGE_SIZE) => {
    const months = [];
    const today = new Date();

    const formatDate = (date) => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, "0");
      const d = String(date.getDate()).padStart(2, "0");
      return `${y}-${m}-${d}`;
    };

    const startIndex = (page - 1) * pageSize;

    for (let i = startIndex; i < startIndex + pageSize; i += 1) {
      const sinceDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const untilDate = i === 0
        ? new Date(today)
        : new Date(today.getFullYear(), today.getMonth() - i + 1, 0);
      const label = `${sinceDate.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} - ${untilDate.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`;

      months.push({ label, since: formatDate(sinceDate), until: formatDate(untilDate) });
    }

    return months.reverse();
  };

  const formatLocalDate = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const getMonday = (date) => {
    const monday = new Date(date);
    const dayOfWeek = monday.getDay();
    const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    monday.setDate(monday.getDate() - diffToMonday);
    return monday;
  };

  const getInstagramUntilForPage = (page, range) => {
    if (page <= 1) return undefined;

    let endDate = new Date();
    for (let currentPage = 1; currentPage < page; currentPage += 1) {
      if (range === "30") {
        const oldestMonthStart = new Date(endDate.getFullYear(), endDate.getMonth() - 5, 1);
        endDate = new Date(oldestMonthStart);
        endDate.setDate(oldestMonthStart.getDate() - 1);
      } else {
        const currentMonday = getMonday(endDate);
        endDate = new Date(currentMonday);
        endDate.setDate(currentMonday.getDate() - 43);
      }
    }

    return formatLocalDate(endDate);
  };

  useEffect(() => {
    setInsightsPage(1);
    setTiktokTablePage(1);
  }, [shareToken, activePlatform, timeRange]);

  useEffect(() => {
    if (!["facebook", "instagram"].includes(activePlatform) && timeRange === MONTH_COMPARISON_RANGE) {
      setTimeRange("7");
      setTableTimeRange("7");
    }
  }, [activePlatform, timeRange]);

  useEffect(() => {
    const requestId = insightsRequestId.current + 1;
    insightsRequestId.current = requestId;
    const isCurrentRequest = () => insightsRequestId.current === requestId;

    const fetchAllData = async () => {
      if (!client) return;
      if (!["facebook", "instagram"].includes(activePlatform) && timeRange === MONTH_COMPARISON_RANGE) return;

      const channels = Array.isArray(client.activeChannels)
        ? client.activeChannels
        : (client.activeChannels || "").split(",").filter(Boolean).map((s) => s.trim());

      if (!channels.includes(activePlatform)) {
        setInsightData([]);
        setMonthComparisonChart(null);
        setInsightsLoading(false);
        setIsChartRefreshing(false);
        return;
      }

      const isComparisonRange =
        ["facebook", "instagram"].includes(activePlatform) &&
        timeRange === MONTH_COMPARISON_RANGE;

      if (["facebook", "instagram"].includes(activePlatform)) {
        setIsChartRefreshing(true);
      }

      if (!isComparisonRange) {
        setInsightData([]);
        setMonthComparisonChart(null);
      } else {
        setMonthComparisonChart(null);
      }

      setInsightsLoading(!isComparisonRange);

      try {
        if (activePlatform === "facebook") {
          if (isComparisonRange) {
            const comparisonRanges = buildMonthComparisonRanges();
            const [currentRows, previousRows] = await Promise.all([
              Promise.all(
                comparisonRanges.currentRanges.map((w) =>
                  getPublicFacebookInsights(shareToken, w.since, w.until)
                    .then((res) => ({ ...res, week: w.label }))
                    .catch(() => ({ week: w.label, error: true }))
                )
              ),
              Promise.all(
                comparisonRanges.previousRanges.map((w) =>
                  getPublicFacebookInsights(shareToken, w.since, w.until)
                    .then((res) => ({ ...res, week: w.label }))
                    .catch(() => ({ week: w.label, error: true }))
                )
              ),
            ]);

            if (!isCurrentRequest()) return;
            setMonthComparisonChart({
              currentData: currentRows,
              previousData: previousRows,
              currentLabel: comparisonRanges.currentLabel,
              previousLabel: comparisonRanges.previousLabel,
              subtitle: `${comparisonRanges.currentLabel} vs ${comparisonRanges.previousLabel} Weekly Trend`,
            });
            return;
          }

          const ranges = timeRange === "30" ? generateMonths(insightsPage) : generateWeeks(insightsPage);
          const results = await Promise.all(
            ranges.map((w) =>
              getPublicFacebookInsights(shareToken, w.since, w.until)
                .then((res) => ({ ...res, week: w.label }))
                .catch(() => ({ week: w.label, error: true }))
            )
          );

          if (!isCurrentRequest()) return;
          setInsightData(results);
        } else if (activePlatform === "instagram") {
          if (isComparisonRange) {
            const comparisonRanges = buildMonthComparisonRanges();
            const [currentResult, previousResult] = await Promise.all([
              getPublicInstagramRangeInsights(shareToken, comparisonRanges.currentRanges),
              getPublicInstagramRangeInsights(shareToken, comparisonRanges.previousRanges),
            ]);

            if (!isCurrentRequest()) return;
            setMonthComparisonChart({
              currentData: currentResult.weeks || [],
              previousData: previousResult.weeks || [],
              currentLabel: comparisonRanges.currentLabel,
              previousLabel: comparisonRanges.previousLabel,
              subtitle: `${comparisonRanges.currentLabel} vs ${comparisonRanges.previousLabel} Weekly Trend`,
            });
            return;
          }

          const until = getInstagramUntilForPage(insightsPage, timeRange);
          const result = await getPublicInstagramInsights(shareToken, timeRange, until);

          if (!isCurrentRequest()) return;
          setInsightData(result.weeks || []);
        } else if (activePlatform === "tiktok") {
          const result = await getPublicTiktokInsights(shareToken);

          if (!isCurrentRequest()) return;
          setInsightData(result.videos || []);
          if (result.user) {
            setPlatformStats((prev) => ({ ...prev, tiktok: result.user }));
          }
        } else {
          setInsightData([]);
        }
      } catch (err) {
        console.error("Failed to load public insights", err);
        if (!isCurrentRequest()) return;
        setInsightData([]);
        setMonthComparisonChart(null);
      } finally {
        if (isCurrentRequest()) {
          setInsightsLoading(false);
          setIsChartRefreshing(false);
        }
      }
    };

    if (client && !loading) fetchAllData();

    return () => {
      if (isCurrentRequest()) {
        insightsRequestId.current += 1;
      }
    };
  }, [client, activePlatform, timeRange, shareToken, loading, insightsPage]);

  const chartData = useMemo(() => {
    if (activePlatform === "tiktok") {
      if (timeRange === "30") {
        return buildTiktokMonthlyChartData(insightData);
      }

      const startIndex = (tiktokTablePage - 1) * FACEBOOK_INSIGHTS_PAGE_SIZE;
      const sorted = [...(insightData || [])].sort((a, b) => (b.create_time || 0) - (a.create_time || 0));
      const visiblePageRows = sorted.slice(startIndex, startIndex + FACEBOOK_INSIGHTS_PAGE_SIZE).reverse();

      return visiblePageRows.map((v) => ({
        ...v,
        week: v.create_time
          ? new Date(v.create_time * 1000).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })
          : "",
      }));
    }

    return insightData;
  }, [insightData, activePlatform, tiktokTablePage, timeRange]);

  const tableData = useMemo(() => {
    if (activePlatform !== "tiktok") return insightData;

    if (timeRange === "30") {
      return buildTiktokMonthlyChartData(insightData);
    }

    const startIndex = (tiktokTablePage - 1) * FACEBOOK_INSIGHTS_PAGE_SIZE;

    return [...(insightData || [])]
      .sort((a, b) => (b.create_time || 0) - (a.create_time || 0))
      .slice(startIndex, startIndex + FACEBOOK_INSIGHTS_PAGE_SIZE);
  }, [activePlatform, insightData, tiktokTablePage, timeRange]);

  const tiktokTotalRows = useMemo(() => {
    if (activePlatform !== "tiktok") return 0;
    if (timeRange === "30") return 6;
    return insightData?.length || 0;
  }, [activePlatform, insightData, timeRange]);

  const tiktokPagination = activePlatform === "tiktok" ? {
    page: tiktokTablePage,
    canPrev: tiktokTablePage > 1,
    canNext: tiktokTablePage * FACEBOOK_INSIGHTS_PAGE_SIZE < tiktokTotalRows,
    isLoading: insightsLoading,
    onPrev: () => setTiktokTablePage((page) => Math.max(1, page - 1)),
    onNext: () => setTiktokTablePage((page) => (
      page * FACEBOOK_INSIGHTS_PAGE_SIZE < tiktokTotalRows ? page + 1 : page
    )),
  } : null;

  useEffect(() => {
    if (
      (activePlatform === "facebook" || activePlatform === "instagram") &&
      (activeTab === "Video Breakdown" || activeTab === "Video Likes" || activeTab === "Account Overview")
    ) {
      setActiveTab("Content Counts");
    } else if (activePlatform === "instagram" && activeTab === "Viewer Retention") {
      setActiveTab("Audience Reach");
    } else if (activePlatform === "facebook" && activeTab === "Audience Reach") {
      setActiveTab("Viewer Retention");
    } else if (activePlatform === "tiktok") {
      if (!["Video Breakdown", "Video Likes"].includes(activeTab)) {
        setActiveTab("Video Breakdown");
      }
    }
  }, [activePlatform, activeTab]);

  const chartConfigs = useMemo(() => {
    const isIG = activePlatform === "instagram";
    const tiktokPeriodLabel = timeRange === "30" ? "Last 6 Months" : "Last 6 Videos";

    return {
      "Content Counts": {
        title: "Content Velocity",
        subtitle: "7 Weeks Content Volume Trend",
        metrics: [
          { key: isIG ? "no_of_posts" : "static_posts", label: "Posts", color: "#003870" },
          { key: "no_of_reels", label: "Reels", color: "#863802" },
          { key: "no_of_stories", label: "Stories", color: "#4553c1" },
        ],
      },
      "Total Views": {
        title: "Total Video Views",
        subtitle: "Comparison of Organic vs Ads Views",
        metrics: [
          { key: "views.organic", label: "Views (Org.)", color: "#003870" },
          { key: "views.ads", label: "Views (Ads)", color: "#10b981" },
        ],
      },
      "Viewer Retention": {
        title: "3s Viewer Retention",
        subtitle: "Detailed 3-second views breakdown",
        metrics: [
          { key: "three_second_views.organic", label: "3s Views (Org.)", color: "#003870" },
          { key: "three_second_views.ads", label: "3s Views (Ads)", color: "#f59e0b" },
        ],
      },
      "Audience Reach": {
        title: "Audience Reach",
        subtitle: "Comparison of Organic vs Ads Reach",
        metrics: [
          { key: "reach.organic", label: "Reach (Org.)", color: "#003870" },
          { key: "reach.ads", label: "Reach (Ads)", color: "#93000a" },
        ],
      },
      "Engagement Metrics": {
        title: "Engagement Overview",
        subtitle: "Total interactions across all content",
        metrics: [
          {
            key: isIG ? "content_interactions.total" : "content_interactions.interactions_total",
            label: isIG ? "Interactions" : "Engagements",
            color: "#003870",
          },
        ],
      },
      "Audience Growth": {
        title: "Audience Pulse",
        subtitle: "New follows and unfollows trend",
        metrics: [
          { key: "new_follows", label: "New Follows", color: "#003870" },
          { key: "unfollows", label: "Unfollows", color: "#93000a" },
        ],
      },
      "Video Breakdown": {
        title: "Views Breakdown",
        subtitle: `Performance of ${tiktokPeriodLabel}`,
        metrics: [
          { key: "view_count", label: "Views", color: "#003870" },
        ],
      },
      "Video Likes": {
        title: "Likes Breakdown",
        subtitle: `Performance of ${tiktokPeriodLabel}`,
        metrics: [
          { key: "like_count", label: "Likes", color: "#003870" },
        ],
      },
    };
  }, [activePlatform, timeRange]);

  const currentChartConfig = chartConfigs[activeTab] || chartConfigs["Content Counts"];
  const comparisonChartConfig =
    activePlatform === "instagram" &&
    timeRange === MONTH_COMPARISON_RANGE &&
    activeTab === "Audience Reach"
      ? {
          ...currentChartConfig,
          metrics: [{ key: "reach.total", label: "Reach", color: "#003870" }],
        }
      : currentChartConfig;

  const isComparisonRange =
    ["facebook", "instagram"].includes(activePlatform) &&
    timeRange === MONTH_COMPARISON_RANGE;

  const shouldHoldChartEmpty =
    ["facebook", "instagram"].includes(activePlatform) &&
    (isChartRefreshing || (isComparisonRange && !monthComparisonChart));

  const displayChartConfig = activePlatform === "facebook" && timeRange === "7"
    ? { ...comparisonChartConfig, subtitle: `${FACEBOOK_INSIGHTS_PAGE_SIZE} Weeks Content Volume Trend` }
    : isComparisonRange && monthComparisonChart
      ? { ...comparisonChartConfig, subtitle: monthComparisonChart.subtitle }
      : comparisonChartConfig;

  const displayChartData = shouldHoldChartEmpty
    ? []
    : isComparisonRange && monthComparisonChart
      ? monthComparisonChart.currentData
      : chartData;

  const displayComparisonData = shouldHoldChartEmpty
    ? null
    : isComparisonRange && monthComparisonChart
      ? monthComparisonChart.previousData
      : null;

  const displayComparisonLabels = isComparisonRange && monthComparisonChart
    ? { current: monthComparisonChart.currentLabel, previous: monthComparisonChart.previousLabel }
    : null;

  const platformLabel =
    activePlatform === "tiktok" ? "TikTok" : (activePlatform === "instagram" ? "Instagram" : "Facebook");

  const fbTabsList = ["Content Counts", "Total Views", "Viewer Retention", "Engagement Metrics", "Audience Growth"];
  const igTabsList = ["Content Counts", "Total Views", "Audience Reach", "Engagement Metrics", "Audience Growth"];
  const ttTabsList = ["Video Breakdown", "Video Likes"];

  const handleNextTab = () => {
    if (activePlatform === "tiktok") {
      const currentIndex = ttTabsList.indexOf(activeTab);
      const nextIndex = (currentIndex + 1) % ttTabsList.length;
      setActiveTab(ttTabsList[nextIndex]);
      return;
    }

    const tabs = activePlatform === "instagram" ? igTabsList : fbTabsList;
    const currentIndex = tabs.indexOf(activeTab);
    const nextIndex = (currentIndex + 1) % tabs.length;
    setActiveTab(tabs[nextIndex]);
  };

  const handlePrevTab = () => {
    if (activePlatform === "tiktok") {
      const currentIndex = ttTabsList.indexOf(activeTab);
      const prevIndex = (currentIndex - 1 + ttTabsList.length) % ttTabsList.length;
      setActiveTab(ttTabsList[prevIndex]);
      return;
    }

    const tabs = activePlatform === "instagram" ? igTabsList : fbTabsList;
    const currentIndex = tabs.indexOf(activeTab);
    const prevIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    setActiveTab(tabs[prevIndex]);
  };

  const handleRangeChange = (range) => {
    if (["facebook", "instagram"].includes(activePlatform) && range !== timeRange) {
      setIsChartRefreshing(true);
      setMonthComparisonChart(null);
    }

    setTimeRange(range);
    if (range !== MONTH_COMPARISON_RANGE) {
      setTableTimeRange(range);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f8f9fa]">
        <p className="text-lg font-bold text-[#727782] animate-pulse uppercase tracking-widest">Validating Access...</p>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f8f9fa]">
        <div className="text-center p-12 bg-white rounded-3xl shadow-xl max-w-md border border-[#ffdad6]">
          <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-[#191c1d] mb-4">Report Unavailable</h2>
          <p className="text-[#727782] mb-0">{error || "This report could not be found."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] p-4 sm:p-8 lg:p-12 animate-in fade-in duration-700">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 sm:mb-12 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-[#f3f4f5] border border-[#c2c6d3]/30 flex items-center justify-center overflow-hidden shadow-lg flex-shrink-0">
              {client.logoData ? (
                <img
                  src={`${import.meta.env.VITE_API_BASE_URL || "/api"}/public-insights/logo/${shareToken}`}
                  alt={client.name}
                  className="w-full h-full object-cover"
                  onError={(event) => {
                    event.currentTarget.onerror = null;
                    event.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(client.name)}&background=003870&color=fff&size=128`;
                  }}
                />
              ) : (
                <div className="w-full h-full bg-[#003870] flex items-center justify-center text-white text-2xl sm:text-3xl font-black">
                  {client.name.charAt(0)}
                </div>
              )}
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-[#191c1d] mb-1 leading-tight">
                {client.name}: {platformLabel} Insights
              </h1>
              <p className="font-bold text-[10px] text-[#727782] uppercase tracking-[0.2em]">
                Social Performance Report
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
            <DateRangeSelector
              selectedRange={timeRange}
              onRangeChange={handleRangeChange}
              ranges={activePlatform === "tiktok" ? TIKTOK_DATE_RANGES : undefined}
              extraRanges={
                ["facebook", "instagram"].includes(activePlatform)
                  ? [{ label: "Current vs Last Month", value: MONTH_COMPARISON_RANGE }]
                  : []
              }
            />
            <div className="h-4 w-[1px] bg-slate-200 hidden sm:block mx-1 opacity-50"></div>
            <div className="bg-white px-4 py-2 rounded-2xl border border-slate-200/60 shadow-sm flex items-center justify-center gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">Read Only Mode</span>
            </div>
          </div>
        </header>

        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <MetricTabs activeTab={activeTab} setActiveTab={setActiveTab} platform={activePlatform} />
          <PlatformSelector
            activePlatform={activePlatform}
            setActivePlatform={setActivePlatform}
            activeChannels={client?.activeChannels}
          />
        </div>

        <div className="grid grid-cols-12 gap-6 lg:gap-10">
          <div className="col-span-12 space-y-6 lg:col-span-9 min-w-0">
            <ContentVelocityChart
              title={displayChartConfig.title}
              subtitle={displayChartConfig.subtitle}
              data={displayChartData}
              comparisonData={displayComparisonData}
              comparisonLabels={displayComparisonLabels}
              metrics={displayChartConfig.metrics}
              onNext={handleNextTab}
              onPrev={handlePrevTab}
              hidePoints={activePlatform === "tiktok"}
            />

            {insightsLoading ? (
              <div className="flex h-80 items-center justify-center rounded-[32px] border border-dashed border-slate-200 bg-white/50 text-[#727782]">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-8 h-8 border-4 border-[#003870]/20 border-t-[#003870] rounded-full animate-spin"></div>
                  <p className="font-black text-[10px] uppercase tracking-widest">Syncing Data...</p>
                </div>
              </div>
            ) : (
              <ContentBreakdownTable
                clientName={client.name}
                data={tableData}
                platform={activePlatform}
                timeRange={tableTimeRange}
                followersCount={activePlatform === "tiktok" ? platformStats.tiktok?.follower_count : null}
                pagination={activePlatform === "facebook" || activePlatform === "instagram" ? {
                  page: insightsPage,
                  canPrev: insightsPage > 1,
                  canNext: true,
                  isLoading: insightsLoading,
                  onPrev: () => setInsightsPage((page) => Math.max(1, page - 1)),
                  onNext: () => setInsightsPage((page) => page + 1),
                } : tiktokPagination}
              />
            )}
          </div>

          <div className="col-span-12 space-y-10 lg:col-span-3 min-w-0">
            <OverviewMetricsCard
              platform={activePlatform}
              timeRange={tableTimeRange}
              allData={activePlatform === "tiktok" ? [platformStats.tiktok] : insightData}
            />

            <div className="p-8 rounded-[32px] bg-[linear-gradient(135deg,#003870_0%,#005cb8_100%)] text-white shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110 duration-700"></div>
              <h4 className="text-xl font-black mb-2 relative z-10 tracking-tight">Check Funnel</h4>
              <p className="text-xs text-blue-100 font-medium leading-relaxed mb-6 opacity-80">
                End-to-end performance marketing & content strategy optimization platform.
              </p>

              <div className="flex flex-col gap-4 mb-8 pt-6 border-t border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-blue-200">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                  </div>
                  <span className="text-[11px] font-bold text-white tracking-tight">+94 77 780 9062</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-blue-200">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                  </div>
                  <span className="text-[11px] font-bold text-white tracking-tight">mail@checkfunnel.com</span>
                </div>
              </div>
            </div>

            <div className="text-center py-6 px-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Powered by</p>
              <span className="text-xl font-black text-[#003870] tracking-tighter">CHECK FUNNEL</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
