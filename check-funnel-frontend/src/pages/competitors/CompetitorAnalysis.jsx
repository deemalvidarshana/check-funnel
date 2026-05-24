import React, { useState, useEffect, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import MetricCards from '../../components/competitors/MetricCards';
import AverageViewsChart from '../../components/competitors/AverageViewsChart';
import RecentPostPerformanceChart from '../../components/competitors/RecentPostPerformanceChart';
import CompetitiveBenchmarkTable from '../../components/competitors/CompetitiveBenchmarkTable';
import TopPerformingContent from '../../components/competitors/TopPerformingContent';
import TopVideosTable from '../../components/competitors/TopVideosTable';
import CSVUploadModal from '../../components/competitors/CSVUploadModal';
import ApifyFetchModal from '../../components/competitors/ApifyFetchModal';
import FollowersVsAvgViewsChart from '../../components/competitors/FollowersVsAvgViewsChart';
import { getClientById, toggleShare } from '../../api/client';
import { canManageFeature } from '../../utils/permissions';
import { getSystemSettings } from '../../api/systemSettings';
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

// ─── Toast Component ──────────────────────────────────────
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const borderColor = type === "success" ? "border-[#003870]" : "border-[#93000a]";
  const iconColor = type === "success" ? "text-[#003870]" : "text-[#93000a]";

  return (
    <div className={`fixed top-10 right-10 z-[1000] flex items-center gap-3 px-5 py-4 rounded-2xl bg-white border-l-4 ${borderColor} shadow-[0_20px_40px_-10px_rgba(0,0,0,0.15)] animate-in slide-in-from-top-4 duration-300`}>
       <div className={`${iconColor}`}>
         {type === "success" ? (
           <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
           </svg>
         ) : (
           <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
           </svg>
         )}
       </div>
       <p className="text-base font-bold text-[#191c1d] tracking-tight">{message}</p>
    </div>
  );
}

export default function CompetitorAnalysis() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('TikTok');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isFetchOpen, setIsFetchOpen] = useState(false);
  const [isCompetitorDropdownOpen, setIsCompetitorDropdownOpen] = useState(false);
  const [clientName, setClientName] = useState('');
  const [posts, setPosts] = useState([]);
  const [summary, setSummary] = useState([]);
  const [selectedCompetitor, setSelectedCompetitor] = useState('all');
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [analyzeMethod, setAnalyzeMethod] = useState('upload');
  const [viewerAnalyzeMethod, setViewerAnalyzeMethod] = useState('upload');
  const [apifyDefaultLimit, setApifyDefaultLimit] = useState(100);
  const [toast, setToast] = useState(null);
  const [shareLoading, setShareLoading] = useState(false);
  const canManageCompetitors = canManageFeature('competitors');
  const [showCopied, setShowCopied] = useState(false);

  const [dateRange, setDateRange] = useState('all');
  const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);
  const [isViewerSourceDropdownOpen, setIsViewerSourceDropdownOpen] = useState(false);

  const platformKey = activeTab.toLowerCase().replace(' ', '');
  const effectiveAnalyzeMethod = canManageCompetitors ? analyzeMethod : viewerAnalyzeMethod;
  const viewerSourceOptions = [
    { value: 'upload', label: 'Upload' },
    { value: 'apify', label: 'Apify' },
  ];
  const viewerSourceLabel = viewerSourceOptions.find((option) => option.value === viewerAnalyzeMethod)?.label || 'Upload';

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

  // Load System Settings
  useEffect(() => {
    async function loadSettings() {
      try {
        const settings = await getSystemSettings();
        const defaultMethod = settings.competitorAnalyzeMethod || 'upload';
        setAnalyzeMethod(defaultMethod);
        setViewerAnalyzeMethod(defaultMethod);
        setApifyDefaultLimit(settings.apifyDefaultResultsLimit || 100);
      } catch (e) {
        console.error("Failed to load system settings", e);
      }
    }
    loadSettings();
  }, []);

  // Fetch data when platform changes
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const endpointPrefix = effectiveAnalyzeMethod === 'apify' ? '/apify' : '/competitors';
        const [postsRes, summaryRes] = await Promise.all([
          api.get(`${endpointPrefix}/${id}/posts?platform=${platformKey}`),
          api.get(`${endpointPrefix}/${id}/summary?platform=${platformKey}`),
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
  }, [id, platformKey, effectiveAnalyzeMethod]);

  const handleShare = async () => {
    if (!canManageCompetitors) return;
    setShareLoading(true);
    try {
      const updatedClient = await toggleShare(id, true);
      const shareUrl = `${window.location.origin}/public-competitor-report/${updatedClient.shareToken}?method=${analyzeMethod}`;
      
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = shareUrl;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        textArea.style.top = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }

      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);
      setToast({ message: "Share link copied to clipboard!", type: "success" });
    } catch (error) {
      console.error("Failed to share report", error);
      setToast({ message: "Failed to generate share link.", type: "error" });
    } finally {
      setShareLoading(false);
    }
  };

  // Refresh data after upload
  const handleUploadClose = () => {
    setIsUploadOpen(false);
    // Re-fetch data
    async function refetch() {
      try {
        const endpointPrefix = analyzeMethod === 'apify' ? '/apify' : '/competitors';
        const [postsRes, summaryRes] = await Promise.all([
          api.get(`${endpointPrefix}/${id}/posts?platform=${platformKey}`),
          api.get(`${endpointPrefix}/${id}/summary?platform=${platformKey}`),
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

  const availableRanges = useMemo(() => {
    if (!posts.length) return [];
    const uniqueLabels = [...new Set(posts.map(p => p.syncRangeLabel).filter(Boolean))];
    
    // Also keep the month-wise ranges as fallback if no specific sync labels exist
    // Or just use the specific sync labels if available.
    // The user wants the ones from sync live data.
    return uniqueLabels.map(label => ({
      key: label,
      label: label
    }));
  }, [posts]);

  const postsFilteredByDate = useMemo(() => {
    if (dateRange === 'all') return posts;
    return posts.filter(p => p.syncRangeLabel === dateRange);
  }, [posts, dateRange]);

  // Filter posts by selected competitor
  const filteredPosts = useMemo(() => {
    if (selectedCompetitor === 'all') return postsFilteredByDate;
    return postsFilteredByDate.filter(p => p.trackedAccount?.username === selectedCompetitor);
  }, [postsFilteredByDate, selectedCompetitor]);

  // Selected competitor's summary or aggregated (CALCULATED FROM FILTERED POSTS)
  const selectedSummary = useMemo(() => {
    // We calculate the summary for the selected competitor using ONLY the posts in the selected date range
    const relevantPosts = selectedCompetitor === 'all' 
      ? postsFilteredByDate 
      : postsFilteredByDate.filter(p => p.trackedAccount?.username === selectedCompetitor);

    const metrics = {
      totalPosts: relevantPosts.length,
      totalViews: relevantPosts.reduce((a, p) => a + (p.views || 0), 0),
      totalLikes: relevantPosts.reduce((a, p) => a + (p.likes || 0), 0),
      totalComments: relevantPosts.reduce((a, p) => a + (p.commentsCount || 0), 0),
      totalShares: relevantPosts.reduce((a, p) => a + (p.shares || 0), 0),
      // Follower count is a snapshot, we take the max observed in this range or fallback to current
      followerCount: summary.reduce((a, s) => {
        if (selectedCompetitor === 'all' || s.username === selectedCompetitor) {
          return a + (Number(s.followerCount) || 0);
        }
        return a;
      }, 0)
    };

    return metrics;
  }, [postsFilteredByDate, summary, selectedCompetitor]);

  // Recalculate summary for ALL competitors for ranking purposes
  const filteredCompetitorSummaries = useMemo(() => {
    const competitorMap = {};
    
    // Group filtered posts by competitor
    postsFilteredByDate.forEach(p => {
      const username = p.trackedAccount?.username;
      if (!username) return;
      if (!competitorMap[username]) {
        competitorMap[username] = { 
          username, 
          displayName: p.trackedAccount.displayName || username,
          totalPosts: 0, totalViews: 0, totalLikes: 0, totalComments: 0, totalShares: 0 
        };
      }
      competitorMap[username].totalPosts++;
      competitorMap[username].totalViews += (p.views || 0);
      competitorMap[username].totalLikes += (p.likes || 0);
      competitorMap[username].totalComments += (p.commentsCount || 0);
      competitorMap[username].totalShares += (p.shares || 0);
    });

    // Merge with original summary to get follower counts (since posts don't have historical follower snapshots usually)
    return summary.map(s => {
      const filtered = competitorMap[s.username] || { 
        username: s.username, displayName: s.displayName,
        totalPosts: 0, totalViews: 0, totalLikes: 0, totalComments: 0, totalShares: 0 
      };
      return {
        ...filtered,
        followerCount: s.followerCount // Keep the latest known follower count
      };
    });
  }, [postsFilteredByDate, summary]);

  // ─── Metric Cards (dynamic) ────────────────────────────
  const metricCardsData = useMemo(() => {
    const platform = activeTab?.toLowerCase();
    const isAudienceBased = platform === 'instagram' || platform === 'facebook';
    
    const totalPosts = selectedSummary.totalPosts || 1;
    const avgViews = Math.round(selectedSummary.totalViews / totalPosts);
    const avgLikes = Math.round(selectedSummary.totalLikes / totalPosts);
    const topViews = filteredPosts.length > 0
      ? filteredPosts.reduce((max, p) => { const v = p.views || 0; return v > max ? v : max; }, 0)
      : 0;

    // Calculate rank among competitors (by avg views or engagement)
    const ranked = filteredCompetitorSummaries
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
        ? filteredPosts.reduce((max, p) => {
            const eng = (p.likes || 0) + (p.commentsCount || 0) + (p.shares || 0);
            return eng > max ? eng : max;
          }, 0)
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
    return filteredCompetitorSummaries.map((s, index) => {
      const tp = s.totalPosts || 1;
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
  }, [summary, posts, selectedCompetitor, filteredCompetitorSummaries]);

  // ─── Recent Post Performance (Grouped by Competitor) ───────────────────────────
  const recentPostPerformanceData = useMemo(() => {
    return summary.map(s => {
      const brandPosts = postsFilteredByDate
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
  }, [summary, postsFilteredByDate, selectedCompetitor, activeTab]);

  // ─── Competitive Benchmark Table ───────────────────────
  const competitiveBenchmarkData = useMemo(() => {
    return summary
      .map(s => {
        const platform = activeTab?.toLowerCase();
        const isAudienceBased = platform === 'instagram' || platform === 'facebook';
        
        const accountPosts = postsFilteredByDate.filter(p => p.trackedAccount?.username === s.username);
        const tp = accountPosts.length;

        let avgValue = 0;
        let topValue = 0;

        if (isAudienceBased) {
          const totalEng = accountPosts.reduce((sum, p) => 
            sum + (Number(p.likes) || 0) + (Number(p.commentsCount) || 0) + (Number(p.shares) || 0), 0);
          avgValue = tp > 0 ? Math.round(totalEng / tp) : 0;
          topValue = accountPosts.length > 0 
            ? accountPosts.reduce((max, p) => {
                const eng = (Number(p.likes) || 0) + (Number(p.commentsCount) || 0) + (Number(p.shares) || 0);
                return eng > max ? eng : max;
              }, 0)
            : 0;
        } else {
          const totalViews = accountPosts.reduce((sum, p) => sum + (Number(p.views) || 0), 0);
          avgValue = tp > 0 ? Math.round(totalViews / tp) : 0;
          topValue = accountPosts.length > 0 
            ? accountPosts.reduce((max, p) => {
                const v = Number(p.views) || 0;
                return v > max ? v : max;
              }, 0)
            : 0;
        }

        return {
          brand: s.displayName || s.username,
          followers: Number(s.followerCount) > 0 ? fmt(s.followerCount) : '-',
          avgValue: fmt(avgValue),
          topValue: fmt(topValue),
          postsPerMonth: tp > 0 ? `${tp} posts` : '0',
          rank: '',
          isMain: s.username === selectedCompetitor,
          _sortValue: avgValue,
        };
      })
      .sort((a, b) => b._sortValue - a._sortValue)
      .map((row, idx) => ({ ...row, rank: ordinal(idx + 1) }));
  }, [summary, postsFilteredByDate, selectedCompetitor, activeTab]);

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
  if (loading || isSyncing) {
    return (
      <section className="w-full bg-[#f8f9fa] flex items-center justify-center min-h-[80vh]">
        <div className="text-center flex flex-col items-center">
          {isSyncing ? (
            <div className="relative mb-6">
              <div className="h-16 w-16 border-4 border-[#003870]/10 border-t-[#003870] rounded-full animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <svg className="h-6 w-6 text-[#003870] animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M23 4v6h-6" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
          ) : (
            <div className="h-10 w-10 border-4 border-[#003870]/20 border-t-[#003870] rounded-full animate-spin mb-4" />
          )}
          <h3 className="text-lg font-bold text-[#191c1d] mb-1">
            {isSyncing ? `Syncing ${activeTab} data...` : "Loading dashboard..."}
          </h3>
          <p className="text-sm font-medium text-[#727782] max-w-xs">
            {isSyncing 
              ? "We're fetching real-time insights from Apify. This might take a minute." 
              : "Preparing your competitor performance overview."
            }
          </p>
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
            <span className="text-sm">
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

      {!canManageCompetitors && (
        <div className="relative">
          <button
            onClick={() => {
              setIsCompetitorDropdownOpen(false);
              setIsDateDropdownOpen(false);
              setIsViewerSourceDropdownOpen(!isViewerSourceDropdownOpen);
            }}
            className="flex h-11 items-center gap-2 sm:gap-3 rounded-full border border-[#c2c6d3]/20 bg-[#f3f4f5]/50 px-4 sm:px-5 font-bold text-[#003870] transition-all hover:bg-[#f3f4f5]"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-[#003870]">
              <ellipse cx="12" cy="5" rx="8" ry="3" />
              <path d="M4 5v6c0 1.66 3.58 3 8 3s8-1.34 8-3V5" />
              <path d="M4 11v6c0 1.66 3.58 3 8 3s8-1.34 8-3v-6" />
            </svg>
            <span className="text-sm whitespace-nowrap">{viewerSourceLabel}</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className={`text-[#727782] transition-transform ${isViewerSourceDropdownOpen ? "rotate-180" : ""}`}>
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {isViewerSourceDropdownOpen && (
            <div className="absolute left-0 top-full z-50 mt-2 w-44 overflow-hidden rounded-2xl border border-[#c2c6d3]/20 bg-white shadow-xl">
              {viewerSourceOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    setViewerAnalyzeMethod(option.value);
                    setSelectedCompetitor('all');
                    setDateRange('all');
                    setIsViewerSourceDropdownOpen(false);
                  }}
                  className={`w-full px-4 py-3 text-left text-sm font-bold transition hover:bg-[#f3f4f5] ${
                    viewerAnalyzeMethod === option.value ? "text-[#003870] bg-[#003870]/5" : "text-[#727782]"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Date Range Dropdown */}
      <div className="relative">
        <button
          onClick={() => {
            setIsViewerSourceDropdownOpen(false);
            setIsDateDropdownOpen(!isDateDropdownOpen);
          }}
          className="flex h-11 items-center gap-2 sm:gap-3 rounded-full border border-[#c2c6d3]/20 bg-[#f3f4f5]/50 px-4 sm:px-5 font-bold text-[#003870] transition-all hover:bg-[#f3f4f5]"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-[#003870]">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <span className="text-sm whitespace-nowrap">
            {dateRange === 'all' ? 'All Time' : dateRange}
          </span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className={`text-[#727782] transition-transform ${isDateDropdownOpen ? "rotate-180" : ""}`}>
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {isDateDropdownOpen && (
          <div className="absolute left-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-[#c2c6d3]/20 bg-white shadow-xl">
            <button
              onClick={() => { setDateRange('all'); setIsDateDropdownOpen(false); }}
              className={`w-full px-4 py-3 text-left text-sm font-bold transition hover:bg-[#f3f4f5] ${dateRange === 'all' ? "text-[#003870] bg-[#003870]/5" : "text-[#727782]"}`}
            >
              All Time
            </button>
            {availableRanges.map((m) => (
              <button
                key={m.key}
                onClick={() => { setDateRange(m.key); setIsDateDropdownOpen(false); }}
                className={`w-full px-4 py-3 text-left text-sm font-bold transition hover:bg-[#f3f4f5] ${dateRange === m.key ? "text-[#003870] bg-[#003870]/5" : "text-[#727782]"}`}
              >
                {m.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {canManageCompetitors && (analyzeMethod === 'upload' ? (
        <button
          onClick={() => setIsUploadOpen(true)}
          className="flex h-11 items-center justify-center gap-2 rounded-full bg-[#003870] px-6 text-sm font-bold text-white shadow-md transition hover:bg-[#002d5a] active:scale-95"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" strokeLinecap="round" strokeLinejoin="round" />
            <polyline points="17,8 12,3 7,8" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="12" y1="3" x2="12" y2="15" strokeLinecap="round" />
          </svg>
          <span className="hidden sm:inline">Upload Data</span>
          <span className="sm:hidden">Upload</span>
        </button>
      ) : (
        <button
          onClick={() => setIsFetchOpen(true)}
          className="flex h-11 items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,#003870_0%,#014f99_100%)] px-6 text-sm font-bold text-white shadow-md transition hover:shadow-lg active:scale-95"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M23 4v6h-6" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="hidden sm:inline">Sync Live Data</span>
          <span className="sm:hidden">Start</span>
        </button>
      ))}
    </>
  );

  return (
    <section className="w-full bg-[#f8f9fa]">
      {/* Header Section */}
      <div className="flex flex-col mb-8 md:mb-10">
        {/* Row 1: Title & Desktop Actions */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 md:mb-2 gap-4">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Link
              to="/competitors"
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[#003870] transition-all hover:bg-[#003870]/8 active:scale-90"
              title="Back to competitors"
              aria-label="Back to competitors"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8">
                <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
            <h1 className="text-4xl tracking-tight text-[#191c1d] sm:text-5xl">
              <span className="font-extrabold">Competitor </span>
              <span className="font-medium">Analysis</span>
            </h1>
          </div>

          {/* Actions - DESKTOP ONLY */}
          <div className="hidden md:flex items-center gap-3 flex-wrap justify-end">
            <CompetitorActions />
          </div>
        </div>

        {/* Row 2: Sub-header, Mobile Actions & Platform Tabs */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8 md:gap-6">
          <div className="flex flex-col md:gap-5">
            <p className="text-base leading-7 text-[#424751] sm:text-lg max-w-2xl">
              {clientName ? `Dashboard for ${clientName} — ` : ""}Track and analyze your competitors' performance across platforms.
            </p>

            {/* Actions - MOBILE ONLY (shown below text) */}
            <div className="flex md:hidden items-center gap-2 flex-wrap">
              <CompetitorActions />
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 w-full lg:w-auto">
            {canManageCompetitors && <button
              onClick={handleShare}
              disabled={shareLoading}
              className="flex h-10 items-center gap-2 rounded-full border border-[#c2c6d3]/20 bg-white px-4 sm:px-5 font-bold text-[#003870] transition-all hover:bg-[#f3f4f5] active:scale-95 disabled:opacity-50 shadow-sm shrink-0"
            >
              {shareLoading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#003870] border-t-transparent"></div>
              ) : showCopied ? (
                <div className="flex items-center gap-2 text-[#003870] animate-in fade-in zoom-in duration-300">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-xs sm:text-sm">Copied!</span>
                </div>
              ) : (
                <>
                  <svg className="h-4 w-4 text-[#003870]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  <span className="text-xs sm:text-sm">Share</span>
                </>
              )}
            </button>}

            <div className="flex overflow-x-auto no-scrollbar whitespace-nowrap items-center gap-1 rounded-full bg-[#f3f4f5] p-1 flex-1">
              {['Facebook', 'Instagram', 'TikTok'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 rounded-full px-3 sm:px-5 py-2 text-[10px] sm:text-sm transition text-center whitespace-nowrap ${
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
      </div>

      <div className="mb-6" />

      {/* Empty State / Dashboard Content */}
      {posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center bg-white rounded-3xl border border-[#c2c6d3]/30 p-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#f3f4f5] flex items-center justify-center mb-4 text-[#727782]">
            {effectiveAnalyzeMethod === 'upload' ? (
              <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" strokeLinecap="round" strokeLinejoin="round" />
                <polyline points="17,8 12,3 7,8" strokeLinecap="round" strokeLinejoin="round" />
                <line x1="12" y1="3" x2="12" y2="15" strokeLinecap="round" />
              </svg>
            ) : (
              <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M23 4v6h-6" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
          <h3 className="text-lg font-bold text-[#191c1d] mb-2">No data yet</h3>
          <p className="text-sm text-[#727782] mb-6 max-w-md">
            {effectiveAnalyzeMethod === 'upload' 
              ? `Upload CSV data from your browser extensions to start analyzing competitor performance on ${activeTab}.`
              : `Fetch real-time data via Apify to start analyzing competitor performance on ${activeTab}.`
            }
          </p>
          {canManageCompetitors && (analyzeMethod === 'upload' ? (
            <button
              onClick={() => setIsUploadOpen(true)}
              className="rounded-full bg-[linear-gradient(135deg,#003870_0%,#014f99_100%)] px-8 py-3 text-sm font-bold text-white shadow-lg transition hover:scale-[1.02] active:scale-95"
            >
              Upload {activeTab} Data
            </button>
          ) : (
            <button
              onClick={() => setIsFetchOpen(true)}
              className="rounded-full bg-[linear-gradient(135deg,#003870_0%,#014f99_100%)] px-8 py-3 text-sm font-bold text-white shadow-lg transition hover:scale-[1.02] active:scale-95"
            >
              Fetch {activeTab} Data
            </button>
          ))}
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
              allPosts={postsFilteredByDate} 
              competitors={competitors}
              isApify={effectiveAnalyzeMethod === 'apify'}
            />
          </div>

          {/* Bottom Table */}
          <TopVideosTable 
            allPosts={postsFilteredByDate} 
            competitors={competitors}
            isApify={effectiveAnalyzeMethod === 'apify'}
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
      {/* Apify Fetch Modal */}
      <ApifyFetchModal
        open={isFetchOpen}
        onClose={() => setIsFetchOpen(false)}
        platform={activeTab}
        defaultResultsLimit={apifyDefaultLimit}
        onFetch={async (data) => {
          try {
            setIsSyncing(true);
            console.log("Starting Apify fetch with data:", { ...data, platform: activeTab });
            await api.post(`/apify/fetch/${id}`, { ...data, platform: activeTab });
            
            // Re-fetch data from Apify table
            const [postsRes, summaryRes] = await Promise.all([
              api.get(`/apify/${id}/posts?platform=${platformKey}`),
              api.get(`/apify/${id}/summary?platform=${platformKey}`),
            ]);
            setPosts(postsRes.data);
            setSummary(summaryRes.data);
            setSelectedCompetitor('all');
            setToast({ message: `Successfully fetched real-time ${activeTab} data!`, type: "success" });
            setIsFetchOpen(false);
          } catch (e) {
            console.error("Failed to fetch from Apify", e);
            const msg = e.response?.data?.message || e.message || "Fetch failed";
            setToast({ message: msg, type: "error" });
          } finally {
            setIsSyncing(false);
          }
        }}
      />

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </section>
  );
}
