import React from 'react';

const CalendarPost = ({ type, title, time, thumbnail, icon, pillar, contentType, view, caption }) => {
  const isWeekView = view === 'week';

  const getStyles = () => {
    switch (type) {
      case 'Draft':
        return {
          bg: 'border-blue-200 bg-blue-50/30',
          text: 'text-blue-700',
          dot: 'bg-blue-400',
          label: 'Draft'
        };
      case 'Scheduled':
        return {
          bg: 'border-indigo-200 bg-indigo-50/30',
          text: 'text-indigo-700',
          dot: 'bg-indigo-400',
          label: 'Scheduled'
        };
      case 'Published':
        return {
          bg: 'border-emerald-200 bg-emerald-50/30',
          text: 'text-emerald-700',
          dot: 'bg-emerald-400',
          label: 'Published'
        };
      default:
        return {
          bg: 'border-slate-200 bg-slate-50/30',
          text: 'text-slate-700',
          dot: 'bg-slate-400',
          label: ''
        };
    }
  };

  const styles = getStyles();

  return (
    <div className={`${isWeekView ? 'py-4 px-3 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md' : 'py-2.5 overflow-hidden border-b border-slate-100 last:border-b-0'} transition-all cursor-pointer group`}>
      <div className={`flex flex-col gap-1.5 ${isWeekView ? 'mb-3' : 'mb-2 px-1'}`}>
        <span className={`${isWeekView ? 'text-[10px]' : 'text-[8px]'} font-extrabold px-1.5 py-0.5 rounded-md bg-white border ${styles.bg.split(' ')[0]} text-slate-600 uppercase tracking-tight truncate w-fit max-w-full`}>
          {pillar || 'General'}
        </span>
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
        <span className={`${isWeekView ? 'text-[11px]' : 'text-[10px]'} font-extrabold text-slate-500`}>{time}</span>
        <div className="h-6 w-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center group-hover:bg-[#003870] group-hover:border-[#003870] transition-all shadow-sm">
          <span className="material-symbols-outlined text-[14px] text-[#003870] group-hover:text-white">open_in_new</span>
        </div>
      </div>
    </div>
  );
};

export default CalendarPost;
