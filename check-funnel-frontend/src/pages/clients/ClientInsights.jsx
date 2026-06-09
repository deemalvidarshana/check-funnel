import { useState, useEffect, useMemo, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import { Check, Download, Share2 } from "lucide-react";
import MetricTabs from "../../components/insights/MetricTabs";
import PlatformSelector from "../../components/insights/PlatformSelector";
import ContentVelocityChart from "../../components/insights/ContentVelocityChart";
import ContentBreakdownTable from "../../components/insights/ContentBreakdownTable";
import OverviewMetricsCard from "../../components/insights/OverviewMetricsCard";
import InitializePartnerCard from "../../components/insights/InitializePartnerCard";
import SystemHealthCard from "../../components/insights/SystemHealthCard";
import DateRangeSelector from "../../components/insights/DateRangeSelector";
import InsightChatbot from "../../components/insights/InsightChatbot";
import {
  downloadInsightsPdf,
  getInsightsPdfFilename,
} from "../../components/insights/InsightsPdfReport";
import { getFacebookInsights } from "../../api/facebook";
import { getInstagramInsights, getInstagramRangeInsights } from "../../api/instagram";
import { getClientById, getClientInsightsReportData, toggleShare } from "../../api/client";
import { canManageFeature } from "../../utils/permissions";
import { getTiktokInsights } from "../../api/tiktok";
import { buildMonthComparisonRanges } from "../../utils/monthComparisonChart";


const FACEBOOK_INSIGHTS_PAGE_SIZE = 6;
const MONTH_COMPARISON_RANGE = "month_compare";
const PDF_REPORT_DATA_TIMEOUT_MS = 60000;
const PDF_LOADING_GUARD_MS = PDF_REPORT_DATA_TIMEOUT_MS + 15000;
const TIKTOK_DATE_RANGES = [
  { label: "Last 6 Videos", value: "7" },
  { label: "Last 6 Months", value: "30" },
];

function withTimeout(promise, timeoutMs, message) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      window.setTimeout(() => reject(new Error(message)), timeoutMs);
    }),
  ]);
}

function buildFallbackPdfReportData({ client, activePlatform, timeRange, chartRows, tableRows, platformStats }) {
  const rows = Array.isArray(tableRows) && tableRows.length ? tableRows : chartRows;
  const fallbackRows = Array.isArray(rows) ? rows : [];
  const isMonthlyView = timeRange === "30";
  const platformLabel =
    activePlatform === 'instagram' ? 'Instagram' :
    activePlatform === 'tiktok' ? 'TikTok' :
    'Facebook';

  return {
    generatedAt: new Date().toISOString(),
    client: {
      id: client?.id,
      name: client?.name || 'Client',
      industry: client?.industry,
      activeChannels: client?.activeChannels || [activePlatform],
    },
    selectedPlatform: activePlatform,
    includedPlatforms: [activePlatform],
    topics: [
      { key: 'weekly', label: 'Last 10 Weeks', rangeKey: 'weeks10' },
      { key: 'monthly', label: 'Last 6 Months', rangeKey: 'months6' },
    ],
    platforms: {
      [activePlatform]: {
        label: platformLabel,
        available: true,
        user: activePlatform === 'tiktok' ? platformStats?.tiktok || null : null,
        weekly: isMonthlyView ? [] : fallbackRows,
        monthly: isMonthlyView ? fallbackRows : [],
      },
    },
  };
}

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
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const bucket = {
      id: key,
      week: date.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }),
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
    const key = `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, '0')}`;
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

function compactInsightRows(rows = [], limit = Number.POSITIVE_INFINITY) {
  if (!Array.isArray(rows)) return [];

  const rowsForContext = Number.isFinite(limit) ? rows.slice(0, limit) : rows;

  return rowsForContext.map((row) => {
    if (!row || typeof row !== 'object') return row;

    return Object.entries(row).reduce((result, [key, value]) => {
      if (key.toLowerCase().includes('apikey') || key.toLowerCase().includes('token')) {
        return result;
      }

      if (value == null || ['string', 'number', 'boolean'].includes(typeof value)) {
        result[key] = value;
        return result;
      }

      if (Array.isArray(value)) {
        result[key] = value.slice(0, 5);
        return result;
      }

      if (typeof value === 'object') {
        result[key] = Object.entries(value).reduce((nested, [nestedKey, nestedValue]) => {
          if (nestedValue == null || ['string', 'number', 'boolean'].includes(typeof nestedValue)) {
            nested[nestedKey] = nestedValue;
          }
          return nested;
        }, {});
      }

      return result;
    }, {});
  });
}

export default function ClientInsights() {
  const { id } = useParams();

  const [activeTab, setActiveTab] = useState("Content Counts");
  const [activePlatform, setActivePlatform] = useState("facebook");
  const [timeRange, setTimeRange] = useState("7");
  const [tableTimeRange, setTableTimeRange] = useState("7");
  const [client, setClient] = useState(null);
  const [insightData, setInsightData] = useState([]);
  const [monthComparisonChart, setMonthComparisonChart] = useState(null);
  const [isChartRefreshing, setIsChartRefreshing] = useState(false);
  const [platformStats, setPlatformStats] = useState({}); // New state for runtime metadata
  const [clientLoading, setClientLoading] = useState(true);

  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsPage, setInsightsPage] = useState(1);
  const [tiktokTablePage, setTiktokTablePage] = useState(1);
  const insightsRequestId = useRef(0);

  // 1. Fetch real client data from DB
  useEffect(() => {
    const fetchClient = async () => {
      setClientLoading(true);
      try {
        const data = await getClientById(id);
        
        // Normalize and dynamically detect active channels
        const active = Array.isArray(data.activeChannels) 
          ? [...data.activeChannels] 
          : (data.activeChannels || "").split(",").filter(Boolean).map(s => s.trim());

        if (data.facebookPageId && data.facebookApiKey && !active.includes('facebook')) {
          active.push('facebook');
        }
        if (data.instagramAccountId && data.instagramApiKey && !active.includes('instagram')) {
          active.push('instagram');
        }

        setClient({ ...data, activeChannels: active });
      } catch (error) {
        console.error("Failed to fetch client data", error);
      } finally {
        setClientLoading(false);
      }
    };
    fetchClient();
  }, [id]);

  const generateWeeks = (page = 1, pageSize = FACEBOOK_INSIGHTS_PAGE_SIZE) => {
    const weeks = [];
    const today = new Date();
    
    // Find most recent Monday
    // getDay() returns 0 for Sunday, 1 for Monday, etc.
    const dayOfWeek = today.getDay();
    const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    
    const currentMonday = new Date(today);
    currentMonday.setDate(today.getDate() - diffToMonday);
    
    // ✅ FIX: Use LOCAL date parts — toISOString() shifts midnight local dates
    // back 1 day for UTC+5:30 users (1 Apr 00:00 IST = 31 Mar 18:30 UTC)
    const formatDate = (date) => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    };

    const startIndex = (page - 1) * pageSize;

    for (let rangeIndex = startIndex; rangeIndex < startIndex + pageSize; rangeIndex += 1) {
      if (rangeIndex === 0) {
        // Week 1: Current week from most recent Monday to today
        const currentWeekSince = new Date(currentMonday);
        const currentWeekUntil = new Date(today);
        weeks.push({
          label: `${currentWeekSince.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} - ${currentWeekUntil.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`,
          since: formatDate(currentWeekSince),
          until: formatDate(currentWeekUntil)
        });
      } else {
        const untilDate = new Date(currentMonday);
        untilDate.setDate(currentMonday.getDate() - ((rangeIndex - 1) * 7) - 1);

        const sinceDate = new Date(untilDate);
        sinceDate.setDate(untilDate.getDate() - 6);

        weeks.push({
          label: `${sinceDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} - ${untilDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`,
          since: formatDate(sinceDate),
          until: formatDate(untilDate)
        });
      }
    }

    return weeks.reverse();
  };
  
  const generateMonths = (page = 1, pageSize = FACEBOOK_INSIGHTS_PAGE_SIZE) => {
    const months = [];
    const today = new Date();
    // ✅ FIX: Use LOCAL date parts — toISOString() shifts midnight local dates
    // back 1 day for UTC+5:30 users (1 Apr 00:00 IST = 31 Mar 18:30 UTC)
    // e.g. new Date(2026, 3, 1) = 1 Apr 00:00 IST → UTC → "2026-03-31" WRONG!
    const formatDate = (date) => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    };

    const startIndex = (page - 1) * pageSize;

    for (let i = startIndex; i < startIndex + pageSize; i++) {
        // Target month start (1st day)
        const sinceDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
        
        let untilDate;
        if (i === 0) {
            // Current month: until today
            untilDate = new Date(today);
        } else {
            // Previous months: until last day of that month (Day 0 of next month)
            untilDate = new Date(today.getFullYear(), today.getMonth() - i + 1, 0);
        }

        const label = `${sinceDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} - ${untilDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`;
        months.push({ label, since: formatDate(sinceDate), until: formatDate(untilDate) });
    }
    return months.reverse();
  };

  const formatLocalDate = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
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
  }, [id, activePlatform, timeRange]);

  useEffect(() => {
    if (!['facebook', 'instagram'].includes(activePlatform) && timeRange === MONTH_COMPARISON_RANGE) {
      setTimeRange("7");
      setTableTimeRange("7");
    }
  }, [activePlatform, timeRange]);

  // 2. Fetch insights when client is ready
  useEffect(() => {
    const requestId = insightsRequestId.current + 1;
    insightsRequestId.current = requestId;
    const isCurrentRequest = () => insightsRequestId.current === requestId;

    const fetchAllData = async () => {
      if (!client) return;
      if (!["facebook", "instagram"].includes(activePlatform) && timeRange === MONTH_COMPARISON_RANGE) return;

      if (["facebook", "instagram"].includes(activePlatform)) {
        setIsChartRefreshing(true);
      }
      
      if (timeRange !== MONTH_COMPARISON_RANGE) {
        setInsightData([]); // Reset data to avoid stale property glitches when switching platforms
      }
      if (timeRange !== MONTH_COMPARISON_RANGE) {
        setMonthComparisonChart(null);
      }
      
      // Facebook Fetch
      if (activePlatform === "facebook") {
        if (!client.facebookPageId || !client.facebookApiKey) {
          setInsightData([]);
          setIsChartRefreshing(false);
          return;
        }

        try {
          if (timeRange === MONTH_COMPARISON_RANGE) {
            setMonthComparisonChart(null);
            const comparisonRanges = buildMonthComparisonRanges();
            const [currentRows, previousRows] = await Promise.all([
              Promise.all(
                comparisonRanges.currentRanges.map((w) =>
                  getFacebookInsights(client.facebookPageId, client.facebookApiKey, w.since, w.until)
                    .then((res) => ({ ...res, week: w.label }))
                    .catch(() => ({ week: w.label, error: true }))
                )
              ),
              Promise.all(
                comparisonRanges.previousRanges.map((w) =>
                  getFacebookInsights(client.facebookPageId, client.facebookApiKey, w.since, w.until)
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

          setInsightsLoading(true);
          const ranges = timeRange === "30" ? generateMonths(insightsPage) : generateWeeks(insightsPage);
          const results = await Promise.all(
            ranges.map(w => 
              getFacebookInsights(client.facebookPageId, client.facebookApiKey, w.since, w.until)
                .then(res => ({ ...res, week: w.label }))
                .catch(() => ({ week: w.label, error: true }))
            )
          );
          if (!isCurrentRequest()) return;
          setInsightData(results);
        } catch (error) {
          console.error("Failed to fetch FB insights", error);
        } finally {
          if (isCurrentRequest() && timeRange !== MONTH_COMPARISON_RANGE) {
            setInsightsLoading(false);
          }
          if (isCurrentRequest()) {
            setIsChartRefreshing(false);
          }
        }
      } 
      
      // Instagram Fetch
      else if (activePlatform === "instagram") {
        if (!client.instagramAccountId || !client.instagramApiKey) {
          setInsightData([]);
          setIsChartRefreshing(false);
          return;
        }

        try {
          if (timeRange === MONTH_COMPARISON_RANGE) {
            setMonthComparisonChart(null);
            const comparisonRanges = buildMonthComparisonRanges();
            const [currentResult, previousResult] = await Promise.all([
              getInstagramRangeInsights(client.instagramAccountId, client.instagramApiKey, comparisonRanges.currentRanges),
              getInstagramRangeInsights(client.instagramAccountId, client.instagramApiKey, comparisonRanges.previousRanges),
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

          setInsightsLoading(true);
          const until = getInstagramUntilForPage(insightsPage, timeRange);
          const result = await getInstagramInsights(client.instagramAccountId, client.instagramApiKey, until, timeRange);
          if (!isCurrentRequest()) return;
          setInsightData(result.weeks || []);
        } catch (error) {
          console.error("Failed to fetch IG insights", error);
        } finally {
          if (isCurrentRequest() && timeRange !== MONTH_COMPARISON_RANGE) {
            setInsightsLoading(false);
          }
          if (isCurrentRequest()) {
            setIsChartRefreshing(false);
          }
        }
      }
      
      // TikTok Fetch
      else if (activePlatform === "tiktok") {
        setInsightsLoading(true);
        try {
          const result = await getTiktokInsights(id);
          if (!isCurrentRequest()) return;
          // TikTok insights return { user, videos }
          // We'll store videos as insightData for the table
          setInsightData(result.videos || []);
          // ✅ FIX: Use separate state to avoid infinite loops with the 'client' dependency
          if (result.user) {
            setPlatformStats(prev => ({ ...prev, tiktok: result.user }));
          }
        } catch (error) {
          console.error("Failed to fetch TikTok insights", error);
        } finally {
          if (isCurrentRequest()) {
            setInsightsLoading(false);
          }
        }
      }

      
      else {
        setInsightData([]);
      }

    };

    if (client && !clientLoading) fetchAllData();

    return () => {
      if (isCurrentRequest()) {
        insightsRequestId.current += 1;
      }
    };
  }, [id, activePlatform, timeRange, clientLoading, insightsPage]);




  // NEW: Prepare specialized data for the chart (especially for TikTok)
  const chartData = useMemo(() => {
    if (activePlatform === 'tiktok') {
      if (timeRange === "30") {
        return buildTiktokMonthlyChartData(insightData);
      }

      // Match the TikTok table page, then reverse for oldest-to-newest chart flow.
      const startIndex = (tiktokTablePage - 1) * FACEBOOK_INSIGHTS_PAGE_SIZE;
      const sorted = [...(insightData || [])].sort((a, b) => (b.create_time || 0) - (a.create_time || 0));
      const visiblePageRows = sorted.slice(startIndex, startIndex + FACEBOOK_INSIGHTS_PAGE_SIZE).reverse();
      
      return visiblePageRows.map(v => ({
        ...v,
        week: v.create_time 
          ? new Date(v.create_time * 1000).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) 
          : ''
      }));

    }
    return insightData;
  }, [insightData, activePlatform, tiktokTablePage, timeRange]);

  const tableData = useMemo(() => {
    if (activePlatform !== 'tiktok') return insightData;

    if (timeRange === "30") {
      return buildTiktokMonthlyChartData(insightData);
    }

    const startIndex = (tiktokTablePage - 1) * FACEBOOK_INSIGHTS_PAGE_SIZE;

    return [...(insightData || [])]
      .sort((a, b) => (b.create_time || 0) - (a.create_time || 0))
      .slice(startIndex, startIndex + FACEBOOK_INSIGHTS_PAGE_SIZE);
  }, [activePlatform, insightData, tiktokTablePage, timeRange]);

  const tiktokTotalRows = useMemo(() => {
    if (activePlatform !== 'tiktok') return 0;
    if (timeRange === "30") return 6;
    return insightData?.length || 0;
  }, [activePlatform, insightData, timeRange]);

  const tiktokPagination = activePlatform === 'tiktok' ? {
    page: tiktokTablePage,
    canPrev: tiktokTablePage > 1,
    canNext: tiktokTablePage * FACEBOOK_INSIGHTS_PAGE_SIZE < tiktokTotalRows,
    isLoading: insightsLoading,
    onPrev: () => setTiktokTablePage((page) => Math.max(1, page - 1)),
    onNext: () => setTiktokTablePage((page) => (
      page * FACEBOOK_INSIGHTS_PAGE_SIZE < tiktokTotalRows ? page + 1 : page
    )),
  } : null;


  // Adjust activeTab when platform changes
  useEffect(() => {
    // If returning from TikTok to FB/IG, default to 'Content Counts'
    if ((activePlatform === 'facebook' || activePlatform === 'instagram') && 
        (activeTab === 'Video Breakdown' || activeTab === 'Video Likes' || activeTab === 'Account Overview')) {
      setActiveTab('Content Counts');
    } 
    // Existing logic for FB <-> IG specific tabs
    else if (activePlatform === 'instagram' && activeTab === 'Viewer Retention') {
      setActiveTab('Audience Reach');
    } else if (activePlatform === 'facebook' && activeTab === 'Audience Reach') {
      setActiveTab('Viewer Retention');
    } 
    // Logic for TikTok specific tabs
    else if (activePlatform === 'tiktok') {
      if (!["Video Breakdown", "Video Likes"].includes(activeTab)) {
        setActiveTab('Video Breakdown');
      }
    }
  }, [activePlatform, activeTab]);



  const chartConfigs = useMemo(() => {
    const isIG = activePlatform === 'instagram';
    const tiktokPeriodLabel = timeRange === "30" ? "Last 6 Months" : "Last 6 Videos";

    return {
      "Content Counts": {
        title: `Content Velocity`,
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
            color: "#003870" 
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
    activePlatform === 'instagram' && timeRange === MONTH_COMPARISON_RANGE && activeTab === 'Audience Reach'
      ? {
          ...currentChartConfig,
          metrics: [{ key: "reach.total", label: "Reach", color: "#003870" }],
        }
      : currentChartConfig;
  const isComparisonRange =
    ['facebook', 'instagram'].includes(activePlatform) &&
    timeRange === MONTH_COMPARISON_RANGE;
  const shouldHoldChartEmpty =
    ['facebook', 'instagram'].includes(activePlatform) &&
    (isChartRefreshing || (isComparisonRange && !monthComparisonChart));

  const displayChartConfig = activePlatform === 'facebook' && timeRange === "7"
    ? { ...comparisonChartConfig, subtitle: `${FACEBOOK_INSIGHTS_PAGE_SIZE} Weeks Content Volume Trend` }
    : isComparisonRange && monthComparisonChart
      ? { ...comparisonChartConfig, subtitle: monthComparisonChart.subtitle }
    : comparisonChartConfig;

  const displayChartData =
    shouldHoldChartEmpty
      ? []
      : isComparisonRange && monthComparisonChart
      ? monthComparisonChart.currentData
      : chartData;

  const displayComparisonData =
    shouldHoldChartEmpty
      ? null
      : isComparisonRange && monthComparisonChart
      ? monthComparisonChart.previousData
      : null;

  const displayComparisonLabels =
    isComparisonRange && monthComparisonChart
      ? { current: monthComparisonChart.currentLabel, previous: monthComparisonChart.previousLabel }
      : null;


  const platformLabel = activePlatform === 'tiktok' ? 'TikTok' : (activePlatform === 'instagram' ? 'Instagram' : 'Facebook');
  const selectedRangeLabel = activePlatform === 'tiktok'
    ? TIKTOK_DATE_RANGES.find((range) => range.value === timeRange)?.label || 'Last 6 Videos'
    : timeRange === MONTH_COMPARISON_RANGE
      ? 'Current vs Last Month'
      : timeRange === '30'
        ? 'Last 6 Months'
        : 'Last 7 Weeks';

  const insightChatContext = {
    clientName: client?.name,
    platform: activePlatform,
    platformLabel,
    activeTab,
    timeRange: selectedRangeLabel,
    chart: {
      title: displayChartConfig.title,
      subtitle: displayChartConfig.subtitle,
      metrics: displayChartConfig.metrics.map((metric) => ({
        key: metric.key,
        label: metric.label,
      })),
      rows: compactInsightRows(displayChartData),
      comparisonRows: compactInsightRows(displayComparisonData || []),
    },
    tableRows: compactInsightRows(tableData),
    overview: activePlatform === 'tiktok'
      ? compactInsightRows([platformStats.tiktok])
      : compactInsightRows(insightData),
    platformStats: activePlatform === 'tiktok' ? platformStats.tiktok : null,
  };

  const fbTabsList = ["Content Counts", "Total Views", "Viewer Retention", "Engagement Metrics", "Audience Growth"];
  const igTabsList = ["Content Counts", "Total Views", "Audience Reach", "Engagement Metrics", "Audience Growth"];
  const ttTabsList = ["Video Breakdown", "Video Likes"];

  const handleNextTab = () => {
    if (activePlatform === 'tiktok') {
      const currentIndex = ttTabsList.indexOf(activeTab);
      const nextIndex = (currentIndex + 1) % ttTabsList.length;
      setActiveTab(ttTabsList[nextIndex]);
      return;
    }
    const tabs = activePlatform === 'instagram' ? igTabsList : fbTabsList;
    const currentIndex = tabs.indexOf(activeTab);
    const nextIndex = (currentIndex + 1) % tabs.length;
    setActiveTab(tabs[nextIndex]);
  };

  const handlePrevTab = () => {
    if (activePlatform === 'tiktok') {
      const currentIndex = ttTabsList.indexOf(activeTab);
      const prevIndex = (currentIndex - 1 + ttTabsList.length) % ttTabsList.length;
      setActiveTab(ttTabsList[prevIndex]);
      return;
    }
    const tabs = activePlatform === 'instagram' ? igTabsList : fbTabsList;
    const currentIndex = tabs.indexOf(activeTab);
    const prevIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    setActiveTab(tabs[prevIndex]);
  };

  const [shareLoading, setShareLoading] = useState(false);
  const canManageClients = canManageFeature("clients");
  const [showCopied, setShowCopied] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    if (!pdfLoading) return undefined;

    const timeoutId = window.setTimeout(() => {
      setPdfLoading(false);
    }, PDF_LOADING_GUARD_MS);

    return () => window.clearTimeout(timeoutId);
  }, [pdfLoading]);

  const handleRangeChange = (range) => {
    if (['facebook', 'instagram'].includes(activePlatform) && range !== timeRange) {
      setIsChartRefreshing(true);
      setMonthComparisonChart(null);
    }

    setTimeRange(range);
    if (range !== MONTH_COMPARISON_RANGE) {
      setTableTimeRange(range);
    }
  };

  const handleShare = async () => {
    if (!canManageClients) return;
    setShareLoading(true);
    try {
      const updatedClient = await toggleShare(id, true);
      const shareUrl = `${window.location.origin}/public-report/${updatedClient.shareToken}`;
      
      // Fallback for non-HTTPS or older browsers
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        // Fallback for HTTP (Unsecure) environments
        const textArea = document.createElement("textarea");
        textArea.value = shareUrl;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        textArea.style.top = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
          document.execCommand('copy');
        } catch (err) {
          console.error('Fallback copy failed', err);
        }
        document.body.removeChild(textArea);
      }

      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);
    } catch (error) {
      console.error("Failed to share report", error);
      alert("Failed to copy link. Please manually copy the URL from the browser console.");
    } finally {
      setShareLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (pdfLoading) return;

    setPdfLoading(true);

    try {
      let reportData;

      try {
        reportData = await withTimeout(
          getClientInsightsReportData(id, activePlatform),
          PDF_REPORT_DATA_TIMEOUT_MS,
          "PDF report data request timed out.",
        );
      } catch (reportError) {
        console.warn("Using current page data for PDF fallback", reportError);
        reportData = buildFallbackPdfReportData({
          client,
          activePlatform,
          timeRange,
          chartRows: displayChartData,
          tableRows: tableData,
          platformStats,
        });
      }

      await downloadInsightsPdf(reportData, getInsightsPdfFilename(reportData));
    } catch (error) {
      console.error("Failed to download insights PDF", error);
      alert("Failed to generate the PDF report. Please try again.");
    } finally {
      setPdfLoading(false);
    }
  };

  if (clientLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-lg font-bold text-[#727782] animate-pulse">Loading client profile...</p>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-lg font-bold text-[#93000a]">Client not found.</p>
      </div>
    );
  }

  return (
    <>
    <section className="w-full max-w-full overflow-hidden">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="flex items-start gap-1.5 sm:gap-2">
          <Link
            to="/clients"
            className="mt-2 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[#003870] transition-all hover:bg-[#003870]/8 active:scale-90 sm:mt-3"
            title="Back to clients"
            aria-label="Back to clients"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8">
              <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <div className="space-y-2">
            <h1 className="text-4xl font-extrabold tracking-tight text-[#191c1d]">
              {client.name}: {platformLabel} Insights
            </h1>

            <p className="font-medium text-[#727782]">
              Performance monitoring and content velocity analytics for your network.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {canManageClients && <button
            onClick={handleShare}
            disabled={shareLoading}
            className="flex h-11 shrink-0 items-center justify-center gap-2 rounded-full border border-[#c2c6d3]/20 bg-[#f3f4f5]/50 px-4 font-bold text-[#003870] transition-all hover:bg-[#f3f4f5] active:scale-95 disabled:opacity-50 sm:px-5"
            title={showCopied ? "Share link copied" : "Share report"}
            aria-label={showCopied ? "Share link copied" : "Share report"}
          >
            {shareLoading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#003870] border-t-transparent"></div>
            ) : showCopied ? (
              <>
                <Check className="h-4 w-4 animate-in fade-in zoom-in duration-300" strokeWidth={3} />
                <span className="text-base sm:text-lg">Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="h-4 w-4" strokeWidth={2.5} />
                <span className="text-base sm:text-lg">Share</span>
              </>
            )}
          </button>}
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={pdfLoading}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#c2c6d3]/20 bg-[#f3f4f5]/50 text-[#003870] transition-all hover:bg-[#f3f4f5] active:scale-95 disabled:opacity-50"
            title="Download full PDF report"
            aria-label="Download full PDF report"
          >
            {pdfLoading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#003870] border-t-transparent"></div>
            ) : (
              <Download className="h-4 w-4" strokeWidth={2.5} />
            )}
          </button>
          <DateRangeSelector
            selectedRange={timeRange}
            onRangeChange={handleRangeChange}
            ranges={activePlatform === 'tiktok' ? TIKTOK_DATE_RANGES : undefined}
            extraRanges={['facebook', 'instagram'].includes(activePlatform) ? [{ label: "Current vs Last Month", value: MONTH_COMPARISON_RANGE }] : []}
          />
        </div>
      </div>

      {/* Tabs + platform */}
      <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <MetricTabs 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          platform={activePlatform}
        />
        <PlatformSelector
          activePlatform={activePlatform}
          setActivePlatform={setActivePlatform}
          activeChannels={client?.activeChannels}
        />
      </div>

      {/* Main area */}
       <div className="grid grid-cols-12 gap-8 w-full">
        <div className="col-span-12 space-y-8 lg:col-span-9 min-w-0">

          <ContentVelocityChart
            title={displayChartConfig.title}
            subtitle={displayChartConfig.subtitle}
            data={displayChartData}
            comparisonData={displayComparisonData}
            comparisonLabels={displayComparisonLabels}
            metrics={displayChartConfig.metrics}
            onNext={handleNextTab}
            onPrev={handlePrevTab}
            hidePoints={activePlatform === 'tiktok'}
          />



          {insightsLoading ? (
            <div className="flex h-64 items-center justify-center rounded-3xl border border-[#edeeef] bg-[#f8f9fa] text-[#727782]">
              <p className="animate-pulse font-bold text-sm">Synchronizing real-time insights from {activePlatform === 'tiktok' ? 'TikTok' : (activePlatform === 'facebook' ? 'Facebook' : 'Instagram')}...</p>
            </div>

          ) : activePlatform === 'facebook' && (!client.facebookPageId || !client.facebookApiKey) ? (
            <div className="flex h-64 items-center justify-center rounded-3xl border border-[#ffdad6] bg-[#ffdad6]/10 text-[#93000a]">
              <p className="font-bold text-sm text-center px-8">Facebook Page ID or API Key is missing.<br/>Please update client settings to see insights.</p>
            </div>
          ) : activePlatform === 'instagram' && (!client.instagramAccountId || !client.instagramApiKey) ? (
            <div className="flex h-64 items-center justify-center rounded-3xl border border-[#ffdad6] bg-[#ffdad6]/10 text-[#93000a]">
              <p className="font-bold text-sm text-center px-8">Instagram Account ID or API Key is missing.<br/>Please update client settings to see insights.</p>
            </div>
          ) : (
            <ContentBreakdownTable
              clientName={client.name}
              data={tableData}
              platform={activePlatform}
              timeRange={tableTimeRange}
              followersCount={activePlatform === 'tiktok' ? platformStats.tiktok?.follower_count : null}
              pagination={activePlatform === 'facebook' || activePlatform === 'instagram' ? {
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

        <div className="col-span-12 space-y-8 lg:col-span-3 min-w-0">

          <OverviewMetricsCard 
            platform={activePlatform} 
            timeRange={tableTimeRange}
            allData={
              activePlatform === 'tiktok' 
                ? [platformStats.tiktok] 
                : insightData
            } 
          />

          <InsightChatbot
            context={insightChatContext}
            disabled={insightsLoading || shouldHoldChartEmpty}
          />

          <InitializePartnerCard clientId={id} />
          <SystemHealthCard />
        </div>

      </div>
    </section>
    </>
  );
}
