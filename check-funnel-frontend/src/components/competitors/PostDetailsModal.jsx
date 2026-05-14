import React, { useState, useEffect } from 'react';
import api from '../../api';
import { getPublicPostDetails } from '../../api/publicInsights';

const cleanFbUrl = (url) => {
  if (!url) return '#';
  return url.split('&fbclid=')[0].split('?fbclid=')[0].split('/&fbclid=')[0];
};

export default function PostDetailsModal({ postId, onClose, isApify }) {
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [thumbnail, setThumbnail] = useState('');
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    if (!postId) return;
    async function fetchDetails() {
      setLoading(true);
      try {
        let postData;
        if (postId && window.location.pathname.includes('/public-')) {
          // Extract shareToken from URL if not passed as prop
          const token = postId.shareToken || window.location.pathname.split('/').pop();
          postData = await getPublicPostDetails(token, postId);
        } else {
          const endpoint = isApify ? `/apify/post/${postId}` : `/competitors/post/${postId}`;
          const res = await api.get(endpoint);
          postData = res.data;
        }
        
        setPost(postData);

        if (postData.postUrl) {
          try {
            // Thumbnails are public in CompetitorController
            const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
            const thumbRes = await fetch(`${baseUrl}/competitors/thumbnail?url=${encodeURIComponent(postData.postUrl)}`);
            if (thumbRes.ok) {
              const thumbData = await thumbRes.json();
              if (thumbData.thumbnail) {
                const proxyUrl = `${baseUrl}/competitors/proxy-image?url=${encodeURIComponent(thumbData.thumbnail)}`;
                setThumbnail(proxyUrl);
              }
            }
          } catch (err) {
            console.error("Failed to fetch modal thumbnail", err);
          }
        }
      } catch (err) {
        console.error("Failed to fetch post details", err);
      } finally {
        setLoading(false);
      }
    }
    fetchDetails();
  }, [postId, isApify]);

  if (!postId) return null;

  const imgSrc = thumbnail || post?.imageUrl || '';
  const showFallback = !imgSrc || imgError || loading;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div 
        className="bg-white rounded-[32px] w-full max-w-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col md:flex-row max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left: Content Image */}
        <div className="w-full md:w-[45%] bg-[#f3f4f5] relative aspect-[9/16] md:aspect-auto">
          {!showFallback ? (
            <img 
              src={imgSrc} 
              alt="Post Content" 
              className="w-full h-full object-cover" 
              onError={() => setImgError(true)}
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#003870] via-[#014f99] to-[#2563eb] flex items-center justify-center">
               <div className="flex flex-col items-center gap-4">
                 <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                    {loading ? (
                      <div className="w-6 h-6 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                    ) : (
                      <span className="text-2xl font-black text-white/40">
                        {(post?.trackedAccount?.username || '?').charAt(0).toUpperCase()}
                      </span>
                    )}
                 </div>
                 <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">Loading Media</span>
               </div>
            </div>
          )}
          <button 
            onClick={onClose}
            className="absolute top-4 left-4 md:hidden w-10 h-10 rounded-full bg-black/20 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/40 transition-colors"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Right: Details */}
        <div className="w-full md:w-[55%] p-6 flex flex-col overflow-y-auto">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#f0f5ff] flex items-center justify-center text-[#2563eb] font-bold text-sm">
                {(post?.trackedAccount?.username || '?').charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-[13px] font-bold text-[#2563eb]">@{post?.trackedAccount?.username}</p>
                <p className="text-[11px] font-bold text-[#727782]">{new Date(post?.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="hidden md:flex w-10 h-10 rounded-full bg-slate-50 text-slate-400 items-center justify-center hover:bg-slate-100 transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <div className="flex-1">
            <h2 className="text-xl font-black text-[#191c1d] mb-4 leading-tight">Post Engagement Analysis</h2>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              {[
                (post?.platform?.toLowerCase() === 'instagram' || post?.platform?.toLowerCase() === 'facebook')
                  ? { 
                      label: 'Media Type', 
                      value: post?.rawExtensionData?.media_type ? (post.rawExtensionData.media_type.charAt(0).toUpperCase() + post.rawExtensionData.media_type.slice(1)) : 'Post', 
                      isString: true 
                    }
                  : { label: 'Views', value: post?.views || 0 },
                { label: 'Likes', value: post?.likes || 0 },
                { label: 'Comments', value: post?.commentsCount || 0 },
                { label: 'Shares', value: post?.shares || 0 }
              ].map(m => (
                <div key={m.label} className="bg-[#f8fafc] rounded-2xl p-4 border border-slate-100">
                  <p className="text-[10px] font-bold text-[#727782] uppercase tracking-widest mb-1">{m.label}</p>
                  <p className="text-lg font-black text-[#003870]">
                    {m.isString ? m.value : m.value.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>

            <div className="space-y-2">
               <p className="text-[11px] font-bold text-[#727782] uppercase tracking-widest">Original Caption</p>
               <p className="text-sm text-slate-600 leading-relaxed font-medium">
                 {post?.caption || post?.rawExtensionData?.caption || post?.rawExtensionData?.caption_text || post?.rawExtensionData?.Description || 'No caption available'}
               </p>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 flex gap-3">
             <a 
               href={cleanFbUrl(post?.postUrl)} 
               target="_blank" 
               className="flex-1 h-12 rounded-2xl bg-[#003870] text-white font-bold flex items-center justify-center gap-2 hover:bg-[#002b56] transition-all"
             >
                View on Platform
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                  <polyline points="15 3 21 3 21 9"></polyline>
                  <line x1="10" y1="14" x2="21" y2="3"></line>
                </svg>
             </a>
          </div>
        </div>
      </div>
    </div>
  );
}
