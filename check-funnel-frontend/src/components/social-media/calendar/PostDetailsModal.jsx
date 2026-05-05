import React from 'react';

const PostDetailsModal = ({ isOpen, onClose, post }) => {
  if (!isOpen || !post) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      ></div>
      
      {/* Modal Content */}
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex flex-col md:flex-row h-full">
          {/* Left: Preview/Image */}
          <div className="md:w-5/12 bg-slate-50 flex items-center justify-center p-6 border-b md:border-b-0 md:border-r border-slate-100">
            {post.thumbnail ? (
              <img src={post.thumbnail} alt="Post Preview" className="rounded-xl shadow-lg max-h-[300px] object-cover" />
            ) : (
              <div className="w-full aspect-square bg-white rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-300 gap-3">
                <span className="material-symbols-outlined text-4xl">image</span>
                <span className="text-xs font-bold uppercase tracking-wider">No Preview</span>
              </div>
            )}
          </div>

          {/* Right: Details */}
          <div className="md:w-7/12 p-8 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                  post.type === 'Published' || post.type === 'Completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-blue-50 text-blue-700 border border-blue-100'
                }`}>
                  {post.type}
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{post.contentType}</span>
              </div>
              <button onClick={onClose} className="w-10 h-10 flex items-center justify-center hover:bg-slate-100 rounded-full transition-colors group">
                <span className="material-symbols-outlined text-slate-400 group-hover:text-slate-600 transition-colors">close</span>
              </button>
            </div>

            <h2 className="text-2xl font-extrabold text-slate-900 mb-2 leading-tight">{post.title}</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-6">{post.pillar}</p>

            <div className="space-y-4 flex-grow">
              {post.visualCopy && (
                <div>
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Visual Copy</h4>
                  <p className="text-sm text-slate-800 font-bold leading-relaxed bg-[#003870]/5 p-4 rounded-2xl border border-[#003870]/10">
                    "{post.visualCopy}"
                  </p>
                </div>
              )}

              <div>
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Caption</h4>
                <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  {post.caption || 'No caption provided'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div>
                  <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3">Platform Links</h4>
                  <div className="flex gap-3">
                    {/* Facebook */}
                    <button className="h-10 w-10 rounded-xl bg-white border border-slate-200 text-[#003870] flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 shadow-sm hover:bg-[#003870] hover:text-white hover:border-[#003870] hover:shadow-lg hover:shadow-[#003870]/20">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                      </svg>
                    </button>

                    {/* Instagram */}
                    <button className="h-10 w-10 rounded-xl bg-white border border-slate-200 text-[#003870] flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 shadow-sm hover:bg-[#003870] hover:text-white hover:border-[#003870] hover:shadow-lg hover:shadow-[#003870]/20">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                      </svg>
                    </button>

                    {/* TikTok */}
                    <button className="h-10 w-10 rounded-xl bg-white border border-slate-200 text-[#003870] flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 shadow-sm hover:bg-[#003870] hover:text-white hover:border-[#003870] hover:shadow-lg hover:shadow-[#003870]/20">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"></path>
                      </svg>
                    </button>
                  </div>
                </div>
                <div>
                  <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3">Scheduled For</h4>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 shadow-sm">
                      <span className="material-symbols-outlined text-[20px]">calendar_today</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800 leading-none mb-1">{post.time}</p>
                      <p className="text-[11px] font-medium text-slate-500">Feb {post.day}, 2024</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 flex gap-4">
              <button className="flex-grow h-12 bg-[#003870] text-white rounded-2xl text-sm font-bold shadow-lg shadow-[#003870]/20 hover:scale-[1.02] active:scale-95 transition-all hover:bg-[#002b56]">
                Edit Strategy
              </button>
              <button className="w-12 h-12 border border-slate-200 text-slate-400 rounded-2xl hover:bg-red-50 hover:text-red-500 hover:border-red-100 transition-all flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">delete</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostDetailsModal;
