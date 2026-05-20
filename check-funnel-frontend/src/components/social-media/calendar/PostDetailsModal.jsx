import React, { useEffect, useState } from 'react';

const PLATFORM_FIELDS = [
  {
    id: 'facebook',
    label: 'Facebook Link',
    key: 'fbLink',
    placeholder: 'https://www.facebook.com/...',
    Icon: () => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
      </svg>
    )
  },
  {
    id: 'instagram',
    label: 'Instagram Link',
    key: 'igLink',
    placeholder: 'https://www.instagram.com/...',
    Icon: () => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
      </svg>
    )
  },
  {
    id: 'tiktok',
    label: 'TikTok Link',
    key: 'ttLink',
    placeholder: 'https://www.tiktok.com/...',
    Icon: () => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"></path>
      </svg>
    )
  }
];

const normalizeUrl = (url) => {
  const trimmedUrl = String(url || '').trim();
  if (!trimmedUrl) return '';
  return /^https?:\/\//i.test(trimmedUrl) ? trimmedUrl : `https://${trimmedUrl}`;
};

const getPlatformPreviews = (links) => (
  PLATFORM_FIELDS
    .map((field) => ({
      ...field,
      href: normalizeUrl(links[field.key])
    }))
    .filter((field) => field.href)
);

const formatPostDate = (post) => {
  if (!post?.date) return `Feb ${post?.day || ''}, 2024`;

  const date = new Date(post.date);
  if (!isNaN(date.getTime())) {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric'
    });
  }

  return post.date;
};

const getInitialLinks = (post) => ({
  fbLink: post?.fbLink || post?.facebookLink || '',
  igLink: post?.igLink || post?.instagramLink || '',
  ttLink: post?.ttLink || post?.tiktokLink || ''
});

const PlatformButton = ({ field, href }) => {
  const content = (
    <span className="h-10 w-10 rounded-xl bg-white border border-slate-200 text-[#003870] flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 shadow-sm hover:bg-[#003870] hover:text-white hover:border-[#003870] hover:shadow-lg hover:shadow-[#003870]/20">
      <field.Icon />
    </span>
  );

  if (!href) return <button type="button">{content}</button>;

  return (
    <a href={href} target="_blank" rel="noreferrer" title={`Open ${field.label.replace(' Link', '')}`}>
      {content}
    </a>
  );
};

const PlatformPreview = ({ post, links }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [thumbnails, setThumbnails] = useState({});
  const [imageErrors, setImageErrors] = useState({});
  const linkedPlatforms = getPlatformPreviews(links);
  const activePlatform = linkedPlatforms[activeIndex % Math.max(linkedPlatforms.length, 1)];
  const activeThumbnail = activePlatform ? thumbnails[activePlatform.id] : post?.thumbnail;
  const hasImageError = activePlatform ? imageErrors[activePlatform.id] : false;

  useEffect(() => {
    setActiveIndex(0);
    setThumbnails({});
    setImageErrors({});

    if (linkedPlatforms.length === 0) return undefined;

    let ignore = false;
    const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api';

    linkedPlatforms.forEach(async (platform) => {
      try {
        const response = await fetch(`${baseUrl}/competitors/thumbnail?url=${encodeURIComponent(platform.href)}`);
        if (!response.ok || ignore) return;

        const data = await response.json();
        if (data.thumbnail && !ignore) {
          setThumbnails((prev) => ({
            ...prev,
            [platform.id]: `${baseUrl}/competitors/proxy-image?url=${encodeURIComponent(data.thumbnail)}`
          }));
        }
      } catch {
        // Keep the platform fallback card if the thumbnail endpoint cannot resolve an image.
      }
    });

    return () => {
      ignore = true;
    };
  }, [links.fbLink, links.igLink, links.ttLink]);

  useEffect(() => {
    if (linkedPlatforms.length <= 1) return undefined;

    const timer = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % linkedPlatforms.length);
    }, 5000);

    return () => window.clearInterval(timer);
  }, [linkedPlatforms.length]);

  if (!activePlatform) {
    return post?.thumbnail ? (
      <img src={post.thumbnail} alt="Post Preview" className="rounded-xl shadow-lg max-h-[300px] object-cover" />
    ) : (
      <div className="w-full aspect-square bg-white rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-300 gap-3">
        <span className="material-symbols-outlined text-4xl">image</span>
        <span className="text-xs font-bold uppercase tracking-wider">No Preview</span>
      </div>
    );
  }

  const openLabel = `Open ${activePlatform.label}`;

  return (
    <div className="flex w-full flex-col md:h-full md:min-h-[520px]">
      <a
        href={activePlatform.href}
        target="_blank"
        rel="noreferrer"
        className="group relative block w-full overflow-hidden rounded-3xl bg-[#003870] shadow-xl shadow-slate-300/60 aspect-[4/5] sm:aspect-[16/10] md:aspect-auto md:min-h-0 md:flex-1"
        title={openLabel}
      >
        {activeThumbnail && !hasImageError ? (
          <img
            src={activeThumbnail}
            alt={`${activePlatform.label} preview`}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            onError={() => setImageErrors((prev) => ({ ...prev, [activePlatform.id]: true }))}
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center bg-[linear-gradient(135deg,#003870_0%,#005cb8_100%)] text-white">
            <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
              <activePlatform.Icon />
            </div>
            <span className="text-xs font-black uppercase tracking-[0.2em] text-blue-100">
              {activePlatform.label}
            </span>
            <span className="mt-2 max-w-[180px] text-center text-xs font-semibold text-white/70">
              Thumbnail unavailable. Click to open the post.
            </span>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/65 via-transparent to-slate-950/20 opacity-90"></div>
        <div className="absolute left-3 top-3 inline-flex items-center gap-2 rounded-full bg-white/90 px-2.5 py-1.5 text-[#003870] shadow-lg backdrop-blur-md sm:left-4 sm:top-4 sm:px-3 sm:py-2">
          <activePlatform.Icon />
          <span className="text-[9px] font-black uppercase tracking-widest sm:text-[10px]">{activePlatform.label}</span>
        </div>
        <div className="absolute bottom-3 left-3 flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-black/25 text-white shadow-lg backdrop-blur-md transition-transform group-hover:scale-105 sm:bottom-4 sm:left-4 sm:h-11 sm:w-11">
          <svg className="h-4 w-4 ml-0.5 sm:h-5 sm:w-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
        <div className="absolute bottom-4 right-4 rounded-full bg-white/90 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-[#003870] opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
          View Post
        </div>
      </a>

      {linkedPlatforms.length > 1 && (
        <div className="mt-4 flex shrink-0 items-center justify-center gap-2">
          {linkedPlatforms.map((platform, index) => (
            <button
              key={platform.id}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={`flex h-8 w-8 items-center justify-center rounded-full border transition-all ${
                index === activeIndex
                  ? 'border-[#003870] bg-[#003870] text-white shadow-md shadow-[#003870]/20'
                  : 'border-slate-200 bg-white text-slate-400 hover:text-[#003870]'
              }`}
              title={`Show ${platform.label}`}
            >
              <platform.Icon />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const PostDetailsModal = ({
  isOpen,
  onClose,
  post,
  linkEditMode = false,
  hidePreview = false,
  hideFooter = false,
  onSave
}) => {
  const [links, setLinks] = useState(getInitialLinks(post));
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setLinks(getInitialLinks(post));
  }, [post]);

  if (!isOpen || !post) return null;

  const updateLink = (key, value) => {
    setLinks((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!onSave) return;

    const trimmedLinks = {
      fbLink: links.fbLink.trim(),
      igLink: links.igLink.trim(),
      ttLink: links.ttLink.trim()
    };
    const linkedPlatforms = PLATFORM_FIELDS
      .filter((field) => trimmedLinks[field.key])
      .map((field) => field.id);

    setIsSaving(true);
    try {
      await onSave({
        ...trimmedLinks,
        ...(linkedPlatforms.length > 0 ? { platforms: linkedPlatforms } : {})
      });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-300">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      <div className={`relative bg-white rounded-[28px] border border-white/80 shadow-[0_24px_80px_-36px_rgba(15,23,42,0.65)] w-full ${hidePreview ? 'max-w-2xl' : 'max-w-2xl'} overflow-hidden animate-in zoom-in-95 duration-200 max-h-[calc(100vh-1rem)] sm:max-h-[90vh] overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden`}>
        <div className={hidePreview ? 'h-full' : 'flex flex-col md:flex-row h-full'}>
          {!hidePreview && (
            <div className="md:w-5/12 bg-slate-50 flex items-stretch justify-center p-4 sm:p-6 border-b md:border-b-0 md:border-r border-slate-100">
              <PlatformPreview post={post} links={links} />
            </div>
          )}

          <div className={`${hidePreview ? 'p-6 sm:p-8' : 'p-6 sm:p-8 md:w-7/12'} flex flex-col`}>
            <div className="flex items-start justify-between gap-4 mb-6 pb-5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                  post.type === 'Published' || post.type === 'Completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-blue-50 text-blue-700 border border-blue-100'
                }`}>
                  {post.type || post.status || 'DRAFT'}
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-widest">{post.contentType}</span>
              </div>
              <button onClick={onClose} className="w-10 h-10 flex shrink-0 items-center justify-center bg-slate-50 hover:bg-slate-100 rounded-full transition-colors group">
                <span className="material-symbols-outlined text-slate-400 group-hover:text-slate-600 transition-colors">close</span>
              </button>
            </div>

            <h2 className="text-[28px] font-extrabold text-slate-950 mb-2 leading-tight">{post.title || post.visualCopy || post.contentType}</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-5">{post.pillar}</p>

            <div className="space-y-4 flex-grow">
              {post.visualCopy && (
                <div>
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Visual Copy</h4>
                  <p className="text-sm text-slate-900 font-bold leading-relaxed bg-[#003870]/5 p-4 rounded-2xl border border-[#003870]/10 shadow-inner shadow-white/60">
                    "{post.visualCopy}"
                  </p>
                </div>
              )}

              <div>
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Caption</h4>
                <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-inner shadow-white/70">
                  {post.caption || 'No caption provided'}
                </p>
              </div>

              <div className={linkEditMode ? 'space-y-5' : 'grid grid-cols-2 gap-8'}>
                <div>
                  <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3">Platform Links</h4>
                  {linkEditMode ? (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {PLATFORM_FIELDS.map((field) => (
                        <label key={field.id} className="block">
                          <span className="mb-1.5 flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                            <field.Icon />
                            {field.label}
                          </span>
                          <input
                            type="url"
                            value={links[field.key]}
                            onChange={(event) => updateLink(field.key, event.target.value)}
                            placeholder={field.placeholder}
                            className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-[#003870] focus:bg-white focus:ring-4 focus:ring-[#003870]/10"
                          />
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div className="flex gap-3">
                      {PLATFORM_FIELDS.map((field) => (
                        <PlatformButton key={field.id} field={field} href={normalizeUrl(links[field.key])} />
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3">Scheduled For</h4>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 shadow-sm">
                      <span className="material-symbols-outlined text-[20px]">calendar_today</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800 leading-none mb-1">{post.time}</p>
                      <p className="text-[11px] font-medium text-slate-500">{formatPostDate(post)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {!hideFooter && (
              <div className="mt-7 pt-5 border-t border-slate-100 flex gap-4">
                {linkEditMode ? (
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex-grow h-12 bg-[#003870] text-white rounded-2xl text-sm font-bold shadow-lg shadow-[#003870]/20 hover:scale-[1.01] active:scale-95 transition-all hover:bg-[#002b56] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100 inline-flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[20px]">{isSaving ? 'sync' : 'save'}</span>
                    {isSaving ? 'Saving...' : 'Save Links'}
                  </button>
                ) : (
                  <>
                    <button className="flex-grow h-12 bg-[#003870] text-white rounded-2xl text-sm font-bold shadow-lg shadow-[#003870]/20 hover:scale-[1.02] active:scale-95 transition-all hover:bg-[#002b56]">
                      Edit Strategy
                    </button>
                    <button className="w-12 h-12 border border-slate-200 text-slate-400 rounded-2xl hover:bg-red-50 hover:text-red-500 hover:border-red-100 transition-all flex items-center justify-center">
                      <span className="material-symbols-outlined text-[20px]">delete</span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostDetailsModal;
