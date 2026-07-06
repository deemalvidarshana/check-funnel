import React, { useState } from 'react';
import CalendarDay from './CalendarDay';
import CalendarPost from './CalendarPost';
import PostDetailsModal from './PostDetailsModal';
import { contentTypeMatchesFilter } from '../../../utils/contentTypes';

const getPostPlatforms = (platforms) => {
  if (Array.isArray(platforms)) {
    return platforms.map((platform) => String(platform).toLowerCase());
  }

  if (typeof platforms === 'string') {
    return platforms
      .split(',')
      .map((platform) => platform.trim().toLowerCase())
      .filter(Boolean);
  }

  return [];
};

const CalendarGrid = ({
  view,
  currentDate,
  posts,
  filters,
  isLoading,
  readOnly = false,
  onPrevWeek,
  onNextWeek
}) => {
  const [selectedPost, setSelectedPost] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // ── Dynamic Date Calculations ──
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed
  
  // Get number of days in current month
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  // Get starting day of the month (0=Sun, 1=Mon, ...)
  const startDay = new Date(year, month, 1).getDay();
  const weekStart = new Date(currentDate);
  weekStart.setDate(currentDate.getDate() - currentDate.getDay());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  const formatWeekLabel = (date) => (
    date.toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
    })
  );

  // ── Filter and Parse Posts ──
  const filteredPosts = posts.filter(p => {
    // 1. Basic Filters (Case-Insensitive)
    const matchesPlatform = !filters.platform || filters.platform === 'All Platforms' || getPostPlatforms(p.platforms).some(plat => plat === filters.platform.toLowerCase());
    
    const matchesType = contentTypeMatchesFilter(p.contentType, filters.contentType);
    
    const matchesStatus = !filters.status || filters.status === 'All Statuses' || 
                         (p.status && p.status.toLowerCase() === filters.status.toLowerCase());

    if (!matchesPlatform || !matchesType || !matchesStatus) return false;

    // 2. Date Filter (Check if post date matches current month/year)
    if (!p.date) return false;

    if (view === 'week') return true;

    // Check if it's in YYYY-MM-DD format
    if (p.date.includes('-') && p.date.split('-')[0].length === 4) {
      const postDate = new Date(p.date);
      if (!isNaN(postDate.getTime())) {
         return postDate.getMonth() === month && postDate.getFullYear() === year;
      }
    }
    
    // Fallback for 'DD-Mon' format (e.g., '01-May')
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const currentMonthName = monthNames[month];
    
    if (p.date.includes(currentMonthName) || p.date.toLowerCase().includes(currentMonthName.toLowerCase())) {
       // It matches the month, assume it belongs to the current year being viewed
       return true;
    }

    return false;
  });

  const handlePostClick = (post) => {
    setSelectedPost(post);
    setIsModalOpen(true);
  };

  const renderDays = () => {
    const days = [];
    
    if (isLoading) {
      return Array(35).fill(0).map((_, i) => (
        <div key={i} className="h-32 rounded-2xl bg-slate-100 animate-pulse border border-slate-200/50"></div>
      ));
    }

    if (view === 'month') {
      // Empty days from previous month
      const prevMonthLastDay = new Date(year, month, 0).getDate();
      for (let i = 0; i < startDay; i++) {
        const dayNum = prevMonthLastDay - startDay + i + 1;
        days.push(<CalendarDay key={`prev-${i}`} isCurrentMonth={false} day={dayNum} view={view} />);
      }

      // Days of current month
      for (let d = 1; d <= daysInMonth; d++) {
        const dayPosts = filteredPosts.filter(p => {
          if (!p.date) return false;
          
          // YYYY-MM-DD format
          if (p.date.includes('-') && p.date.split('-')[0].length === 4) {
             const parts = p.date.split('-');
             if (parts.length === 3) {
                return parseInt(parts[2], 10) === d;
             }
          }

          // Fallback for DD-Mon
          const pDate = new Date(p.date);
          if (!isNaN(pDate.getTime())) {
             return pDate.getDate() === d;
          }
          
          const dayStr = d < 10 ? `0${d}` : `${d}`;
          return p.date.startsWith(dayStr);
        });

        const isToday = d === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();

        days.push(
          <CalendarDay key={d} day={d} isToday={isToday} isCurrentMonth={true} view={view}>
            {dayPosts.map((post, idx) => (
              <div key={idx} onClick={(e) => { e.stopPropagation(); handlePostClick(post); }}>
                <CalendarPost 
                  {...post} 
                  title={post.visualCopy || post.title}
                  type={post.status || post.type}
                  view={view} 
                />
              </div>
            ))}
          </CalendarDay>
        );
      }
    } else {
      // Week view
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());

      for (let i = 0; i < 7; i++) {
        const d = new Date(startOfWeek);
        d.setDate(startOfWeek.getDate() + i);
        
        const dayNum = d.getDate();
        const isToday = d.toDateString() === new Date().toDateString();
        
        const dayPosts = filteredPosts.filter(p => {
          if (!p.date) return false;
          
          if (p.date.includes('-') && p.date.split('-')[0].length === 4) {
             const parts = p.date.split('-');
             if (parts.length === 3) {
                 const postYear = parseInt(parts[0], 10);
                 const postMonth = parseInt(parts[1], 10) - 1;
                 const postDay = parseInt(parts[2], 10);
                 return postYear === d.getFullYear() && postMonth === d.getMonth() && postDay === d.getDate();
             }
          }

          // Fallback for DD-Mon
          const pDate = new Date(p.date);
          if (!isNaN(pDate.getTime())) {
             // If the day and month match, consider it a match for the week view too
             return pDate.getDate() === d.getDate() && pDate.getMonth() === d.getMonth();
          }
          
          const dayStr = d.getDate() < 10 ? `0${d.getDate()}` : `${d.getDate()}`;
          return p.date.startsWith(dayStr);
        });

        days.push(
          <CalendarDay key={i} day={dayNum} isToday={isToday} isCurrentMonth={d.getMonth() === month} view={view}>
            {dayPosts.map((post, idx) => (
              <div key={idx} onClick={(e) => { e.stopPropagation(); handlePostClick(post); }}>
                <CalendarPost 
                  {...post} 
                  title={post.visualCopy || post.title}
                  type={post.status || post.type}
                  view={view} 
                />
              </div>
            ))}
          </CalendarDay>
        );
      }
    }

    return days;
  };

  return (
    <div className="bg-slate-50/50 p-2 sm:p-6 rounded-[32px] border border-slate-200/60 shadow-xl shadow-slate-200/20 overflow-hidden flex flex-col">
      <div className="overflow-x-auto no-scrollbar">
        <div className="min-w-[850px] lg:min-w-0">
          <div className="grid grid-cols-7 mb-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-center py-2">
                <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-[0.2em]">{day}</span>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1.5 sm:gap-3">
            {renderDays()}
          </div>
        </div>
      </div>

      {view === 'week' && (
        <div className="mt-5 flex items-center justify-between border-t border-slate-200/70 px-1 pt-4">
          <div className="text-sm font-bold text-slate-500">
            Week of <span className="text-[#003870]">{formatWeekLabel(weekStart)} - {formatWeekLabel(weekEnd)}</span>
          </div>
          <div className="flex items-center gap-5">
            <button
              type="button"
              onClick={onPrevWeek}
              className="material-symbols-outlined text-[24px] text-slate-300 transition-all hover:text-[#003870] active:scale-90 disabled:opacity-40"
              disabled={!onPrevWeek}
              title="Previous week"
            >
              chevron_left
            </button>
            <button
              type="button"
              onClick={onNextWeek}
              className="material-symbols-outlined text-[24px] text-[#003870] transition-all hover:translate-x-0.5 active:scale-90 disabled:opacity-40"
              disabled={!onNextWeek}
              title="Next week"
            >
              chevron_right
            </button>
          </div>
        </div>
      )}

      <PostDetailsModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        post={selectedPost} 
        hideFooter={readOnly}
      />
    </div>
  );
};

export default CalendarGrid;
