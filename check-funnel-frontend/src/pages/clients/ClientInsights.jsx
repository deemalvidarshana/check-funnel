import { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import MetricTabs from "../../components/insights/MetricTabs";
import PlatformSelector from "../../components/insights/PlatformSelector";
import ContentVelocityChart from "../../components/insights/ContentVelocityChart";
import ContentBreakdownTable from "../../components/insights/ContentBreakdownTable";
import OverviewMetricsCard from "../../components/insights/OverviewMetricsCard";
import InitializePartnerCard from "../../components/insights/InitializePartnerCard";
import SystemHealthCard from "../../components/insights/SystemHealthCard";
import DateRangeSelector from "../../components/insights/DateRangeSelector";
import { getFacebookInsights } from "../../api/facebook";
import { getInstagramInsights } from "../../api/instagram";
import { getClientById, toggleShare } from "../../api/client";
import { getTiktokInsights } from "../../api/tiktok";


export default function ClientInsights() {
  const { id } = useParams();

  const [activeTab, setActiveTab] = useState("Content Counts");
  const [activePlatform, setActivePlatform] = useState("facebook");
  const [timeRange, setTimeRange] = useState("7");
  const [client, setClient] = useState(null);
  const [insightData, setInsightData] = useState([]);
  const [platformStats, setPlatformStats] = useState({}); // New state for runtime metadata
  const [clientLoading, setClientLoading] = useState(true);

  const [insightsLoading, setInsightsLoading] = useState(false);

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

  const generateWeeks = () => {
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

    // Week 1: Current week from most recent Monday to today
    const currentWeekSince = new Date(currentMonday);
    const currentWeekUntil = new Date(today);
    weeks.push({ 
        label: `${currentWeekSince.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} - ${currentWeekUntil.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`, 
        since: formatDate(currentWeekSince), 
        until: formatDate(currentWeekUntil) 
    });

    // Weeks 2-7: Previous 6 full Mon-Sun weeks
    let lastMonday = currentMonday;
    for (let i = 0; i < 6; i++) {
        const untilDate = new Date(lastMonday);
        untilDate.setDate(lastMonday.getDate() - 1); // Sunday
        
        const sinceDate = new Date(untilDate);
        sinceDate.setDate(untilDate.getDate() - 6); // Monday
        
        weeks.push({ 
            label: `${sinceDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} - ${untilDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`, 
            since: formatDate(sinceDate), 
            until: formatDate(untilDate) 
        });
        
        lastMonday = sinceDate;
    }

    return weeks.reverse();
  };
  
  const generateMonths = () => {
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

    for (let i = 0; i < 6; i++) {
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

  // 2. Fetch insights when client is ready
  useEffect(() => {
    const fetchAllData = async () => {
      if (!client) return;
      
      setInsightData([]); // Reset data to avoid stale property glitches when switching platforms
      
      // Facebook Fetch
      if (activePlatform === "facebook") {
        if (!client.facebookPageId || !client.facebookApiKey) {
          setInsightData([]);
          return;
        }

        setInsightsLoading(true);
        try {
          const ranges = timeRange === "30" ? generateMonths() : generateWeeks();
          const results = await Promise.all(
            ranges.map(w => 
              getFacebookInsights(client.facebookPageId, client.facebookApiKey, w.since, w.until)
                .then(res => ({ ...res, week: w.label }))
                .catch(() => ({ week: w.label, error: true }))
            )
          );
          setInsightData(results);
        } catch (error) {
          console.error("Failed to fetch FB insights", error);
        } finally {
          setInsightsLoading(false);
        }
      } 
      
      // Instagram Fetch
      else if (activePlatform === "instagram") {
        if (!client.instagramAccountId || !client.instagramApiKey) {
          setInsightData([]);
          return;
        }

        setInsightsLoading(true);
        try {
          const result = await getInstagramInsights(client.instagramAccountId, client.instagramApiKey, undefined, timeRange);
          setInsightData(result.weeks || []);
        } catch (error) {
          console.error("Failed to fetch IG insights", error);
        } finally {
          setInsightsLoading(false);
        }
      }
      
      // TikTok Fetch
      else if (activePlatform === "tiktok") {
        setInsightsLoading(true);
        try {
          const result = await getTiktokInsights(id);
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
          setInsightsLoading(false);
        }
      }

      
      else {
        setInsightData([]);
      }

    };

    if (client && !clientLoading) fetchAllData();
  }, [id, activePlatform, timeRange, clientLoading]);




  // NEW: Prepare specialized data for the chart (especially for TikTok)
  const chartData = useMemo(() => {
    if (activePlatform === 'tiktok') {
      // 1. Get all videos
      // 2. Sort by create_time descending to get newest first
      // 3. Take last 7 (most recent)
      // 4. Reverse to get oldest-to-newest for chart flow
      const sorted = [...(insightData || [])].sort((a, b) => (b.create_time || 0) - (a.create_time || 0));
      const last7 = sorted.slice(0, 7).reverse();
      
      return last7.map(v => ({
        ...v,
        week: v.create_time 
          ? new Date(v.create_time * 1000).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) 
          : ''
      }));

    }
    return insightData;
  }, [insightData, activePlatform]);


  // Adjust activeTab when platform changes
  useEffect(() => {
    // If returning from TikTok to FB/IG, default to 'Content Counts'
    if ((activePlatform === 'facebook' || activePlatform === 'instagram') && 
        (activeTab === 'Video Breakdown' || activeTab === 'Account Overview')) {
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
            label: "Interactions", 
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
        subtitle: "Performance of Last 7 Videos",
        metrics: [
          { key: "view_count", label: "Views", color: "#003870" },
        ],
      },
      "Video Likes": {
        title: "Likes Breakdown",
        subtitle: "Performance of Last 7 Videos",
        metrics: [
          { key: "like_count", label: "Likes", color: "#e11d48" },
        ],
      },
    };
  }, [client, activePlatform]);

  const currentChartConfig = chartConfigs[activeTab] || chartConfigs["Content Counts"];


  const platformLabel = activePlatform === 'tiktok' ? 'TikTok' : (activePlatform === 'instagram' ? 'Instagram' : 'Facebook');

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
  const [showCopied, setShowCopied] = useState(false);

  const handleShare = async () => {
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
    <section className="w-full max-w-full overflow-hidden">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight text-[#191c1d]">
            {client.name}: {platformLabel} Insights
          </h1>

          <p className="font-medium text-[#727782]">
            Performance monitoring and content velocity analytics for your network.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleShare}
            disabled={shareLoading}
            className="flex h-11 items-center gap-2 sm:gap-3 rounded-full border border-[#c2c6d3]/20 bg-[#f3f4f5]/50 px-4 sm:px-5 font-bold text-[#003870] transition-all hover:bg-[#f3f4f5] active:scale-95 disabled:opacity-50"
          >
            {shareLoading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#003870] border-t-transparent"></div>
            ) : showCopied ? (
              <div className="flex items-center gap-2 text-[#003870] animate-in fade-in zoom-in duration-300">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-base sm:text-lg">Copied!</span>
              </div>
            ) : (
              <>
                <svg className="h-4 w-4 text-[#003870]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                <span className="text-base sm:text-lg">Share</span>
              </>
            )}
          </button>
          <DateRangeSelector selectedRange={timeRange} onRangeChange={setTimeRange} />
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
            title={currentChartConfig.title}
            subtitle={currentChartConfig.subtitle}
            data={chartData}
            metrics={currentChartConfig.metrics}
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
              data={insightData}
              platform={activePlatform}
              timeRange={timeRange}
              followersCount={activePlatform === 'tiktok' ? platformStats.tiktok?.follower_count : null}
            />

          )}
        </div>

        <div className="col-span-12 space-y-8 lg:col-span-3 min-w-0">

          <OverviewMetricsCard 
            platform={activePlatform} 
            timeRange={timeRange}
            allData={
              activePlatform === 'tiktok' 
                ? [platformStats.tiktok] 
                : insightData
            } 
          />

          <InitializePartnerCard />
          <SystemHealthCard />
        </div>

      </div>
    </section>
  );
}
