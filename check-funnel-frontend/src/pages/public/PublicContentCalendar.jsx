import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import FilterBar from '../../components/social-media/calendar/FilterBar';
import CalendarGrid from '../../components/social-media/calendar/CalendarGrid';
import ReferenceViewerModal from '../../components/social-media/calendar/ReferenceViewerModal';
import CalendarTable from '../social-media/components/CalendarTable';
import { getPublicClientInfo, getPublicContentCalendars } from '../../api/publicInsights';

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

const CheckFunnelBranding = () => (
  <>
    <div className="p-6 sm:p-10 rounded-[32px] bg-[linear-gradient(135deg,#003870_0%,#005cb8_100%)] text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 group">
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 transition-transform group-hover:scale-110 duration-1000"></div>
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24 transition-transform group-hover:scale-110 duration-1000"></div>

      <div className="relative z-10 text-center md:text-left">
        <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
          <h4 className="text-xl sm:text-2xl font-black tracking-tight">Check Funnel</h4>
          <div className="px-2 py-0.5 rounded-md bg-white/10 border border-white/20 text-[8px] font-bold tracking-widest uppercase">
            Verified
          </div>
        </div>
        <p className="text-xs sm:text-sm text-blue-100 font-medium opacity-80 max-w-sm">
          End-to-end performance marketing & content strategy optimization platform.
        </p>

        <div className="flex flex-col sm:flex-row items-center md:items-start justify-center md:justify-start gap-x-6 gap-y-3 mt-4 pt-4 border-t border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-blue-300">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
            </div>
            <span className="text-[11px] font-bold text-white">+94 77 780 9062</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-blue-300">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
            </div>
            <span className="text-[11px] font-bold text-white">mail@checkfunnel.com</span>
          </div>
        </div>
      </div>
    </div>

    <div className="text-center py-10 px-4 opacity-40">
      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.3em] mb-1">Powered by</p>
      <span className="text-lg font-black text-[#003870] tracking-tighter">CHECK FUNNEL</span>
    </div>
  </>
);

const PublicContentCalendar = () => {
  const { shareToken } = useParams();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const sharedDate = queryParams.get('date');
  const sharedView = queryParams.get('view') === 'week' ? 'week' : 'month';
  const rawViewType = queryParams.get('viewType');
  const sharedViewType = rawViewType === 'calendar'
    ? 'Calendar View'
    : rawViewType === 'row'
      ? 'Row View'
      : queryParams.get('view') === 'week'
        ? 'Calendar View'
        : 'Row View';
  const initialDate = sharedDate && !isNaN(new Date(sharedDate).getTime())
    ? new Date(sharedDate)
    : new Date();
  const [client, setClient] = useState(null);
  const [posts, setPosts] = useState([]);
  const [currentDate, setCurrentDate] = useState(initialDate);
  const [view, setView] = useState(sharedView);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [referenceModal, setReferenceModal] = useState({ open: false, post: null });
  const [filters, setFilters] = useState({
    platform: 'All Platforms',
    contentType: 'All Content Types',
    client: '',
    status: 'All Statuses',
    viewType: sharedViewType
  });

  useEffect(() => {
    const fetchPublicCalendar = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [clientInfo, calendarData] = await Promise.all([
          getPublicClientInfo(shareToken),
          getPublicContentCalendars(shareToken),
        ]);

        const flattenedPosts = [];
        calendarData.forEach((calendar) => {
          if (calendar.posts) {
            flattenedPosts.push(...calendar.posts.map((post) => ({
              ...post,
              clientName: calendar.name || clientInfo.name,
            })));
          }
        });

        setClient(clientInfo);
        setPosts(flattenedPosts);
      } catch (err) {
        console.error('Failed to load public content calendar', err);
        setError('This content calendar is no longer available or the link is invalid.');
      } finally {
        setIsLoading(false);
      }
    };

    if (shareToken) fetchPublicCalendar();
  }, [shareToken]);

  const filteredPosts = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const currentMonthName = monthNames[month];

    return posts
      .filter((post) => {
        const matchesPlatform = !filters.platform || filters.platform === 'All Platforms' ||
          getPostPlatforms(post.platforms).some((platform) => platform === filters.platform.toLowerCase());

        const matchesType = !filters.contentType || filters.contentType === 'All Content Types' ||
          (post.contentType && post.contentType.toLowerCase() === filters.contentType.toLowerCase());

        const matchesStatus = !filters.status || filters.status === 'All Statuses' ||
          (post.status && post.status.toLowerCase() === filters.status.toLowerCase());

        if (!matchesPlatform || !matchesType || !matchesStatus) return false;
        if (!post.date) return false;
        if (filters.viewType === 'Calendar View' && view === 'week') return true;

        if (post.date.includes('-') && post.date.split('-')[0].length === 4) {
          const postDate = new Date(post.date);
          if (!isNaN(postDate.getTime())) {
            return postDate.getMonth() === month && postDate.getFullYear() === year;
          }
        }

        return post.date.includes(currentMonthName) || post.date.toLowerCase().includes(currentMonthName.toLowerCase());
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [posts, currentDate, filters, view]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(new Date(currentDate).setMonth(currentDate.getMonth() - 1)));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(new Date(currentDate).setMonth(currentDate.getMonth() + 1)));
  };

  const handlePrevWeek = () => {
    setCurrentDate(new Date(new Date(currentDate).setDate(currentDate.getDate() - 7)));
  };

  const handleNextWeek = () => {
    setCurrentDate(new Date(new Date(currentDate).setDate(currentDate.getDate() + 7)));
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleViewReference = (row) => {
    setReferenceModal({ open: true, post: row });
  };

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'PUBLISHED': return 'bg-green-50 text-green-700 border-green-200';
      case 'SCHEDULED': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'DRAFT': return 'bg-slate-100 text-slate-600 border-slate-200';
      default: return 'bg-slate-50 text-slate-500 border-slate-200';
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md rounded-3xl border border-red-100 bg-white p-8 text-center shadow-xl shadow-slate-200/60">
          <span className="material-symbols-outlined text-4xl text-red-500">link_off</span>
          <h1 className="mt-4 text-2xl font-extrabold text-slate-900">Calendar unavailable</h1>
          <p className="mt-2 text-sm font-medium text-slate-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8fafc] px-4 py-8 sm:px-8">
      <ReferenceViewerModal
        isOpen={referenceModal.open}
        onClose={() => setReferenceModal({ open: false, post: null })}
        post={referenceModal.post}
      />

      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6">
        <section className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex items-center gap-4">
            {client?.logoData ? (
              <img
                src={`${import.meta.env.VITE_API_BASE_URL || '/api'}/public-insights/logo/${shareToken}`}
                alt={client.name}
                className="h-16 w-16 rounded-2xl border border-slate-200 bg-white object-cover shadow-sm"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#003870] text-xl font-extrabold text-white shadow-sm">
                {client?.name?.charAt(0) || 'C'}
              </div>
            )}
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.28em] text-slate-400">Public Content Calendar</p>
              <h1 className="mt-1 text-4xl font-extrabold tracking-tight text-slate-950 sm:text-5xl">
                {client?.name || 'Content Calendar'}
              </h1>
              <p className="mt-2 text-base font-medium text-slate-500">
                Read-only content schedule shared for review.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center justify-between rounded-full border border-slate-200 bg-white p-1 shadow-sm">
              <button
                onClick={handlePrevMonth}
                className="material-symbols-outlined rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-50 hover:text-[#003870]"
              >
                chevron_left
              </button>
              <span className="min-w-[150px] px-3 text-center text-sm font-extrabold uppercase tracking-tight text-slate-800 sm:text-base">
                {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
              </span>
              <button
                onClick={handleNextMonth}
                className="material-symbols-outlined rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-50 hover:text-[#003870]"
              >
                chevron_right
              </button>
            </div>

            {filters.viewType !== 'Row View' && (
              <div className="flex rounded-full border border-slate-200/70 bg-slate-100/80 p-1 shadow-sm">
                <button
                  type="button"
                  onClick={() => setView('month')}
                  className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${
                    view === 'month'
                      ? 'bg-white text-[#003870] shadow-sm'
                      : 'text-slate-500 hover:text-[#003870]'
                  }`}
                >
                  Month
                </button>
                <button
                  type="button"
                  onClick={() => setView('week')}
                  className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${
                    view === 'week'
                      ? 'bg-white text-[#003870] shadow-sm'
                      : 'text-slate-500 hover:text-[#003870]'
                  }`}
                >
                  Week
                </button>
              </div>
            )}
          </div>
        </section>

        <FilterBar
          filters={filters}
          onFilterChange={handleFilterChange}
          clients={[]}
          hideClientFilter
        />

        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-[#003870]"></div>
          </div>
        ) : filters.viewType === 'Row View' ? (
          <div className="overflow-x-auto overflow-y-visible rounded-[32px] border border-slate-200 bg-white shadow-sm">
            <CalendarTable
              data={filteredPosts}
              getStatusColor={getStatusColor}
              onOpenReference={handleViewReference}
              variant="contentRow"
              readOnly
              hideActions
            />
          </div>
        ) : (
          <CalendarGrid
            view={view}
            currentDate={currentDate}
            posts={filteredPosts}
            filters={filters}
            isLoading={isLoading}
            readOnly
            onPrevWeek={handlePrevWeek}
            onNextWeek={handleNextWeek}
          />
        )}

        {!isLoading && <CheckFunnelBranding />}
      </div>
    </main>
  );
};

export default PublicContentCalendar;
