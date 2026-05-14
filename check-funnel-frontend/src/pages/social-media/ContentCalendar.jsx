import React, { useState, useEffect } from 'react';
import CalendarHeader from '../../components/social-media/calendar/CalendarHeader';
import FilterBar from '../../components/social-media/calendar/FilterBar';
import CalendarGrid from '../../components/social-media/calendar/CalendarGrid';
import { getCalendars } from '../../api/calendar';
import { getClients } from '../../api/client';

const ContentCalendar = () => {
  const [view, setView] = useState('month');
  const [currentDate, setCurrentDate] = useState(new Date()); // May 2026
  const [posts, setPosts] = useState([]);
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    platform: 'All Platforms',
    contentType: 'All Content Types',
    client: 'All Clients',
    status: 'All Statuses'
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [currentDate, filters.client]);

  const fetchInitialData = async () => {
    try {
      const clientsData = await getClients();
      setClients(clientsData);
    } catch (err) {
      console.error("Failed to fetch clients", err);
    }
  };

  const fetchPosts = async () => {
    setIsLoading(true);
    try {
      // Find selected client ID if not 'All Clients'
      const selectedClient = clients.find(c => c.displayName === filters.client || c.name === filters.client);
      const data = await getCalendars(selectedClient?.id);
      
      // Flatten all posts from all calendars for this client
      // (Normally you'd filter by month/year in the API, but for now we flatten)
      let allPosts = [];
      data.forEach(cal => {
        if (cal.posts) {
          allPosts = [...allPosts, ...cal.posts.map(p => ({ ...p, clientName: cal.name }))];
        }
      });
      
      setPosts(allPosts);
    } catch (err) {
      console.error("Failed to fetch calendar posts", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)));
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="flex flex-col gap-4 max-w-[1600px] mx-auto w-full pb-24">
      <CalendarHeader 
        view={view} 
        setView={setView} 
        currentDate={currentDate}
        onPrev={handlePrevMonth}
        onNext={handleNextMonth}
      />
      <FilterBar 
        filters={filters} 
        onFilterChange={handleFilterChange} 
        clients={clients.map(c => c.displayName || c.name)}
      />
      <CalendarGrid 
        view={view} 
        currentDate={currentDate} 
        posts={posts} 
        filters={filters}
        isLoading={isLoading}
      />
      
      {/* Contextual FAB */}
      <button className="fixed bottom-8 right-8 h-14 w-14 rounded-2xl bg-[#003870] text-white shadow-xl shadow-[#003870]/20 flex items-center justify-center hover:scale-105 hover:shadow-2xl hover:shadow-[#003870]/30 active:scale-95 transition-all z-50">
        <span className="material-symbols-outlined text-[24px]">post_add</span>
      </button>
    </div>
  );
};

export default ContentCalendar;
