import React from 'react';

const PLATFORM_FIELDS = [
  {
    id: 'facebook',
    keys: ['fbLink', 'facebookLink'],
    Icon: () => (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
      </svg>
    )
  },
  {
    id: 'instagram',
    keys: ['igLink', 'instagramLink'],
    Icon: () => (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.7" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
      </svg>
    )
  },
  {
    id: 'tiktok',
    keys: ['ttLink', 'tiktokLink'],
    Icon: () => (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"></path>
      </svg>
    )
  }
];

const normalizePlatformUrl = (url) => {
  const trimmedUrl = String(url || '').trim();
  if (!trimmedUrl) return '';
  return /^https?:\/\//i.test(trimmedUrl) ? trimmedUrl : `https://${trimmedUrl}`;
};

const getPlatformLink = (post, keys) => {
  const value = keys.map((key) => post?.[key]).find(Boolean);
  return normalizePlatformUrl(value);
};

const getPlatformIcons = (post) => {
  return PLATFORM_FIELDS
    .map((field) => ({
      ...field,
      href: getPlatformLink(post, field.keys)
    }))
    .filter((field) => field.href);
};

const getStatusMeta = (type) => {
  const normalizedStatus = String(type || '').trim().toLowerCase();

  if (normalizedStatus === 'draft') {
    return {
      label: 'Draft',
      shortLabel: 'DR',
      bg: 'border-blue-200 bg-blue-50/30',
      text: 'text-blue-700',
      dot: 'bg-blue-400'
    };
  }

  if (normalizedStatus === 'scheduled') {
    return {
      label: 'Scheduled',
      shortLabel: 'SC',
      bg: 'border-indigo-200 bg-indigo-50/30',
      text: 'text-indigo-700',
      dot: 'bg-indigo-400'
    };
  }

  if (normalizedStatus === 'published') {
    return {
      label: 'Published',
      shortLabel: 'PU',
      bg: 'border-emerald-200 bg-emerald-50/30',
      text: 'text-emerald-700',
      dot: 'bg-emerald-400'
    };
  }

  return {
    label: normalizedStatus ? type : '',
    shortLabel: normalizedStatus ? String(type).slice(0, 2).toUpperCase() : '',
    bg: 'border-slate-200 bg-slate-50/30',
    text: 'text-slate-700',
    dot: 'bg-slate-400'
  };
};

const CalendarPost = (post) => {
  const { type, title, time, pillar, contentType, view, caption } = post;
  const isWeekView = view === 'week';
  const styles = getStatusMeta(type);
  const platformIcons = getPlatformIcons(post);

  return (
    <div className={`${isWeekView ? 'py-4 px-3 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md' : 'py-2.5 overflow-hidden border-b border-slate-100 last:border-b-0'} transition-all cursor-pointer group`}>
      <div className={`flex flex-col gap-1.5 ${isWeekView ? 'mb-3' : 'mb-2 px-1'}`}>
        <div className="flex items-center justify-between gap-1">
          <span className={`${isWeekView ? 'text-[10px]' : 'text-[8px]'} min-w-0 flex-1 font-extrabold px-1.5 py-0.5 rounded-md bg-white border ${styles.bg.split(' ')[0]} text-slate-600 uppercase tracking-tight truncate`}>
            {pillar || 'General'}
          </span>
          {styles.shortLabel && (
            <span
              className={`${isWeekView ? 'text-[9px]' : 'text-[7px]'} shrink-0 rounded-md border px-1.5 py-0.5 font-black uppercase tracking-[0.08em] ${styles.bg} ${styles.text}`}
              title={styles.label}
            >
              {styles.shortLabel}
            </span>
          )}
        </div>
        <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-slate-100/80 w-fit`}>
          <span className={`material-symbols-outlined ${isWeekView ? 'text-[12px]' : 'text-[10px]'} text-slate-500`} style={{ fontVariationSettings: "'FILL' 1" }}>
            {contentType?.toLowerCase().includes('reel') ? 'movie' : 'image'}
          </span>
          <span className={`${isWeekView ? 'text-[10px]' : 'text-[8px]'} font-bold text-slate-500 uppercase truncate`}>{contentType || 'Static'}</span>
        </div>
      </div>
      
      <p className={`${isWeekView ? 'text-sm' : 'text-[10px]'} font-bold text-slate-800 leading-tight line-clamp-2 group-hover:text-[#003870] mb-2`}>
        {title}
      </p>

      {isWeekView && caption && (
        <p className="text-[11px] text-slate-500 line-clamp-3 leading-relaxed mb-4">
          {caption}
        </p>
      )}
      
      <div className={`${isWeekView ? 'mt-auto pt-3 border-t border-slate-100 flex items-center justify-between' : 'mt-2 pt-2 border-t border-slate-100 flex items-center justify-between'}`}>
        <div className="h-6 w-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center group-hover:bg-[#003870] group-hover:border-[#003870] transition-all shadow-sm">
          <span className="material-symbols-outlined text-[14px] text-[#003870] group-hover:text-white">open_in_new</span>
        </div>
        <div className="ml-auto flex min-w-0 items-center gap-1">
          {platformIcons.length > 0 && (
            <div className="flex h-6 items-center gap-1 rounded-lg border border-slate-200 bg-white px-1.5 text-[#003870] shadow-sm">
              {platformIcons.map((platform) => (
                <a
                  key={platform.id}
                  href={platform.href}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(event) => event.stopPropagation()}
                  className="flex items-center justify-center rounded-md transition-transform hover:scale-110"
                  title={`Open ${platform.id}`}
                >
                  <platform.Icon />
                </a>
              ))}
            </div>
          )}
          {time && (
            <span className={`${isWeekView ? 'text-[11px]' : 'text-[10px]'} shrink-0 font-extrabold text-slate-500`}>{time}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default CalendarPost;
