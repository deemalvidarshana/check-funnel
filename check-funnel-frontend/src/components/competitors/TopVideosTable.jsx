import React, { useState, useEffect, useMemo, useRef } from 'react';
import PostDetailsModal from './PostDetailsModal';

const fmt = (num) => {
  if (!num || isNaN(num)) return '0';
  if (num >= 1000000) return (num / 1000000).toFixed(1).replace('.0', '') + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1).replace('.0', '') + 'K';
  return num.toLocaleString();
};

export default function TopVideosTable({ allPosts, competitors }) {
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [isOpen, setIsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPostId, setSelectedPostId] = useState(null);
  const dropdownRef = useRef(null);
  const itemsPerPage = 10;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset page when brand changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedBrand]);

  const allRankedData = useMemo(() => {
    if (!allPosts || allPosts.length === 0) return [];
    
    let filtered = allPosts;
    if (selectedBrand !== 'all') {
      filtered = allPosts.filter(p => p.trackedAccount?.username === selectedBrand);
    }

    return [...filtered]
      .sort((a, b) => {
        const platA = a.platform?.toLowerCase();
        const platB = b.platform?.toLowerCase();
        const isAudienceA = platA === 'instagram' || platA === 'facebook';
        const isAudienceB = platB === 'instagram' || platB === 'facebook';

        const scoreA = isAudienceA 
          ? (Number(a.likes) || 0) + (Number(a.commentsCount) || 0) + (Number(a.shares) || 0)
          : (Number(a.views) || 0);
          
        const scoreB = isAudienceB 
          ? (Number(b.likes) || 0) + (Number(b.commentsCount) || 0) + (Number(b.shares) || 0)
          : (Number(b.views) || 0);
          
        return scoreB - scoreA;
      })
      .map((p, idx) => {
        const name = p.trackedAccount?.displayName || p.trackedAccount?.username || '';
        const caption = p.rawExtensionData?.caption || p.rawExtensionData?.caption_text || p.rawExtensionData?.Description || '';
        const likes = Number(p.likes) || 0;
        const comments = Number(p.commentsCount) || 0;
        const shares = Number(p.shares) || 0;
        const totalEng = likes + comments + shares;
        
        // Dynamic Engagement Rate Calculation
        const pform = p.platform?.toLowerCase();
        const isInstagram = pform === 'instagram';
        const isFacebook = pform === 'facebook';
        const isAudienceBased = isInstagram || isFacebook;
        let engRate = 'N/A';
        
        if (isAudienceBased) {
          const postUsername = (p.trackedAccount?.username || p.rawExtensionData?.username || '').toLowerCase().trim();
          const comp = competitors?.find(c => (c.username || '').toLowerCase().trim() === postUsername);
          
          // Try multiple sources for follower count
          const followers = Number(p.rawExtensionData?.follower_count) || 
                            Number(p.rawExtensionData?.profile_followers) || 
                            Number(p.rawExtensionData?.['Followers Count']) || 
                            Number(p.rawExtensionData?.followers) ||
                            Number(comp?.followerCount) || 0;
          
          const totalEngagement = Number(totalEng) || 0;
          
          if (followers > 0) {
            const rate = (totalEngagement / followers) * 100;
            // If the rate is very small but > 0, show at least 0.01%
            engRate = rate > 0 && rate < 0.01 ? '0.01%' : rate.toFixed(2) + '%';
          } else {
            engRate = '0%';
          }
        } else {
          const views = Number(p.views) || 0;
          const totalEngagement = Number(totalEng) || 0;
          engRate = views > 0 ? ((totalEngagement / views) * 100).toFixed(2) + '%' : 'N/A';
        }

        return {
          id: p.id,
          rank: idx + 1,
          brand: name,
          brandInitial: name.charAt(0).toUpperCase(),
          views: fmt(p.views),
          likes: fmt(p.likes),
          comments: fmt(p.commentsCount),
          shares: fmt(p.shares),
          saves: fmt(p.rawExtensionData?.saves || 0),
          engRate,
          postUrl: p.postUrl,
          caption: caption.substring(0, 80) + (caption.length > 80 ? '...' : ''),
        };
      });
  }, [allPosts, selectedBrand, competitors]);

  const totalPages = Math.ceil(allRankedData.length / itemsPerPage);
  const tableData = allRankedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const [openMenuId, setOpenMenuId] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const cleanFbUrl = (url) => {
    if (!url) return '#';
    return url.split('&fbclid=')[0].split('?fbclid=')[0].split('/&fbclid=')[0];
  };

  const currentSelection = selectedBrand === 'all' 
    ? 'All Competitors' 
    : `@${selectedBrand}`;

  const pf = allPosts[0]?.platform?.toLowerCase();
  const isAudienceBased = pf === 'instagram' || pf === 'facebook';

  return (
    <div className="bg-white rounded-3xl border border-[#c2c6d3]/30 p-6 shadow-sm overflow-hidden flex flex-col h-full">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
        <div>
          <h2 className="text-lg font-bold text-[#191c1d] flex items-center gap-2">
            Top {isAudienceBased ? 'Engagement Content' : 'Performing Videos'}
            <svg className="w-4 h-4 text-[#727782] cursor-pointer" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M12 16v-4"></path>
              <path d="M12 8h.01"></path>
            </svg>
          </h2>
          <p className="text-xs text-[#727782] font-medium mt-1">
            {allRankedData.length > 0 
              ? `Showing ${(currentPage - 1) * itemsPerPage + 1}-${Math.min(currentPage * itemsPerPage, allRankedData.length)} of ${allRankedData.length} posts ranked by performance`
              : 'Top posts ranked by performance across selection'
            }
          </p>
        </div>

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
                    key={c.username}
                    onClick={() => {
                      setSelectedBrand(c.username);
                      setIsOpen(false);
                    }}
                    className={`w-full px-4 py-2.5 text-left text-sm font-bold transition hover:bg-[#f3f4f5] ${
                      selectedBrand === c.username ? "text-[#003870] bg-[#003870]/5" : "text-[#727782]"
                    }`}
                  >
                    @{c.username}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="overflow-x-auto w-full flex-1 min-h-[400px]">
        <table className={`w-full ${isAudienceBased ? 'min-w-[700px]' : 'min-w-[900px]'} text-left border-collapse`}>
          <thead>
            <tr className="border-b border-slate-100 text-[11px] font-bold text-[#727782] uppercase tracking-wider bg-blue-50/30 rounded-t-lg">
              <th className="py-3 px-4 text-center rounded-tl-lg">Rank</th>
              <th className="py-3 px-4">Brand</th>
              {!isAudienceBased && <th className="py-3 px-4 text-center">Views</th>}
              <th className="py-3 px-4 text-center">Likes</th>
              <th className="py-3 px-4 text-center">Comments</th>
              <th className="py-3 px-4 text-center">Shares</th>
              {!isAudienceBased && <th className="py-3 px-4 text-center">Saves</th>}
              <th className="py-3 px-4 text-center">Eng. Rate</th>
              <th className="py-3 px-4">Caption</th>
              <th className="py-3 px-4 text-center rounded-tr-lg">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {tableData.map((row, index) => (
              <tr key={index} className="transition-colors hover:bg-slate-50/50">
                <td className="py-3 px-4 text-center">
                  <div className={`w-6 h-6 mx-auto rounded-full flex items-center justify-center text-xs font-bold ${
                    row.rank === 1 ? 'bg-yellow-400 text-yellow-900' :
                    row.rank === 2 ? 'bg-slate-300 text-slate-800' :
                    row.rank === 3 ? 'bg-amber-600 text-white' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {row.rank}
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold ${
                      row.brandInitial === 'B' ? 'bg-slate-900' :
                      row.brandInitial === 'M' ? 'bg-purple-500' :
                      row.brandInitial === 'A' ? 'bg-orange-300' : 'bg-blue-500'
                    }`}>
                      {row.brandInitial}
                    </div>
                    <span className="text-sm font-semibold text-slate-700">{row.brand}</span>
                  </div>
                </td>
                {!isAudienceBased && <td className="py-3 px-4 text-sm font-semibold text-slate-600 text-center">{row.views}</td>}
                <td className="py-3 px-4 text-sm font-semibold text-slate-600 text-center">{row.likes}</td>
                <td className="py-3 px-4 text-sm font-semibold text-slate-600 text-center">{row.comments}</td>
                <td className="py-3 px-4 text-sm font-semibold text-slate-600 text-center">{row.shares}</td>
                {!isAudienceBased && <td className="py-3 px-4 text-sm font-semibold text-slate-600 text-center">{row.saves}</td>}
                <td className="py-3 px-4 text-sm font-semibold text-slate-600 text-center">{row.engRate}</td>
                <td className="py-3 px-4 text-xs font-medium text-slate-500 max-w-xs truncate" title={row.caption}>
                  {row.caption}
                </td>
                <td className="py-3 px-4 text-center relative">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuId(openMenuId === row.id ? null : row.id);
                    }}
                    className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-[#003870] transition-all"
                    title="Actions"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="1" />
                      <circle cx="12" cy="5" r="1" />
                      <circle cx="12" cy="19" r="1" />
                    </svg>
                  </button>

                  {openMenuId === row.id && (
                    <div 
                      ref={menuRef}
                      className="absolute right-0 top-full z-[100] mt-1 w-48 bg-white rounded-2xl shadow-2xl border border-[#c2c6d3]/20 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                    >
                      <button 
                        onClick={() => {
                          setSelectedPostId(row.id);
                          setOpenMenuId(null);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-[#003870] hover:bg-[#f3f4f5] transition-all"
                      >
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="16" x2="12" y2="12"></line>
                            <line x1="12" y1="8" x2="12.01" y2="8"></line>
                          </svg>
                        </div>
                        View Details
                      </button>
                      <a 
                        href={cleanFbUrl(row.postUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setOpenMenuId(null)}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-[#003870] border-t border-slate-50 hover:bg-[#f3f4f5] transition-all"
                      >
                        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-[#2563eb]">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                            <polyline points="15 3 21 3 21 9"></polyline>
                            <line x1="10" y1="14" x2="21" y2="3"></line>
                          </svg>
                        </div>
                        View on Platform
                      </a>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {allRankedData.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20">
            <p className="text-sm font-semibold text-[#727782]">No video data available for this selection</p>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100">
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

      {/* Post Details Modal */}
      {selectedPostId && (
        <PostDetailsModal 
          postId={selectedPostId} 
          onClose={() => setSelectedPostId(null)} 
        />
      )}
    </div>
  );
}
