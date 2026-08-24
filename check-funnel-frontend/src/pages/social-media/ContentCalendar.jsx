import React, { useState, useEffect, useMemo } from 'react';
import CalendarHeader from '../../components/social-media/calendar/CalendarHeader';
import FilterBar from '../../components/social-media/calendar/FilterBar';
import CalendarGrid from '../../components/social-media/calendar/CalendarGrid';
import CalendarTable from './components/CalendarTable';
import Toast from '../../components/common/Toast';
import DeleteConfirmationModal from '../../components/common/DeleteConfirmationModal';
import PostDetailsModal from '../../components/social-media/calendar/PostDetailsModal';
import ReferenceViewerModal from '../../components/social-media/calendar/ReferenceViewerModal';
import { createCalendarPost, getCalendars, saveCalendar, updatePost, deletePost } from '../../api/calendar';
import { getClients, toggleShare } from '../../api/client';
import { ALL_CONTENT_TYPES, contentTypeMatchesFilter } from '../../utils/contentTypes';
import { canManageFeature } from '../../utils/permissions';

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

const CONTENT_CALENDAR_FILTERS_KEY = 'content-calendar-filters';
const CONTENT_CALENDAR_DATE_KEY = 'content-calendar-date';
const DEFAULT_CONTENT_CALENDAR_FILTERS = {
  platform: 'All Platforms',
  contentType: ALL_CONTENT_TYPES,
  client: 'All Clients',
  status: 'All Statuses',
  viewType: 'Calendar View'
};

const getInitialContentCalendarFilters = () => {
  try {
    const savedFilters = JSON.parse(sessionStorage.getItem(CONTENT_CALENDAR_FILTERS_KEY) || 'null');
    return savedFilters && typeof savedFilters === 'object'
      ? { ...DEFAULT_CONTENT_CALENDAR_FILTERS, ...savedFilters }
      : DEFAULT_CONTENT_CALENDAR_FILTERS;
  } catch {
    return DEFAULT_CONTENT_CALENDAR_FILTERS;
  }
};

const getInitialContentCalendarDate = () => {
  const savedMonth = sessionStorage.getItem(CONTENT_CALENDAR_DATE_KEY);
  if (!savedMonth || !/^\d{4}-\d{2}$/.test(savedMonth)) return new Date();

  const [year, month] = savedMonth.split('-').map(Number);
  const restoredDate = new Date(year, month - 1, 1);
  return Number.isNaN(restoredDate.getTime()) ? new Date() : restoredDate;
};

const ContentCalendar = () => {
  const [view, setView] = useState('month');
  const [currentDate, setCurrentDate] = useState(getInitialContentCalendarDate);
  const [posts, setPosts] = useState([]);
  const [calendars, setCalendars] = useState([]);
  const [clients, setClients] = useState([]);
  const [clientsLoaded, setClientsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [shareLoading, setShareLoading] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [isAddingRow, setIsAddingRow] = useState(false);
  const canManageContentCalendar = canManageFeature('contentCalendar');
  
  // Modal states
  const [deleteModal, setDeleteModal] = useState({ open: false, index: null, fromDetails: false });
  const [detailsModal, setDetailsModal] = useState({ open: false, post: null });
  const [referenceModal, setReferenceModal] = useState({ open: false, post: null });
  
  const [filters, setFilters] = useState(getInitialContentCalendarFilters);

  useEffect(() => {
    sessionStorage.setItem(CONTENT_CALENDAR_FILTERS_KEY, JSON.stringify(filters));
  }, [filters]);

  useEffect(() => {
    const selectedMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
    sessionStorage.setItem(CONTENT_CALENDAR_DATE_KEY, selectedMonth);
  }, [currentDate]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (!clientsLoaded) return;
    fetchPosts();
  }, [filters.client, clients, clientsLoaded]);

  const fetchInitialData = async () => {
    try {
      const clientsData = await getClients();
      setClients(clientsData);
    } catch (err) {
      console.error("Failed to fetch clients", err);
    } finally {
      setClientsLoaded(true);
    }
  };

  const fetchPosts = async () => {
    setIsLoading(true);
    try {
      const selectedClient = clients.find(c => c.displayName === filters.client || c.name === filters.client);
      const data = await getCalendars(selectedClient?.id);
      setCalendars(data);
      
      let allPosts = [];
      data.forEach(cal => {
        if (cal.posts) {
          allPosts = [...allPosts, ...cal.posts.map(p => ({
            ...p,
            calendarId: cal.id,
            clientId: cal.clientId,
            clientName: cal.name
          }))];
        }
      });
      
      setPosts(allPosts);
    } catch (err) {
      console.error("Failed to fetch calendar posts", err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredPosts = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const currentMonthName = monthNames[month];

    return posts.filter(p => {
      const matchesPlatform = !filters.platform || filters.platform === 'All Platforms' || 
                             getPostPlatforms(p.platforms).some(plat => plat === filters.platform.toLowerCase());
      
      const matchesType = contentTypeMatchesFilter(p.contentType, filters.contentType);
      
      const matchesStatus = !filters.status || filters.status === 'All Statuses' || 
                           (p.status && p.status.toLowerCase() === filters.status.toLowerCase());

      if (!matchesPlatform || !matchesType || !matchesStatus) return false;

      if (!p.date) return false;

      if (p.date.includes('-') && p.date.split('-')[0].length === 4) {
        const postDate = new Date(p.date);
        if (!isNaN(postDate.getTime())) {
           return postDate.getMonth() === month && postDate.getFullYear() === year;
        }
      }
      
      if (p.date.includes(currentMonthName) || p.date.toLowerCase().includes(currentMonthName.toLowerCase())) {
         return true;
      }

      return false;
    });
  }, [posts, currentDate, filters]);

  const handleUpdateRow = async (index, updatedFields) => {
    const viewerEditableFields = ['isChecked'];
    if (!canManageContentCalendar && !Object.keys(updatedFields).every(key => viewerEditableFields.includes(key))) return;
    const postToUpdate = filteredPosts[index];
    if (!postToUpdate || !postToUpdate.id) return;

    const newPosts = posts.map(p => p.id === postToUpdate.id ? { ...p, ...updatedFields } : p);
    setPosts(newPosts);

    try {
      const dbColumns = ['date', 'contentType', 'pillar', 'visualCopy', 'caption', 'status', 'platforms', 'fbLink', 'igLink', 'ttLink', 'driveLink', 'isChecked'];
      const filteredFields = Object.keys(updatedFields)
        .filter(key => dbColumns.includes(key))
        .reduce((obj, key) => {
          obj[key] = updatedFields[key];
          return obj;
        }, {});

      await updatePost(postToUpdate.id, filteredFields);
    } catch (err) {
      console.error("Failed to update post", err);
      setToast({ message: "Failed to auto-update post.", type: "error" });
      fetchPosts();
    }
  };

  const handleDeleteClick = (index) => {
    if (!canManageContentCalendar) return;
    setDeleteModal({ open: true, index, fromDetails: false });
  };

  const handleDeleteFromDetails = () => {
    if (!canManageContentCalendar || !detailsModal.post?.id) return;
    const index = filteredPosts.findIndex(post => post.id === detailsModal.post.id);
    if (index < 0) return;
    setDeleteModal({ open: true, index, fromDetails: true });
  };

  const handleConfirmDelete = async () => {
    const postToDelete = filteredPosts[deleteModal.index];
    const shouldCloseDetails = deleteModal.fromDetails;
    setDeleteModal({ open: false, index: null, fromDetails: false });

    if (!postToDelete || !postToDelete.id) return;

    try {
      await deletePost(postToDelete.id);
      setPosts(posts.filter(p => p.id !== postToDelete.id));
      setCalendars(previous => previous.map(calendar => ({
        ...calendar,
        posts: (calendar.posts || []).filter(post => post.id !== postToDelete.id)
      })));
      if (shouldCloseDetails) setDetailsModal({ open: false, post: null });
      setToast({ message: "Post deleted", type: "success" });
    } catch (err) {
      console.error("Failed to delete post", err);
      setToast({ message: "Failed to delete post", type: "error" });
    }
  };

  const handleViewPost = (index) => {
    setDetailsModal({ open: true, post: filteredPosts[index] });
  };

  const handleViewReference = (row) => {
    setReferenceModal({ open: true, post: row });
  };

  const handleSaveReference = async (reelScript) => {
    const postToUpdate = referenceModal.post;
    if (!canManageContentCalendar || !postToUpdate?.id) return;

    try {
      await updatePost(postToUpdate.id, { reelScript });
      setPosts(prevPosts => prevPosts.map(post => (
        post.id === postToUpdate.id ? { ...post, reelScript } : post
      )));
      setReferenceModal(prev => ({
        ...prev,
        post: prev.post ? { ...prev.post, reelScript } : prev.post
      }));
      setToast({ message: "Reference saved", type: "success" });
    } catch (error) {
      console.error("Failed to save reference", error);
      setToast({ message: "Failed to save reference", type: "error" });
    }
  };

  const copyToClipboard = async (text) => {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return;
    }

    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-9999px";
    textArea.style.top = "0";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
  };

  const handleShareCalendar = async () => {
    if (!canManageContentCalendar) return;
    const selectedClient = clients.find(c => c.displayName === filters.client || c.name === filters.client);

    if (!selectedClient || filters.client === 'All Clients') {
      setToast({ message: "Please select a client before sharing.", type: "error" });
      return;
    }

    setShareLoading(true);
    try {
      const updatedClient = await toggleShare(selectedClient.id, true);
      const shareParams = new URLSearchParams({
        viewType: filters.viewType === 'Calendar View' ? 'calendar' : 'row',
        view,
        date: currentDate.toISOString().split('T')[0],
      });
      if (filters.contentType && filters.contentType !== ALL_CONTENT_TYPES) {
        shareParams.set('contentType', filters.contentType);
      }
      const shareUrl = `${window.location.origin}/public-content-calendar/${updatedClient.shareToken}?${shareParams.toString()}`;
      await copyToClipboard(shareUrl);
      setShareCopied(true);
      setToast({ message: "Public content calendar link copied", type: "success" });
      setTimeout(() => setShareCopied(false), 2000);
    } catch (error) {
      console.error("Failed to share content calendar", error);
      setToast({ message: "Failed to create share link.", type: "error" });
    } finally {
      setShareLoading(false);
    }
  };

  const handleSavePostDetails = async (updatedFields) => {
    const postToUpdate = detailsModal.post;
    if (!postToUpdate || !postToUpdate.id) return;

    const allowedColumns = ['date', 'contentType', 'pillar', 'visualCopy', 'caption', 'status', 'platforms', 'fbLink', 'igLink', 'ttLink', 'driveLink'];
    const filteredFields = Object.keys(updatedFields)
      .filter(key => allowedColumns.includes(key))
      .reduce((obj, key) => {
        obj[key] = updatedFields[key];
        return obj;
      }, {});

    const updatedPost = { ...postToUpdate, ...filteredFields };
    setDetailsModal(prev => ({ ...prev, post: updatedPost }));
    setPosts(prevPosts => prevPosts.map(post => post.id === postToUpdate.id ? { ...post, ...filteredFields } : post));

    try {
      await updatePost(postToUpdate.id, filteredFields);
      setToast({ message: "Platform links saved", type: "success" });
    } catch (err) {
      console.error("Failed to update platform links", err);
      setToast({ message: "Failed to save platform links", type: "error" });
      fetchPosts();
      throw err;
    }
  };

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

  const handleAddRow = async () => {
    if (!canManageContentCalendar || isAddingRow) return;

    const selectedClient = clients.find(client => (
      client.displayName === filters.client || client.name === filters.client
    ));
    if (!selectedClient || filters.client === 'All Clients') {
      setToast({ message: "Please select a client before adding a row", type: "error" });
      return;
    }

    const year = currentDate.getFullYear();
    const monthIndex = currentDate.getMonth();
    const todayDay = new Date().getDate();
    const lastDayOfMonth = new Date(year, monthIndex + 1, 0).getDate();
    const day = Math.min(todayDay, lastDayOfMonth);
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const monthName = monthNames[monthIndex];
    const date = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const matchingCalendar = calendars.find(calendar => (
      Number(calendar.clientId) === Number(selectedClient.id)
      && Number(calendar.year) === year
      && String(calendar.month).toLowerCase() === monthName.toLowerCase()
    ));
    const calendarPosts = matchingCalendar?.posts || [];
    const minimumSortOrder = calendarPosts.reduce((minimum, post) => (
      Math.min(minimum, Number.isFinite(Number(post.sortOrder)) ? Number(post.sortOrder) : 0)
    ), 0);
    const newRow = {
      date,
      contentType: filters.contentType !== ALL_CONTENT_TYPES ? filters.contentType : 'Reel',
      pillar: '',
      visualCopy: '',
      caption: '',
      reelScript: '',
      platforms: [],
      status: filters.status !== 'All Statuses' ? filters.status : 'DRAFT',
      sortOrder: minimumSortOrder - 1
    };

    setIsAddingRow(true);
    try {
      let savedPost;
      let calendarId = matchingCalendar?.id;

      if (matchingCalendar) {
        savedPost = await createCalendarPost(matchingCalendar.id, newRow);
        setCalendars(previous => previous.map(calendar => (
          calendar.id === matchingCalendar.id
            ? { ...calendar, posts: [savedPost, ...(calendar.posts || [])] }
            : calendar
        )));
      } else {
        const savedCalendar = await saveCalendar({
          clientId: selectedClient.id,
          name: `${selectedClient.displayName || selectedClient.name} - ${monthName} ${year}`,
          month: monthName,
          year,
          competitors: [],
          promptUsed: '',
          posts: [newRow]
        });
        calendarId = savedCalendar.id;
        savedPost = savedCalendar.posts?.[0];
        setCalendars(previous => [savedCalendar, ...previous]);
      }

      if (!savedPost) throw new Error('The new calendar row was not returned');
      setPosts(previous => [{
        ...savedPost,
        calendarId,
        clientId: selectedClient.id,
        clientName: selectedClient.displayName || selectedClient.name
      }, ...previous]);
      setToast({ message: `New row added for ${monthName} ${day}`, type: "success" });
    } catch (error) {
      console.error("Failed to add calendar row", error);
      setToast({ message: "Failed to add calendar row", type: "error" });
    } finally {
      setIsAddingRow(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'PUBLISHED': return 'bg-green-50 text-green-700 border-green-200';
      case 'SCHEDULED': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'DRAFT': return 'bg-slate-100 text-slate-600 border-slate-200';
      default: return 'bg-slate-50 text-slate-500 border-slate-200';
    }
  };

  return (
    <div className="flex flex-col gap-4 max-w-[1600px] mx-auto w-full pb-24 px-4">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      <DeleteConfirmationModal 
        open={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, index: null, fromDetails: false })}
        onConfirm={handleConfirmDelete}
        title="Delete Post"
        message="Are you sure you want to delete this post? This action cannot be undone."
      />

      <PostDetailsModal 
        isOpen={detailsModal.open}
        onClose={() => setDetailsModal({ open: false, post: null })}
        post={detailsModal.post}
        linkEditMode={filters.viewType === 'Row View'}
        hidePreview={filters.viewType === 'Row View'}
        onSave={handleSavePostDetails}
        hideFooter={false}
        canDelete={canManageContentCalendar}
        onDelete={handleDeleteFromDetails}
        driveOnlyEdit={!canManageContentCalendar}
      />

      <ReferenceViewerModal
        isOpen={referenceModal.open}
        onClose={() => setReferenceModal({ open: false, post: null })}
        post={referenceModal.post}
        canEdit={canManageContentCalendar}
        onSave={handleSaveReference}
      />
      
      <CalendarHeader 
        view={view} 
        setView={setView} 
        currentDate={currentDate}
        onPrev={handlePrevMonth}
        onNext={handleNextMonth}
        showViewToggle={filters.viewType !== 'Row View'}
        onShare={handleShareCalendar}
        shareLoading={shareLoading}
        shareCopied={shareCopied}
        canManage={canManageContentCalendar}
      />
      <FilterBar 
        filters={filters} 
        onFilterChange={handleFilterChange} 
        clients={clients.map(c => c.displayName || c.name)}
        canAddRow={canManageContentCalendar}
        onAddRow={handleAddRow}
        isAddingRow={isAddingRow}
        resultCount={filteredPosts.length}
      />
      
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#003870]"></div>
        </div>
      ) : filters.viewType === 'Row View' ? (
        <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-x-auto overflow-y-visible">
          <CalendarTable 
            data={filteredPosts}
            onUpdateRow={handleUpdateRow}
            onDeleteRow={handleDeleteClick}
            onViewRow={handleViewPost}
            onOpenReference={handleViewReference}
            getStatusColor={getStatusColor}
            onAiEdit={() => {}} 
            variant="contentRow"
            readOnly={!canManageContentCalendar}
            hideActions={false}
            allowedDateMonth={`${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`}
          />
        </div>
      ) : (
        <CalendarGrid 
          view={view} 
          currentDate={currentDate} 
          posts={filteredPosts} 
          filters={filters}
          isLoading={isLoading}
          onPrevWeek={handlePrevWeek}
          onNextWeek={handleNextWeek}
        />
      )}
      
      {/* Contextual FAB */}
      <button className="fixed bottom-8 right-8 h-14 w-14 rounded-2xl bg-[#003870] text-white shadow-xl shadow-[#003870]/20 flex items-center justify-center hover:scale-105 hover:shadow-2xl hover:shadow-[#003870]/30 active:scale-95 transition-all z-50">
        <span className="material-symbols-outlined text-[24px]">post_add</span>
      </button>
    </div>
  );
};

export default ContentCalendar;
