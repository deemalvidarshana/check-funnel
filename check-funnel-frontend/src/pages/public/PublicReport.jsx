import { useState, useEffect, useMemo } from "react";
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
  getPublicTiktokInsights
} from "../../api/publicInsights";


export default function PublicReport() {
  const { shareToken } = useParams();

  const [activeTab, setActiveTab] = useState("Content Counts");
  const [activePlatform, setActivePlatform] = useState("facebook");
  const [timeRange, setTimeRange] = useState("7");
  const [client, setClient] = useState(null);
  const [insightData, setInsightData] = useState([]);
  const [platformStats, setPlatformStats] = useState({});
  const [loading, setLoading] = useState(true);

  const [insightsLoading, setInsightsLoading] = useState(false);
  const [error, setError] = useState(null);

  // 1. Fetch public client info
  useEffect(() => {
    const fetchInfo = async () => {
      setLoading(true);
      try {
        const data = await getPublicClientInfo(shareToken);
        
        // Normalize activeChannels strictly
        const channels = Array.isArray(data.activeChannels) 
          ? data.activeChannels 
          : (data.activeChannels || "").split(",").filter(Boolean).map(s => s.trim());
        
        const normalizedData = { ...data, activeChannels: channels };
        setClient(normalizedData);

        // Default to first active platform
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

  const generateWeeks = () => {
    const weeks = [];
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const currentMonday = new Date(today);
    currentMonday.setDate(today.getDate() - diffToMonday);

    // ✅ FIX: Use LOCAL date parts — toISOString() uses UTC which shifts
    // dates back 1 day for UTC+5:30 users (e.g. 1 Apr 00:00 IST = 31 Mar 18:30 UTC)
    const formatDate = (date) => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    };

    const currentWeekSince = new Date(currentMonday);
    const currentWeekUntil = new Date(today);
    weeks.push({ 
        label: `${currentWeekSince.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} - ${currentWeekUntil.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`, 
        since: formatDate(currentWeekSince), 
        until: formatDate(currentWeekUntil) 
    });

    let lastMonday = currentMonday;
    for (let i = 0; i < 6; i++) {
        const untilDate = new Date(lastMonday);
        untilDate.setDate(lastMonday.getDate() - 1);
        const sinceDate = new Date(untilDate);
        sinceDate.setDate(untilDate.getDate() - 6);
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

    // ✅ FIX: Use LOCAL date parts — toISOString() uses UTC which shifts
    // midnight local dates back 1 day for UTC+5:30 users.
    // e.g. new Date(2026, 3, 1) = 1 Apr 00:00 IST = 31 Mar 18:30 UTC
    // → toISOString gives "2026-03-31" but label shows "1 Apr" — MISMATCH!
    const formatDate = (date) => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    };

    for (let i = 0; i < 6; i++) {
        const sinceDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
        let untilDate;
        if (i === 0) {
            untilDate = new Date(today);
        } else {
            untilDate = new Date(today.getFullYear(), today.getMonth() - i + 1, 0);
        }
        const label = `${sinceDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} - ${untilDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`;
        months.push({ label, since: formatDate(sinceDate), until: formatDate(untilDate) });
    }
    return months.reverse();
  };

  // 2. Fetch insights
  useEffect(() => {
    const fetchData = async () => {
      if (!client) return;

      setInsightData([]); // Reset data to avoid stale property glitches when switching platforms
      
      const channels = Array.isArray(client.activeChannels) 
        ? client.activeChannels 
        : (client.activeChannels || "").split(",").filter(Boolean).map(s => s.trim());

      if (!channels.includes(activePlatform)) {
        setInsightData([]);
        return;
      }

      setInsightsLoading(true);
      try {
        if (activePlatform === "facebook") {
          const ranges = timeRange === "30" ? generateMonths() : generateWeeks();
          const results = await Promise.all(
            ranges.map(w => 
              getPublicFacebookInsights(shareToken, w.since, w.until)
                .then(res => ({ ...res, week: w.label }))
                .catch(() => ({ week: w.label, error: true }))
            )
          );
          setInsightData(results);
        } else if (activePlatform === "instagram") {
          const result = await getPublicInstagramInsights(shareToken, timeRange);
          setInsightData(result.weeks || []);
        } else if (activePlatform === "tiktok") {
          const result = await getPublicTiktokInsights(shareToken);
          setInsightData(result.videos || []);
          if (result.user) {
            setPlatformStats(prev => ({ ...prev, tiktok: result.user }));
          }
        } else {
          setInsightData([]);
        }

      } catch (err) {
        console.error("Failed to load insights", err);
        setInsightData([]);
      } finally {
        setInsightsLoading(false);
      }
    };
    fetchData();
  }, [client, activePlatform, timeRange, shareToken]);

  // NEW: Prepare specialized data for the chart (especially for TikTok)
  const chartData = useMemo(() => {
    if (activePlatform === 'tiktok') {
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


  const chartConfigs = useMemo(() => {
    const isIG = activePlatform === 'instagram';
    return {
      "Content Counts": {
        title: `Content Velocity`,
        subtitle: "Breakdown of published content volume",
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
          { key: isIG ? "content_interactions.total" : "content_interactions.interactions_total", label: "Interactions", color: "#003870" },
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
          { key: "like_count", label: "Likes", color: "#003870" },
        ],
      },
    };
  }, [activePlatform]);


  const currentChartConfig = chartConfigs[activeTab] || chartConfigs["Content Counts"];
  const fbTabsList = ["Content Counts", "Total Views", "Viewer Retention", "Engagement Metrics", "Audience Growth"];
  const igTabsList = ["Content Counts", "Total Views", "Audience Reach", "Engagement Metrics", "Audience Growth"];

  // Reset activeTab when platform changes to avoid invalid tab state
  useEffect(() => {
    // If returning from TikTok to FB/IG, default to 'Content Counts'
    if ((activePlatform === 'facebook' || activePlatform === 'instagram') && 
        (activeTab === 'Video Breakdown' || activeTab === 'Video Likes')) {
      setActiveTab('Content Counts');
    } 
    else if (activePlatform === 'instagram' && activeTab === 'Viewer Retention') {
      setActiveTab('Audience Reach');
    } else if (activePlatform === 'facebook' && activeTab === 'Audience Reach') {
      setActiveTab('Viewer Retention');
    }
    else if (activePlatform === 'tiktok') {
      if (!["Video Breakdown", "Video Likes"].includes(activeTab)) {
        setActiveTab('Video Breakdown');
      }
    }
  }, [activePlatform, activeTab]);

  const platformLabel = activePlatform === 'tiktok' ? 'TikTok' : (activePlatform === 'instagram' ? 'Instagram' : 'Facebook');
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
        {/* Header */}
        <header className="mb-8 sm:mb-12 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-[#f3f4f5] border border-[#c2c6d3]/30 flex items-center justify-center overflow-hidden shadow-lg flex-shrink-0">
              {client.logoData ? (
                <img 
                  src={`${import.meta.env.VITE_API_BASE_URL || '/api'}/public-insights/logo/${shareToken}`}
                  alt={client.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(client.name)}&background=003870&color=fff&size=128`;
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
            <DateRangeSelector selectedRange={timeRange} onRangeChange={setTimeRange} />
            <div className="h-4 w-[1px] bg-slate-200 hidden sm:block mx-1 opacity-50"></div>
            <div className="bg-white px-4 py-2 rounded-2xl border border-slate-200/60 shadow-sm flex items-center justify-center gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">Read Only Mode</span>
            </div>
          </div>
        </header>

        {/* Controls */}
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <MetricTabs activeTab={activeTab} setActiveTab={setActiveTab} platform={activePlatform} />
          <PlatformSelector activePlatform={activePlatform} setActivePlatform={setActivePlatform} activeChannels={client?.activeChannels} />
        </div>

        {/* Content */}
        <div className="grid grid-cols-12 gap-6 lg:gap-10">
          <div className="col-span-12 space-y-6 lg:col-span-9">
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
              <div className="flex h-80 items-center justify-center rounded-[32px] border border-dashed border-slate-200 bg-white/50 text-[#727782]">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-8 h-8 border-4 border-[#003870]/20 border-t-[#003870] rounded-full animate-spin"></div>
                  <p className="font-black text-[10px] uppercase tracking-widest">Syncing Data...</p>
                </div>
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

          <div className="col-span-12 space-y-10 lg:col-span-3">
            <OverviewMetricsCard 
              platform={activePlatform} 
              allData={activePlatform === 'tiktok' ? [platformStats.tiktok] : insightData} 
            />


            
            <div className="p-8 rounded-[32px] bg-[linear-gradient(135deg,#003870_0%,#005cb8_100%)] text-white shadow-2xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110 duration-700"></div>
               <h4 className="text-xl font-black mb-2 relative z-10 tracking-tight">Check Funnel</h4>
               <p className="text-xs text-blue-100 font-medium leading-relaxed mb-6 opacity-80 decoration-blue-300 underline-offset-4 underline decoration-2">
                 End-to-end performance marketing & content strategy optimization platform.
               </p>
               <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-[10px] font-bold tracking-widest uppercase">
                 Verified Report
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
