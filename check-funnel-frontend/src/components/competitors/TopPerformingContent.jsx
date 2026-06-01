import React, { useState, useRef, useEffect } from 'react';
import PostDetailsModal from './PostDetailsModal';
import { engagementValue, isVideoPost, viewValue } from '../../utils/apifyVideoMetrics';

const cleanFbUrl = (url) => {
  if (!url) return '#';
  return url.split('&fbclid=')[0].split('?fbclid=')[0].split('/&fbclid=')[0];
};



function TopContentCard({ data, onInfoClick }) {
  const [thumbnail, setThumbnail] = useState('');
  const [imgError, setImgError] = useState(false);

  // Fetch fresh thumbnail via backend oEmbed proxy
  useEffect(() => {
    let ignore = false;
    setImgError(false);
    setThumbnail('');

    if (!data?.postUrl) return;

    async function fetchThumb() {
      try {
        const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
        const res = await fetch(`${baseUrl}/competitors/thumbnail?url=${encodeURIComponent(data.postUrl)}`);
        if (res.ok && !ignore) {
          const thumbData = await res.json();
          if (thumbData.thumbnail) {
            const proxyUrl = `${baseUrl}/competitors/proxy-image?url=${encodeURIComponent(thumbData.thumbnail)}`;
            setThumbnail(proxyUrl);
          }
        }
      } catch {
        // Silently fail — fallback will show
      }
    }
    fetchThumb();

    return () => {
      ignore = true;
    };
  }, [data?.postUrl]);

  const imgSrc = thumbnail || data.imageUrl || '';
  useEffect(() => {
    setImgError(false);
  }, [imgSrc]);

  const showFallback = !imgSrc || imgError;

  const isVideo = React.useMemo(() => {
    if (data.isVideoContent || data.metricMode === 'videoViews') return true;
    if (data.platform?.toLowerCase() === 'tiktok') return true;
    const url = data.postUrl || '';
    if (url.includes('/reel/') || url.includes('/tv/') || url.includes('/video/') || url.includes('/watch') || url.includes('/videos/')) return true;
    const type = data.rawExtensionData?.Type || data.rawExtensionData?.type || data.rawExtensionData?.media_type || data.rawExtensionData?.['Media Type'];
    if (type) {
      const typeLower = String(type).toLowerCase();
      if (typeLower.includes('video') || typeLower.includes('reel') || typeLower.includes('tv')) return true;
      if (typeLower.includes('image') || typeLower.includes('photo') || typeLower.includes('album') || typeLower.includes('carousel')) return false;
    }
    return false;
  }, [data]);

  return (
    <div className="flex flex-col w-[180px] shrink-0">
      <div className="relative w-full aspect-[9/16] rounded-[24px] overflow-hidden shadow-sm group bg-[#f3f4f5] mb-3">
        {showFallback ? (
          <div className="w-full h-full bg-gradient-to-br from-[#003870] via-[#014f99] to-[#2d6cb4] flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center mb-2">
              <span className="text-xl font-extrabold text-white">
                {(data.brand || '?').charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
        ) : (
          <img 
            src={imgSrc} 
            alt={data.title} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
            onError={() => setImgError(true)}
            referrerPolicy="no-referrer"
          />
        )}
        
        {/* Info Icon Button - Top Right */}
        <button
          onClick={() => onInfoClick(data.id)}
          className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/30 backdrop-blur-md text-white flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all hover:bg-white/40 z-10 shadow-lg active:scale-90"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
        </button>

        {/* Link and Play Overlays */}
        <a 
          href={cleanFbUrl(data.postUrl)} 
          target="_blank" 
          rel="noopener noreferrer"
          className="absolute inset-0"
        >
          <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="absolute bottom-3 left-3 w-8 h-8 rounded-full border-2 border-white flex items-center justify-center bg-black/20 backdrop-blur-sm">
            {isVideo ? (
              <svg className="w-4 h-4 text-white ml-0.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            )}
          </div>
        </a>
      </div>

      <div className="flex flex-col px-1">
        <h3 className="text-[13px] font-bold text-[#191c1d] leading-snug line-clamp-1 mb-2" title={data.title}>
          {data.title || data.brand}
        </h3>
        
        <div className="flex items-center gap-3 text-[#727782]">
          {data.metricMode !== 'videoViews' ? (
            <div className="flex items-center gap-1">
              <svg className="w-[14px] h-[14px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
              <span className="text-xs font-semibold">{data.likes}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <svg className="w-[14px] h-[14px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
              </svg>
              <span className="text-xs font-semibold">{data.views}</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <svg className="w-[14px] h-[14px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            <span className="text-xs font-semibold">{data.comments}</span>
          </div>
          <div className="flex items-center gap-1">
            <svg className="w-[14px] h-[14px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="m22 2-7 20-4-9-9-4Z" />
              <path d="M22 2 11 13" />
            </svg>
            <span className="text-xs font-semibold">{data.shares}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

const fmt = (num) => {
  if (!num || isNaN(num)) return '0';
  if (num >= 1000000) return (num / 1000000).toFixed(1).replace('.0', '') + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1).replace('.0', '') + 'K';
  return num.toLocaleString();
};

const accountKeyFromPost = (post) => String(
  post?.trackedAccount?.id ??
  post?.trackedAccountId ??
  post?.apifyTrackedAccountId ??
  post?.trackedAccount?.username ??
  ''
);

const accountKeyFromCompetitor = (competitor) => String(
  competitor?.accountKey ??
  competitor?.accountId ??
  competitor?.id ??
  competitor?.username ??
  ''
);

const competitorLabel = (competitor) => competitor?.displayName || competitor?.username || 'Unknown';

export default function TopPerformingContent({ allPosts, competitors, isApify }) {
  const pf = allPosts?.[0]?.platform?.toLowerCase();
  const isAudienceBased = pf === 'instagram' || pf === 'facebook';
  const canSwitchMetric = isAudienceBased;
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [selectedMetric, setSelectedMetric] = useState('engagement');
  const [isOpen, setIsOpen] = useState(false);
  const [isMetricOpen, setIsMetricOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPostId, setSelectedPostId] = useState(null);
  const dropdownRef = useRef(null);
  const metricDropdownRef = useRef(null);
  const itemsPerPage = 10;
  const activeMetric = canSwitchMetric ? selectedMetric : 'videoViews';

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
      if (metricDropdownRef.current && !metricDropdownRef.current.contains(event.target)) {
        setIsMetricOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedBrand, activeMetric]);

  const allRankedPosts = React.useMemo(() => {
    if (!allPosts || allPosts.length === 0) return [];
    
    let filtered = allPosts;
    if (selectedBrand !== 'all') {
      filtered = allPosts.filter(p => accountKeyFromPost(p) === selectedBrand);
    }

    const metricPosts = activeMetric === 'videoViews'
      ? filtered.filter(isVideoPost)
      : filtered;

    return [...metricPosts]
      .sort((a, b) => {
        const scoreA = activeMetric === 'engagement' ? engagementValue(a) : viewValue(a);
        const scoreB = activeMetric === 'engagement' ? engagementValue(b) : viewValue(b);
          
        return scoreB - scoreA;
      })
      .map(post => {
        const caption = post.caption || post.rawExtensionData?.caption || post.rawExtensionData?.caption_text || post.rawExtensionData?.Description || '';
        return {
          id: post.id,
          title: caption.substring(0, 50) + (caption.length > 50 ? '...' : ''),
          brand: post.trackedAccount?.displayName || post.trackedAccount?.username || 'Unknown',
          platform: post.platform,
          views: fmt(viewValue(post)),
          likes: fmt(post.likes),
          comments: fmt(post.commentsCount),
          shares: fmt(post.shares),
          postUrl: post.postUrl,
          imageUrl: post.imageUrl,
          rawExtensionData: post.rawExtensionData,
          metricMode: activeMetric,
          isVideoContent: activeMetric === 'videoViews' || isVideoPost(post),
        };
      });
  }, [allPosts, selectedBrand, activeMetric]);

  const totalPages = Math.ceil(allRankedPosts.length / itemsPerPage);
  const visiblePosts = allRankedPosts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (!allPosts || allPosts.length === 0) return null;

  const selectedCompetitor = competitors?.find(c => accountKeyFromCompetitor(c) === selectedBrand);
  const currentSelection = selectedBrand === 'all' 
    ? 'All Competitors' 
    : competitorLabel(selectedCompetitor);
  const metricSelection = activeMetric === 'engagement' ? 'Engagement' : 'Video';
  const titleMetric = activeMetric === 'engagement'
    ? 'Engagement Content'
    : (isAudienceBased ? 'Video Content' : 'Performing Content');

  return (
    <div className="bg-white rounded-3xl border border-[#c2c6d3]/30 p-6 shadow-sm flex flex-col w-full">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <h2 className="text-lg font-bold text-[#191c1d]">Top {titleMetric}</h2>
        
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {canSwitchMetric && (
            <div className="relative" ref={metricDropdownRef}>
              <button
                onClick={() => setIsMetricOpen(!isMetricOpen)}
                className="flex h-10 items-center gap-3 rounded-full border border-[#c2c6d3]/20 bg-[#f3f4f5]/50 px-5 font-bold text-[#003870] transition-all hover:bg-[#f3f4f5] shadow-sm"
              >
                <span className="text-sm">{metricSelection}</span>
                <svg
                  width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"
                  className={`text-[#727782] transition-transform duration-200 ${isMetricOpen ? "rotate-180" : ""}`}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {isMetricOpen && (
                <div className="absolute right-0 top-full z-50 mt-2 w-44 overflow-hidden rounded-2xl border border-[#c2c6d3]/20 bg-white shadow-xl animate-in fade-in slide-in-from-top-1 duration-200">
                  <button
                    onClick={() => {
                      setSelectedMetric('engagement');
                      setIsMetricOpen(false);
                    }}
                    className={`w-full px-4 py-2.5 text-left text-sm font-bold transition hover:bg-[#f3f4f5] ${
                      selectedMetric === 'engagement' ? "text-[#003870] bg-[#003870]/5" : "text-[#727782]"
                    }`}
                  >
                    Engagement
                  </button>
                  <button
                    onClick={() => {
                      setSelectedMetric('videoViews');
                      setIsMetricOpen(false);
                    }}
                    className={`w-full px-4 py-2.5 text-left text-sm font-bold transition hover:bg-[#f3f4f5] ${
                      selectedMetric === 'videoViews' ? "text-[#003870] bg-[#003870]/5" : "text-[#727782]"
                    }`}
                  >
                    Video
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Custom Stylized Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="flex h-10 items-center gap-3 rounded-full border border-[#c2c6d3]/20 bg-[#f3f4f5]/50 px-5 font-bold text-[#003870] transition-all hover:bg-[#f3f4f5] shadow-sm"
            >
              <span className="text-sm">{currentSelection}</span>
              <svg 
                width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" 
                className={`text-[#727782] transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {isOpen && (
              <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-[#c2c6d3]/20 bg-white shadow-xl animate-in fade-in slide-in-from-top-1 duration-200">
                <button
                  onClick={() => {
                    setSelectedBrand('all');
                    setIsOpen(false);
                  }}
                  className={`w-full px-4 py-2.5 text-left text-sm font-bold transition hover:bg-[#f3f4f5] ${
                    selectedBrand === 'all' ? "text-[#003870] bg-[#003870]/5" : "text-[#727782]"
                  }`}
                >
                  All Competitors
                </button>
                <div className="max-h-60 overflow-y-auto no-scrollbar border-t border-slate-50">
                  {competitors?.map((c) => (
                    <button
                      key={accountKeyFromCompetitor(c)}
                      onClick={() => {
                        setSelectedBrand(accountKeyFromCompetitor(c));
                        setIsOpen(false);
                      }}
                      className={`w-full px-4 py-2.5 text-left text-sm font-bold transition hover:bg-[#f3f4f5] ${
                        selectedBrand === accountKeyFromCompetitor(c) ? "text-[#003870] bg-[#003870]/5" : "text-[#727782]"
                      }`}
                    >
                      {competitorLabel(c)}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {visiblePosts.length > 0 ? (
        <>
          <div className="flex overflow-x-auto no-scrollbar gap-5 pb-4">
            {visiblePosts.map((post, idx) => (
              <TopContentCard 
                key={post.postUrl || idx} 
                data={post} 
                onInfoClick={(id) => setSelectedPostId(id)}
              />
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
              <div className="text-xs font-bold text-[#727782]">
                Page <span className="text-[#003870]">{currentPage}</span> of {totalPages}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className={`p-2 rounded-full transition-all ${
                    currentPage === 1 
                      ? 'text-slate-300 cursor-not-allowed' 
                      : 'text-[#003870] hover:bg-slate-100'
                  }`}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className={`p-2 rounded-full transition-all ${
                    currentPage === totalPages 
                      ? 'text-slate-300 cursor-not-allowed' 
                      : 'text-[#003870] hover:bg-slate-100'
                  }`}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-10 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
           <p className="text-sm font-medium text-slate-500">No {activeMetric === 'videoViews' ? 'video content' : 'content'} found for this selection</p>
        </div>
      )}

      {/* Details Modal */}
      {selectedPostId && (
        <PostDetailsModal 
          postId={selectedPostId} 
          onClose={() => setSelectedPostId(null)} 
          isApify={isApify}
        />
      )}
    </div>
  );
}
