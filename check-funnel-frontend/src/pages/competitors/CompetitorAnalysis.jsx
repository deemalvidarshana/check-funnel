import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import MetricCards from '../../components/competitors/MetricCards';
import AverageViewsChart from '../../components/competitors/AverageViewsChart';
import RecentPostPerformanceChart from '../../components/competitors/RecentPostPerformanceChart';
import CompetitiveBenchmarkTable from '../../components/competitors/CompetitiveBenchmarkTable';
import TopPerformingContent from '../../components/competitors/TopPerformingContent';
import TopVideosTable from '../../components/competitors/TopVideosTable';
import CSVUploadModal from '../../components/competitors/CSVUploadModal';
import FollowersVsAvgViewsChart from '../../components/competitors/FollowersVsAvgViewsChart';
import { getClientById } from '../../api/client';
import api from '../../api';

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

export default function CompetitorAnalysis() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('TikTok');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isCompetitorDropdownOpen, setIsCompetitorDropdownOpen] = useState(false);
  const [clientName, setClientName] = useState('');
  const [posts, setPosts] = useState([]);
  const [summary, setSummary] = useState([]);
  const [selectedCompetitor, setSelectedCompetitor] = useState('all');
  const [loading, setLoading] = useState(true);

  const platformKey = activeTab.toLowerCase().replace(' ', '');

  // Load client name
  useEffect(() => {
    async function loadClient() {
      try {
        const client = await getClientById(id);
        setClientName(client.name);
      } catch (e) {
        console.error("Failed to load client", e);
      }
    }
    if (id) loadClient();
  }, [id]);

  // Fetch data when platform changes
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [postsRes, summaryRes] = await Promise.all([
          api.get(`/competitors/${id}/posts?platform=${platformKey}`),
          api.get(`/competitors/${id}/summary?platform=${platformKey}`),
        ]);
        setPosts(postsRes.data);
        setSummary(summaryRes.data);
        setSelectedCompetitor('all');
      } catch (e) {
        console.error("Failed to fetch competitor data", e);
        setPosts([]);
        setSummary([]);
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchData();
  }, [id, platformKey]);

  // Refresh data after upload
  const handleUploadClose = () => {
    setIsUploadOpen(false);
    // Re-fetch data
    async function refetch() {
      try {
        const [postsRes, summaryRes] = await Promise.all([
          api.get(`/competitors/${id}/posts?platform=${platformKey}`),
          api.get(`/competitors/${id}/summary?platform=${platformKey}`),
        ]);
        setPosts(postsRes.data);
        setSummary(summaryRes.data);
      } catch (e) { /* ignore */ }
    }
    refetch();
  };

  // ─── Derived Data ──────────────────────────────────────
  const competitors = useMemo(() => {
    return summary.map(s => ({
      username: s.username,
      displayName: s.displayName || s.username,
      followerCount: Number(s.followerCount) || 0,
    }));
  }, [summary]);

  // Filter posts by selected competitor
  const filteredPosts = useMemo(() => {
    if (selectedCompetitor === 'all') return posts;
    return posts.filter(p => p.trackedAccount?.username === selectedCompetitor);
  }, [posts, selectedCompetitor]);

  // Selected competitor's summary or aggregated
  const selectedSummary = useMemo(() => {
    if (selectedCompetitor === 'all') {
      // Aggregate all
      return {
        totalPosts: posts.length,
        totalViews: posts.reduce((a, p) => a + (p.views || 0), 0),
        totalLikes: posts.reduce((a, p) => a + (p.likes || 0), 0),
        totalComments: posts.reduce((a, p) => a + (p.commentsCount || 0), 0),
        totalShares: posts.reduce((a, p) => a + (p.shares || 0), 0),
        followerCount: summary.reduce((a, s) => a + (Number(s.followerCount) || 0), 0),
      };
    }
    const s = summary.find(s => s.username === selectedCompetitor);
    if (!s) return { totalPosts: 0, totalViews: 0, totalLikes: 0, totalComments: 0, totalShares: 0, followerCount: 0 };
    return {
      totalPosts: Number(s.totalPosts) || 0,
      totalViews: Number(s.totalViews) || 0,
      totalLikes: Number(s.totalLikes) || 0,
      totalComments: Number(s.totalComments) || 0,
      totalShares: Number(s.totalShares) || 0,
      followerCount: Number(s.followerCount) || 0,
    };
  }, [posts, summary, selectedCompetitor]);

  // ─── Metric Cards (dynamic) ────────────────────────────
  const metricCardsData = useMemo(() => {
    const platform = activeTab?.toLowerCase();
    const isAudienceBased = platform === 'instagram' || platform === 'facebook';
    
    const totalPosts = selectedSummary.totalPosts || 1;
    const avgViews = Math.round(selectedSummary.totalViews / totalPosts);
    const avgLikes = Math.round(selectedSummary.totalLikes / totalPosts);
    const topViews = filteredPosts.length > 0
      ? Math.max(...filteredPosts.map(p => p.views || 0))
      : 0;

    // Calculate rank among competitors (by avg views or engagement)
    const ranked = summary
      .map(s => {
        const tp = Number(s.totalPosts) || 0;
        let score = 0;
        if (isAudienceBased) {
          const totalEng = (Number(s.totalLikes) || 0) + (Number(s.totalComments) || 0) + (Number(s.totalShares) || 0);
          score = tp > 0 ? totalEng / tp : 0;
        } else {
          score = tp > 0 ? Number(s.totalViews) / tp : 0;
        }
        return { username: s.username, score };
      })
      .sort((a, b) => b.score - a.score);
    const totalCompetitors = ranked.length;
    let rank = totalCompetitors;
    if (selectedCompetitor !== 'all') {
      const idx = ranked.findIndex(r => r.username === selectedCompetitor);
      rank = idx >= 0 ? idx + 1 : totalCompetitors;
    }


    
    // Dynamic Metric Labels & Icons
    const avgLabel = isAudienceBased ? "Avg Eng./Post" : "Avg Views/Post";
    const topLabel = isAudienceBased ? "Top Post Eng." : "Top Post Views";
    const metricIcon = isAudienceBased ? "message" : "play";

    // Dynamic Metric Values
    let avgMetricValue = avgViews;
    let topMetricValue = topViews;

    if (isAudienceBased) {
      const totalEng = (Number(selectedSummary.totalLikes) || 0) + (Number(selectedSummary.totalComments) || 0) + (Number(selectedSummary.totalShares) || 0);
      const tp = Number(selectedSummary.totalPosts) || 0;
      avgMetricValue = tp > 0 ? Math.round(totalEng / tp) : 0;
      
      // Top Engagement per post - Use filteredPosts which already handles the platform and competitor filter
      topMetricValue = filteredPosts.length > 0 
        ? Math.max(...filteredPosts.map(p => (p.likes || 0) + (p.commentsCount || 0) + (p.shares || 0))) 
        : 0;
    }

    return [
      {
        title: "Followers",
        value: fmt(selectedSummary.followerCount),
        icon: "users",
        targetValue: "3.5K",
        progress: (selectedSummary.followerCount / 3500) * 100,
        change: "12%",
        isPositive: true
      },
      {
        title: "Total Posts",
        value: fmt(selectedSummary.totalPosts),
        icon: "video",
        targetValue: "50",
        progress: (selectedSummary.totalPosts / 50) * 100,
        change: "8%",
        isPositive: true
      },
      {
        title: avgLabel,
        value: fmt(avgMetricValue),
        icon: metricIcon,
        targetValue: "3.5K",
        progress: (avgMetricValue / 3500) * 100,
        change: "15%",
        isPositive: true
      },
      {
        title: topLabel,
        value: fmt(topMetricValue),
        icon: "flame",
        targetValue: "15K",
        progress: (topMetricValue / 15000) * 100,
        change: "5%",
        isPositive: false
      },
      {
        title: "Competitive Rank",
        value: selectedCompetitor === 'all' ? `${totalCompetitors} tracked` : `${ordinal(rank)} / ${totalCompetitors}`,
        icon: "trophy",
        targetValue: "1st",
        progress: ((totalCompetitors - rank + 1) / totalCompetitors) * 100,
        change: "0",
        isPositive: rank <= 3
      }
    ];
  }, [selectedSummary, filteredPosts, summary, selectedCompetitor, platformKey]);

  // ─── Multi-Metric Chart Data ───────────────────────────────
  const multiMetricData = useMemo(() => {
    return summary.map(s => {
      const tp = Number(s.totalPosts) || 0;
      const accountPosts = posts.filter(p => p.trackedAccount?.username === s.username);
      const totalSaves = accountPosts.reduce((acc, p) => acc + (Number(p.rawExtensionData?.saves) || 0), 0);
      const totalEng = (Number(s.totalLikes) || 0) + (Number(s.totalComments) || 0) + (Number(s.totalShares) || 0);
      
      return {
        brand: s.displayName || s.username,
        isMain: s.username === selectedCompetitor,
        views: tp > 0 ? Math.round(Number(s.totalViews) / tp) : 0,
        engagement: tp > 0 ? Math.round(totalEng / tp) : 0,
        followers: Number(s.followerCount) || 0,
        likes: tp > 0 ? Math.round(Number(s.totalLikes) / tp) : 0,
        comments: tp > 0 ? Math.round(Number(s.totalComments) / tp) : 0,
        shares: tp > 0 ? Math.round(Number(s.totalShares) / tp) : 0,
        saves: tp > 0 ? Math.round(totalSaves / tp) : 0,
      };
    });
  }, [summary, posts, selectedCompetitor]);

  // ─── Recent Post Performance (Grouped by Competitor) ───────────────────────────
  const recentPostPerformanceData = useMemo(() => {
    // We want an array where each item is { brand, posts: [...] }
    const brands = summary.map(s => s.username);
    
    return summary.map(s => {
      const brandPosts = posts
        .filter(p => p.trackedAccount?.username === s.username && p.createdAt)
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

      const platform = activeTab?.toLowerCase();
      const isAudienceBased = platform === 'instagram' || platform === 'facebook';

      return {
        brand: s.displayName || s.username,
        username: s.username,
        isMain: s.username === selectedCompetitor,
        data: brandPosts.map(p => {
          const totalEng = (Number(p.likes) || 0) + (Number(p.commentsCount) || 0) + (Number(p.shares) || 0);
          return {
            date: new Date(p.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            value: isAudienceBased ? totalEng : (Number(p.views) || 0),
          };
        })
      };
    }).filter(group => group.data.length > 0);
  }, [summary, posts, selectedCompetitor]);

  // ─── Competitive Benchmark Table ───────────────────────
  const competitiveBenchmarkData = useMemo(() => {
    return summary
      .map(s => {
        const tp = Number(s.totalPosts) || 0;
        const platform = activeTab?.toLowerCase();
        const isAudienceBased = platform === 'instagram' || platform === 'facebook';
        
        // Dynamic Metric Selection
        let avgValue = 0;
        let topValue = 0;

        const accountPosts = posts.filter(p => p.trackedAccount?.username === s.username);

        if (isAudienceBased) {
          const totalEng = (Number(s.totalLikes) || 0) + (Number(s.totalComments) || 0) + (Number(s.totalShares) || 0);
          avgValue = tp > 0 ? Math.round(totalEng / tp) : 0;
          topValue = accountPosts.length > 0 
            ? Math.max(...accountPosts.map(p => (Number(p.likes) || 0) + (Number(p.commentsCount) || 0) + (Number(p.shares) || 0))) 
            : 0;
        } else {
          avgValue = tp > 0 ? Math.round(Number(s.totalViews) / tp) : 0;
          topValue = accountPosts.length > 0 ? Math.max(...accountPosts.map(p => Number(p.views) || 0)) : 0;
        }

        return {
          brand: s.displayName || s.username,
          followers: Number(s.followerCount) > 0 ? fmt(s.followerCount) : '-',
          avgValue: fmt(avgValue),
          topValue: fmt(topValue),
          postsPerWeek: tp > 0 ? `${tp} posts` : '0',
          rank: '',
          isMain: s.username === selectedCompetitor,
          _sortValue: avgValue,
        };
      })
      .sort((a, b) => b._sortValue - a._sortValue)
      .map((row, idx) => ({ ...row, rank: ordinal(idx + 1) }));
  }, [summary, posts, selectedCompetitor, activeTab]);

  // ─── Top Performing Content (Array) ────────────────────
  const topPerformingContentData = useMemo(() => {
    if (filteredPosts.length === 0) return [];
    
    const platform = activeTab?.toLowerCase();
    const isAudienceBased = platform === 'instagram' || platform === 'facebook';

    // Get top 8 posts ranked by performance
    const topPosts = [...filteredPosts]
      .sort((a, b) => {
        const scoreA = isAudienceBased ? (Number(a.likes) || 0) + (Number(a.commentsCount) || 0) + (Number(a.shares) || 0) : (Number(a.views) || 0);
        const scoreB = isAudienceBased ? (Number(b.likes) || 0) + (Number(b.commentsCount) || 0) + (Number(b.shares) || 0) : (Number(b.views) || 0);
        return scoreB - scoreA;
      })
      .slice(0, 8);

    return topPosts.map(post => {
      const caption = post.rawExtensionData?.caption || post.rawExtensionData?.caption_text || post.rawExtensionData?.Description || '';
      return {
        id: post.id,
        title: caption.substring(0, 50) + (caption.length > 50 ? '...' : ''),
        brand: post.trackedAccount?.displayName || post.trackedAccount?.username || 'Unknown',
        views: fmt(post.views),
        likes: fmt(post.likes),
        comments: fmt(post.commentsCount),
        shares: fmt(post.shares),
        postUrl: post.postUrl,
        imageUrl: post.imageUrl,
        platform: post.platform,
      };
    });
  }, [filteredPosts, activeTab]);

  // ─── Top Videos Table ──────────────────────────────────
  const topVideosData = useMemo(() => {
    return [...filteredPosts]
      .sort((a, b) => (b.views || 0) - (a.views || 0))
      .slice(0, 10)
      .map((p, idx) => {
        const name = p.trackedAccount?.displayName || p.trackedAccount?.username || '';
        const caption = p.rawExtensionData?.caption || p.rawExtensionData?.caption_text || p.rawExtensionData?.Description || '';
        const total = (p.views || 0) + (p.likes || 0) + (p.commentsCount || 0) + (p.shares || 0);
        const engRate = p.views > 0 ? (((p.likes + p.commentsCount + p.shares) / p.views) * 100).toFixed(2) + '%' : '0%';
        return {
          rank: idx + 1,
          brand: name,
          brandInitial: name.charAt(0).toUpperCase(),
          views: fmt(p.views),
          likes: fmt(p.likes),
          comments: fmt(p.commentsCount),
          shares: fmt(p.shares),
          saves: fmt(p.rawExtensionData?.saves || 0),
          engRate,
          caption: caption.substring(0, 60) + (caption.length > 60 ? '...' : ''),
        };
      });
  }, [filteredPosts]);

  // ─── Loading State ─────────────────────────────────────
  if (loading) {
    return (
      <section className="w-full bg-[#f8f9fa] flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="h-10 w-10 border-4 border-[#003870]/20 border-t-[#003870] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm font-semibold text-[#727782]">Loading competitor data...</p>
        </div>
      </section>
    );
  }
  // ─── Sub-Components ──────────────────────────────────────
  const CompetitorActions = () => (
    <>
      {competitors.length > 0 && (
        <div className="relative">
          <button
            onClick={() => setIsCompetitorDropdownOpen(!isCompetitorDropdownOpen)}
            className="flex h-11 items-center gap-2 sm:gap-3 rounded-full border border-[#c2c6d3]/20 bg-[#f3f4f5]/50 px-4 sm:px-5 font-bold text-[#003870] transition-all hover:bg-[#f3f4f5]"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-[#003870]">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <span className="text-base sm:text-lg">
              {selectedCompetitor === 'all' ? 'All Competitors' : `@${selectedCompetitor}`}
            </span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className={`text-[#727782] transition-transform ${isCompetitorDropdownOpen ? "rotate-180" : ""}`}>
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {isCompetitorDropdownOpen && (
            <div className="absolute left-0 md:right-0 md:left-auto top-full z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-[#c2c6d3]/20 bg-white shadow-xl">
              <button
                onClick={() => {
                  setSelectedCompetitor('all');
                  setIsCompetitorDropdownOpen(false);
                }}
                className={`w-full px-4 py-3 text-left text-sm font-bold transition hover:bg-[#f3f4f5] ${
                  selectedCompetitor === 'all' ? "text-[#003870] bg-[#003870]/5" : "text-[#727782]"
                }`}
              >
                All Competitors
              </button>
              {competitors.map((c) => (
                <button
                  key={c.username}
                  onClick={() => {
                    setSelectedCompetitor(c.username);
                    setIsCompetitorDropdownOpen(false);
                  }}
                  className={`w-full px-4 py-3 text-left text-sm font-bold transition hover:bg-[#f3f4f5] ${
                    selectedCompetitor === c.username ? "text-[#003870] bg-[#003870]/5" : "text-[#727782]"
                  }`}
                >
                  @{c.username}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <button
        onClick={() => setIsUploadOpen(true)}
        className="flex h-11 items-center justify-center gap-2 rounded-full bg-[#003870] px-6 text-sm font-bold text-white shadow-md transition hover:bg-[#002d5a] active:scale-95"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" strokeLinecap="round" strokeLinejoin="round" />
          <polyline points="17,8 12,3 7,8" strokeLinecap="round" strokeLinejoin="round" />
          <line x1="12" y1="3" x2="12" y2="15" strokeLinecap="round" />
        </svg>
        <span>Upload Data</span>
      </button>
    </>
  );

  return (
    <section className="w-full bg-[#f8f9fa]">
      {/* Header Section */}
      <div className="flex flex-col mb-8 md:mb-10">
        {/* Row 1: Title & Desktop Actions */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 md:mb-2 gap-4">
          <h1 className="text-4xl tracking-tight text-[#191c1d] sm:text-5xl">
            <span className="font-extrabold">Competitor </span>
            <span className="font-medium">Analysis</span>
          </h1>

          {/* Actions - DESKTOP ONLY */}
          <div className="hidden md:flex items-center gap-3">
            <CompetitorActions />
          </div>
        </div>

        {/* Row 2: Sub-header, Mobile Actions & Platform Tabs */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8 md:gap-6">
          <div className="flex flex-col gap-6 md:gap-5">
            <p className="text-base leading-7 text-[#424751] sm:text-lg max-w-2xl">
              {clientName ? `Dashboard for ${clientName} — ` : ""}Track and analyze your competitors' performance across platforms.
            </p>

            {/* Actions - MOBILE ONLY (shown below text) */}
            <div className="flex md:hidden items-center gap-3">
              <CompetitorActions />
            </div>
          </div>

          <div className="flex overflow-x-auto no-scrollbar whitespace-nowrap items-center gap-2 rounded-full bg-[#f3f4f5] p-1 self-start lg:self-auto">
            {['Facebook', 'Instagram', 'TikTok'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-shrink-0 rounded-full px-5 py-2 text-sm transition ${
                  activeTab === tab 
                    ? 'bg-[#003870] font-semibold text-white shadow-sm' 
                    : 'font-medium text-[#727782] hover:bg-[#e7e8e9]'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mb-6" />

      {/* Empty State / Dashboard Content */}
      {posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center bg-white rounded-3xl border border-[#c2c6d3]/30 p-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#f3f4f5] flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-[#727782]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" strokeLinecap="round" strokeLinejoin="round" />
              <polyline points="17,8 12,3 7,8" strokeLinecap="round" strokeLinejoin="round" />
              <line x1="12" y1="3" x2="12" y2="15" strokeLinecap="round" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-[#191c1d] mb-2">No data yet</h3>
          <p className="text-sm text-[#727782] mb-6 max-w-md">
            Upload CSV data from your browser extensions to start analyzing competitor performance on {activeTab}.
          </p>
          <button
            onClick={() => setIsUploadOpen(true)}
            className="rounded-full bg-[linear-gradient(135deg,#003870_0%,#014f99_100%)] px-8 py-3 text-sm font-bold text-white shadow-lg transition hover:scale-[1.02] active:scale-95"
          >
            Upload {activeTab} Data
          </button>
        </div>
      ) : (
        <>
          {/* Metric Cards */}
          <MetricCards data={metricCardsData} />

          {/* Main Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <AverageViewsChart data={multiMetricData} activeTab={activeTab} />
            <RecentPostPerformanceChart data={recentPostPerformanceData} selectedCompetitor={selectedCompetitor} activeTab={activeTab} />
          </div>

          {/* Secondary Tables/Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <CompetitiveBenchmarkTable data={competitiveBenchmarkData} activeTab={activeTab} />
            <FollowersVsAvgViewsChart data={summary} selectedCompetitor={selectedCompetitor} activeTab={activeTab} />
          </div>

          {/* Top Performing Content (Full Width) */}
          <div className="mb-6">
            <TopPerformingContent 
              allPosts={posts} 
              competitors={competitors}
            />
          </div>

          {/* Bottom Table */}
          <TopVideosTable 
            allPosts={posts} 
            competitors={competitors}
          />
        </>
      )}

      {/* CSV Upload Modal */}
      <CSVUploadModal
        open={isUploadOpen}
        onClose={handleUploadClose}
        clientId={id}
        clientName={clientName}
      />
    </section>
  );
}
