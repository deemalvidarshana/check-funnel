import React, { useCallback, useState, useEffect, useMemo } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { CalendarCheck } from 'lucide-react';
import MetricCards from '../../components/competitors/MetricCards';
import AverageViewsChart from '../../components/competitors/AverageViewsChart';
import RecentPostPerformanceChart from '../../components/competitors/RecentPostPerformanceChart';
import CompetitiveBenchmarkTable from '../../components/competitors/CompetitiveBenchmarkTable';
import TopPerformingContent from '../../components/competitors/TopPerformingContent';
import TopVideosTable from '../../components/competitors/TopVideosTable';
import FollowersVsAvgViewsChart from '../../components/competitors/FollowersVsAvgViewsChart';
import { getPublicClientInfo, getPublicCompetitorSummary, getPublicCompetitorPosts } from '../../api/publicInsights';
import {
  averageMetricValue,
  canUseApifyVideoViewsMetric,
  postMetricValue,
  postsForMetric,
  topMetricValue,
} from '../../utils/apifyVideoMetrics';

// ─── Helper: format numbers ─────────────────────────────
function fmt(n) {
  if (n == null) return '0';
  return Number(n).toLocaleString();
}

function ordinal(n) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function accountKeyFromSummary(summaryItem) {
  return String(summaryItem?.accountId ?? summaryItem?.id ?? summaryItem?.username ?? '');
}

function accountKeyFromPost(post) {
  return String(
    post?.trackedAccount?.id ??
    post?.trackedAccountId ??
    post?.apifyTrackedAccountId ??
    post?.trackedAccount?.username ??
    ''
  );
}

function competitorLabel(competitor) {
  return competitor?.displayName || competitor?.username || 'Unknown';
}

const BOOK_NOW_URL = 'https://check-funnel.odoo.com/appointment/14?invite_token=1beca73c5cfd4ad3bd269ef45c1eabe7&filter_appointment_type_ids=%5B14%5D&';

export default function PublicCompetitorReport() {
  const { shareToken } = useParams();
  const location = useLocation();
  const queryMethod = new URLSearchParams(location.search).get('method');
  const [activeTab, setActiveTab] = useState('TikTok');
  const [client, setClient] = useState(null);
  const [posts, setPosts] = useState([]);
  const [summary, setSummary] = useState([]);
  const [selectedCompetitor, setSelectedCompetitor] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [audienceMetricMode, setAudienceMetricMode] = useState('engagement');

  const [dateRange, setDateRange] = useState('all');
  const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);
  const [isCompetitorDropdownOpen, setIsCompetitorDropdownOpen] = useState(false);

  const platformKey = activeTab.toLowerCase().replace(' ', '');
  const effectiveAnalyzeMethod = queryMethod === 'apify' ? 'apify' : 'upload';
  const canUseVideoViewsMetric = canUseApifyVideoViewsMetric(platformKey, effectiveAnalyzeMethod);
  const activePerformanceMode = canUseVideoViewsMetric
    ? audienceMetricMode
    : (platformKey === 'instagram' || platformKey === 'facebook') ? 'engagement' : 'views';
  const toggleAudienceMetricMode = useCallback(() => {
    setAudienceMetricMode(mode => (mode === 'engagement' ? 'videoViews' : 'engagement'));
  }, []);

  // Load client info
  useEffect(() => {
    async function loadClient() {
      try {
        const data = await getPublicClientInfo(shareToken);
        setClient(data);
      } catch (e) {
        console.error("Failed to load client", e);
        setError("This report is no longer available or the link is invalid.");
      }
    }
    if (shareToken) loadClient();
  }, [shareToken]);

  useEffect(() => {
    if (!canUseVideoViewsMetric) {
      setAudienceMetricMode('engagement');
    }
  }, [canUseVideoViewsMetric]);

  // Fetch data when platform changes
  useEffect(() => {
    async function fetchData() {
      if (!client) return;
      setLoading(true);
      try {
        const [postsRes, summaryRes] = await Promise.all([
          getPublicCompetitorPosts(shareToken, platformKey, queryMethod),
          getPublicCompetitorSummary(shareToken, platformKey, queryMethod),
        ]);
        setPosts(postsRes);
        setSummary(summaryRes);
        setSelectedCompetitor('all');
      } catch (e) {
        console.error("Failed to fetch competitor data", e);
        setPosts([]);
        setSummary([]);
      } finally {
        setLoading(false);
      }
    }
    if (client) fetchData();
  }, [client, platformKey, shareToken, queryMethod]);

  // ─── Derived Data ──────────────────────────────────────
  const competitors = useMemo(() => {
    return summary.map(s => ({
      accountKey: accountKeyFromSummary(s),
      username: s.username,
      displayName: s.displayName || s.username,
      followerCount: Number(s.followerCount) || 0,
    }));
  }, [summary]);

  const availableRanges = useMemo(() => {
    if (!posts.length) return [];
    const uniqueLabels = [...new Set(posts.map(p => p.syncRangeLabel).filter(Boolean))];
    return uniqueLabels.map(label => ({
      key: label,
      label: label
    }));
  }, [posts]);

  const postsFilteredByDate = useMemo(() => {
    if (dateRange === 'all') return posts;
    return posts.filter(p => p.syncRangeLabel === dateRange);
  }, [posts, dateRange]);

  const filteredPosts = useMemo(() => {
    if (selectedCompetitor === 'all') return postsFilteredByDate;
    return postsFilteredByDate.filter(p => accountKeyFromPost(p) === selectedCompetitor);
  }, [postsFilteredByDate, selectedCompetitor]);

  const selectedSummary = useMemo(() => {
    const relevantPosts = selectedCompetitor === 'all' 
      ? postsFilteredByDate 
      : postsFilteredByDate.filter(p => accountKeyFromPost(p) === selectedCompetitor);

    const metrics = {
      totalPosts: relevantPosts.length,
      totalViews: relevantPosts.reduce((a, p) => a + (p.views || 0), 0),
      totalLikes: relevantPosts.reduce((a, p) => a + (p.likes || 0), 0),
      totalComments: relevantPosts.reduce((a, p) => a + (p.commentsCount || 0), 0),
      totalShares: relevantPosts.reduce((a, p) => a + (p.shares || 0), 0),
      followerCount: summary.reduce((a, s) => {
        if (selectedCompetitor === 'all' || accountKeyFromSummary(s) === selectedCompetitor) {
          return a + (Number(s.followerCount) || 0);
        }
        return a;
      }, 0)
    };

    return metrics;
  }, [postsFilteredByDate, summary, selectedCompetitor]);

  const filteredCompetitorSummaries = useMemo(() => {
    const competitorMap = {};
    postsFilteredByDate.forEach(p => {
      const accountKey = accountKeyFromPost(p);
      const username = p.trackedAccount?.username || accountKey;
      if (!accountKey) return;
      if (!competitorMap[accountKey]) {
        competitorMap[accountKey] = {
          accountKey,
          username,
          displayName: p.trackedAccount?.displayName || username,
          totalPosts: 0, totalViews: 0, totalLikes: 0, totalComments: 0, totalShares: 0
        };
      }
      competitorMap[accountKey].totalPosts++;
      competitorMap[accountKey].totalViews += (p.views || 0);
      competitorMap[accountKey].totalLikes += (p.likes || 0);
      competitorMap[accountKey].totalComments += (p.commentsCount || 0);
      competitorMap[accountKey].totalShares += (p.shares || 0);
    });

    return summary.map(s => {
      const accountKey = accountKeyFromSummary(s);
      const filtered = competitorMap[accountKey] || {
        accountKey, username: s.username, displayName: s.displayName,
        totalPosts: 0, totalViews: 0, totalLikes: 0, totalComments: 0, totalShares: 0
      };
      return {
        ...filtered,
        accountKey,
        followerCount: s.followerCount
      };
    });
  }, [postsFilteredByDate, summary]);

  const metricCardsData = useMemo(() => {
    const metricMode = activePerformanceMode;
    const metricPosts = postsForMetric(filteredPosts, metricMode);
    const avgMetricValue = averageMetricValue(filteredPosts, metricMode);
    const topMetric = topMetricValue(filteredPosts, metricMode);

    const ranked = filteredCompetitorSummaries
      .map(s => {
        const accountPosts = postsFilteredByDate.filter(p => accountKeyFromPost(p) === s.accountKey);
        const score = averageMetricValue(accountPosts, metricMode);
        return { accountKey: s.accountKey, score };
      })
      .sort((a, b) => b.score - a.score);
    const totalCompetitors = ranked.length;
    let rank = totalCompetitors;
    if (selectedCompetitor !== 'all') {
      const idx = ranked.findIndex(r => r.accountKey === selectedCompetitor);
      rank = idx >= 0 ? idx + 1 : totalCompetitors;
    }

    const isVideoViewsMode = metricMode === 'videoViews';
    const isEngagementMode = metricMode === 'engagement';
    const totalContentLabel = isVideoViewsMode ? "Total Videos" : "Total Posts";
    const totalContentCount = metricPosts.length;
    const avgLabel = isVideoViewsMode ? "Avg Views/Video" : isEngagementMode ? "Avg Eng./Post" : "Avg Views/Post";
    const topLabel = isVideoViewsMode ? "Top Video Views" : isEngagementMode ? "Top Post Eng." : "Top Post Views";
    const metricIcon = isEngagementMode ? "message" : "play";
    const metricToggle = canUseVideoViewsMetric ? {
      onPrev: toggleAudienceMetricMode,
      onNext: toggleAudienceMetricMode,
      toggleLabel: isVideoViewsMode ? 'Show average engagement' : 'Show average video views',
    } : {};

    return [
      { title: "Followers", value: fmt(selectedSummary.followerCount), icon: "users", progress: (selectedSummary.followerCount / 3500) * 100, change: "12%", isPositive: true },
      { title: totalContentLabel, value: fmt(totalContentCount), icon: "video", progress: (totalContentCount / 50) * 100, change: "8%", isPositive: true },
      { title: avgLabel, value: fmt(avgMetricValue), icon: metricIcon, progress: (avgMetricValue / 3500) * 100, change: "15%", isPositive: true, ...metricToggle },
      { title: topLabel, value: fmt(topMetric), icon: "flame", progress: (topMetric / 15000) * 100, change: "5%", isPositive: false },
      { title: "Competitive Rank", value: selectedCompetitor === 'all' ? `${totalCompetitors} tracked` : `${ordinal(rank)} / ${totalCompetitors}`, icon: "trophy", progress: ((totalCompetitors - rank + 1) / totalCompetitors) * 100, change: "0", isPositive: rank <= 3 }
    ];
  }, [
    activePerformanceMode,
    canUseVideoViewsMetric,
    filteredCompetitorSummaries,
    filteredPosts,
    postsFilteredByDate,
    selectedCompetitor,
    selectedSummary,
    toggleAudienceMetricMode,
  ]);

  const multiMetricData = useMemo(() => {
    return filteredCompetitorSummaries.map((s) => {
      const tp = s.totalPosts || 1;
      const accountPosts = posts.filter(p => accountKeyFromPost(p) === s.accountKey);
      const accountDatePosts = postsFilteredByDate.filter(p => accountKeyFromPost(p) === s.accountKey);
      const totalSaves = accountPosts.reduce((acc, p) => acc + (Number(p.rawExtensionData?.saves) || 0), 0);
      const totalEng = (Number(s.totalLikes) || 0) + (Number(s.totalComments) || 0) + (Number(s.totalShares) || 0);
      
      return {
        accountKey: s.accountKey,
        username: s.username,
        displayName: s.displayName,
        brand: s.displayName || s.username,
        isMain: s.accountKey === selectedCompetitor,
        views: tp > 0 ? Math.round(Number(s.totalViews) / tp) : 0,
        engagement: tp > 0 ? Math.round(totalEng / tp) : 0,
        videoViews: averageMetricValue(accountDatePosts, 'videoViews'),
        followers: Number(s.followerCount) || 0,
        likes: tp > 0 ? Math.round(Number(s.totalLikes) / tp) : 0,
        comments: tp > 0 ? Math.round(Number(s.totalComments) / tp) : 0,
        shares: tp > 0 ? Math.round(Number(s.totalShares) / tp) : 0,
        saves: tp > 0 ? Math.round(totalSaves / tp) : 0,
      };
    });
  }, [posts, postsFilteredByDate, selectedCompetitor, filteredCompetitorSummaries]);

  const recentPostPerformanceData = useMemo(() => {
    return summary.map(s => {
      const accountKey = accountKeyFromSummary(s);
      const brandPosts = postsForMetric(postsFilteredByDate, activePerformanceMode)
        .filter(p => accountKeyFromPost(p) === accountKey && p.createdAt)
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

      return {
        accountKey,
        brand: s.displayName || s.username,
        username: s.username,
        isMain: accountKey === selectedCompetitor,
        data: brandPosts.map(p => {
          const totalEng = (Number(p.likes) || 0) + (Number(p.commentsCount) || 0) + (Number(p.shares) || 0);
          return {
            date: new Date(p.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            value: activePerformanceMode === 'engagement' ? totalEng : postMetricValue(p, activePerformanceMode),
          };
        })
      };
    }).filter(group => group.data.length > 0);
  }, [summary, postsFilteredByDate, selectedCompetitor, activePerformanceMode]);

  const competitiveBenchmarkData = useMemo(() => {
    return summary
      .map(s => {
        const accountKey = accountKeyFromSummary(s);
        const accountPosts = postsForMetric(
          postsFilteredByDate.filter(p => accountKeyFromPost(p) === accountKey),
          activePerformanceMode
        );
        const tp = accountPosts.length;

        const avgValue = averageMetricValue(accountPosts, activePerformanceMode);
        const topValue = topMetricValue(accountPosts, activePerformanceMode);

        return {
          brand: s.displayName || s.username,
          followers: Number(s.followerCount) > 0 ? fmt(s.followerCount) : '-',
          avgValue: fmt(avgValue),
          topValue: fmt(topValue),
          postsPerMonth: tp > 0 ? `${tp} ${activePerformanceMode === 'videoViews' ? 'videos' : 'posts'}` : '0',
          rank: '',
          isMain: accountKey === selectedCompetitor,
          _sortValue: avgValue,
        };
      })
      .sort((a, b) => b._sortValue - a._sortValue)
      .map((row, idx) => ({ ...row, rank: ordinal(idx + 1) }));
  }, [summary, postsFilteredByDate, selectedCompetitor, activePerformanceMode]);

  const selectedCompetitorLabel = useMemo(() => {
    if (selectedCompetitor === 'all') return 'All Competitors';
    const competitor = competitors.find(c => c.accountKey === selectedCompetitor);
    return competitor ? competitorLabel(competitor) : selectedCompetitor;
  }, [competitors, selectedCompetitor]);

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f8f9fa]">
        <div className="text-center p-12 bg-white rounded-3xl shadow-xl max-w-md border border-[#ffdad6]">
           <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
           </div>
           <h2 className="text-2xl font-bold text-[#191c1d] mb-4">Report Unavailable</h2>
           <p className="text-[#727782] mb-0">{error}</p>
        </div>
      </div>
    );
  }

  if (loading && !client) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f8f9fa]">
        <p className="text-lg font-bold text-[#727782] animate-pulse uppercase tracking-widest">Validating Access...</p>
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
               {client?.logoData ? (
                 <img 
                   src={`${import.meta.env.VITE_API_BASE_URL || '/api'}/public-insights/logo/${shareToken}`} 
                   alt={client.name}
                   className="w-full h-full object-cover"
                 />
               ) : (
                 <div className="w-full h-full bg-[#003870] flex items-center justify-center text-white text-2xl sm:text-3xl font-black">
                    {client?.name?.charAt(0)}
                  </div>
               )}
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-[#191c1d] mb-1 leading-tight">
                {client?.name}: Competitor Analysis
              </h1>
              <p className="font-bold text-[10px] text-[#727782] uppercase tracking-[0.2em]">
                Comparative Performance Report
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
             <div className="bg-white px-4 py-2 rounded-2xl border border-slate-200/60 shadow-sm flex items-center justify-center gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">Read Only Mode</span>
            </div>
          </div>
        </header>

        {/* Controls */}
        {/* Controls */}
        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex overflow-x-auto no-scrollbar whitespace-nowrap items-center gap-1 rounded-full bg-[#f3f4f5] p-1 self-center lg:self-start">
            {['Facebook', 'Instagram', 'TikTok'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-shrink-0 rounded-full px-5 py-2 text-xs sm:text-sm transition ${
                  activeTab === tab 
                    ? 'bg-[#003870] font-semibold text-white shadow-sm' 
                    : 'font-medium text-[#727782] hover:bg-[#e7e8e9]'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-center sm:justify-start gap-2 sm:gap-3 flex-wrap">
            {/* Competitor Dropdown */}
            {competitors.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setIsCompetitorDropdownOpen(!isCompetitorDropdownOpen)}
                  className="flex h-11 items-center gap-2 sm:gap-3 rounded-full border border-[#c2c6d3]/20 bg-white px-4 sm:px-5 font-bold text-[#003870] transition-all hover:bg-[#f3f4f5] shadow-sm"
                >
                  <span className="text-xs sm:text-sm">
                    {selectedCompetitorLabel}
                  </span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className={`text-[#727782] transition-transform ${isCompetitorDropdownOpen ? "rotate-180" : ""}`}>
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
                {isCompetitorDropdownOpen && (
                  <div className="absolute left-0 lg:right-0 top-full z-50 mt-2 w-64 max-h-64 overflow-y-auto rounded-2xl border border-[#c2c6d3]/20 bg-white shadow-xl animate-in fade-in slide-in-from-top-1 duration-200 no-scrollbar">
                    <button onClick={() => { setSelectedCompetitor('all'); setIsCompetitorDropdownOpen(false); }} className={`w-full px-4 py-3 text-left text-sm font-bold transition hover:bg-[#f3f4f5] ${selectedCompetitor === 'all' ? "text-[#003870] bg-[#003870]/5" : "text-[#727782]"}`}>All Competitors</button>
                    {competitors.map((c) => (
                      <button key={c.accountKey} onClick={() => { setSelectedCompetitor(c.accountKey); setIsCompetitorDropdownOpen(false); }} className={`w-full px-4 py-3 text-left text-sm font-bold transition hover:bg-[#f3f4f5] ${selectedCompetitor === c.accountKey ? "text-[#003870] bg-[#003870]/5" : "text-[#727782]"}`}>{competitorLabel(c)}</button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Date Range Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsDateDropdownOpen(!isDateDropdownOpen)}
                className="flex h-11 items-center gap-2 sm:gap-3 rounded-full border border-[#c2c6d3]/20 bg-white px-4 sm:px-5 font-bold text-[#003870] transition-all hover:bg-[#f3f4f5] shadow-sm"
              >
                <span className="text-xs sm:text-sm whitespace-nowrap">{dateRange === 'all' ? 'All Time' : dateRange}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className={`text-[#727782] transition-transform ${isDateDropdownOpen ? "rotate-180" : ""}`}>
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              {isDateDropdownOpen && (
                <div className="absolute right-0 top-full z-50 mt-2 w-56 max-h-64 overflow-y-auto rounded-2xl border border-[#c2c6d3]/20 bg-white shadow-xl animate-in fade-in slide-in-from-top-1 duration-200 no-scrollbar">
                  <button onClick={() => { setDateRange('all'); setIsDateDropdownOpen(false); }} className={`w-full px-4 py-3 text-left text-sm font-bold transition hover:bg-[#f3f4f5] ${dateRange === 'all' ? "text-[#003870] bg-[#003870]/5" : "text-[#727782]"}`}>All Time</button>
                  {availableRanges.map((m) => (
                    <button key={m.key} onClick={() => { setDateRange(m.key); setIsDateDropdownOpen(false); }} className={`w-full px-4 py-3 text-left text-sm font-bold transition hover:bg-[#f3f4f5] ${dateRange === m.key ? "text-[#003870] bg-[#003870]/5" : "text-[#727782]"}`}>{m.label}</button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Dashboard Content */}
        {loading ? (
          <div className="flex h-96 items-center justify-center">
            <div className="h-10 w-10 border-4 border-[#003870]/20 border-t-[#003870] rounded-full animate-spin" />
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center bg-white rounded-3xl border border-[#c2c6d3]/30 p-16 text-center">
            <h3 className="text-lg font-bold text-[#191c1d] mb-2">No data yet</h3>
            <p className="text-sm text-[#727782] mb-6 max-w-md">There is no data available for the selected platform yet.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <MetricCards data={metricCardsData} showProgress={false} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AverageViewsChart
                data={multiMetricData}
                activeTab={activeTab}
                performanceMode={activePerformanceMode}
                enableVideoViewsMetric={canUseVideoViewsMetric}
              />
              <RecentPostPerformanceChart
                data={recentPostPerformanceData}
                selectedCompetitor={selectedCompetitor}
                activeTab={activeTab}
                performanceMode={activePerformanceMode}
              />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <CompetitiveBenchmarkTable
                data={competitiveBenchmarkData}
                activeTab={activeTab}
                performanceMode={activePerformanceMode}
              />
              <FollowersVsAvgViewsChart
                data={multiMetricData}
                selectedCompetitor={selectedCompetitor}
                activeTab={activeTab}
                performanceMode={activePerformanceMode}
              />
            </div>
            <TopPerformingContent allPosts={postsFilteredByDate} competitors={competitors} />
            <TopVideosTable allPosts={postsFilteredByDate} competitors={competitors} />

            {/* Branding Banner */}
            <div className="p-6 sm:p-10 rounded-[32px] bg-[linear-gradient(135deg,#003870_0%,#005cb8_100%)] text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 transition-transform group-hover:scale-110 duration-1000"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24 transition-transform group-hover:scale-110 duration-1000"></div>
              
              <div className="relative z-10 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                  <h4 className="text-xl sm:text-2xl font-black tracking-tight">Check Funnel</h4>
                  <div className="px-2 py-0.5 rounded-md bg-white/10 border border-white/20 text-[8px] font-bold tracking-widest uppercase">
                    Verified
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-blue-100 font-medium opacity-80 max-w-sm">
                  End-to-end performance marketing & content strategy optimization platform.
                </p>
                
                <div className="flex flex-col sm:flex-row items-center md:items-start justify-center md:justify-start gap-x-6 gap-y-3 mt-4 pt-4 border-t border-white/10">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-blue-300">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                      </svg>
                    </div>
                    <span className="text-[11px] font-bold text-white">+94 77 780 9062</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-blue-300">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                        <polyline points="22,6 12,13 2,6" />
                      </svg>
                    </div>
                    <span className="text-[11px] font-bold text-white">mail@checkfunnel.com</span>
                  </div>
                </div>
              </div>

              <a
                href={BOOK_NOW_URL}
                target="_blank"
                rel="noreferrer"
                className="relative z-10 inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-white px-6 text-sm font-black text-[#003870] shadow-lg transition hover:bg-blue-50 active:scale-95"
              >
                <CalendarCheck className="h-4 w-4" strokeWidth={2.5} />
                <span>Book Now</span>
              </a>
            </div>
          </div>
        )}
      </div>

      <div className="text-center py-10 px-4 opacity-40">
        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.3em] mb-1">Powered by</p>
        <span className="text-lg font-black text-[#003870] tracking-tighter">CHECK FUNNEL</span>
      </div>
    </div>
  );
}
