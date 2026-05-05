import React, { useState } from 'react';
import CalendarHeader from '../../components/social-media/calendar/CalendarHeader';
import FilterBar from '../../components/social-media/calendar/FilterBar';
import CalendarGrid from '../../components/social-media/calendar/CalendarGrid';

const ContentCalendar = () => {
  const [view, setView] = useState('month');

  return (
    <div className="flex flex-col gap-4 max-w-[1600px] mx-auto w-full pb-24">
      <CalendarHeader view={view} setView={setView} />
      <FilterBar />
      <CalendarGrid view={view} />
      
      {/* Contextual FAB */}
      <button className="fixed bottom-8 right-8 h-14 w-14 rounded-2xl bg-[#003870] text-white shadow-xl shadow-[#003870]/20 flex items-center justify-center hover:scale-105 hover:shadow-2xl hover:shadow-[#003870]/30 active:scale-95 transition-all z-50">
        <span className="material-symbols-outlined text-[24px]">post_add</span>
      </button>
    </div>
  );
};

export default ContentCalendar;
