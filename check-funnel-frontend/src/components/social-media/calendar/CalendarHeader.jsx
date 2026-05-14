import React from 'react';
import { useNavigate } from 'react-router-dom';

const CalendarHeader = ({ view, setView, currentDate, onPrev, onNext }) => {
  const navigate = useNavigate();

  return (
    <section className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
      <div className="space-y-2">
        <h1 className="text-4xl tracking-tight text-[#191c1d] sm:text-5xl">
          <span className="font-extrabold">Content </span>
          <span className="font-medium">Calendar</span>
        </h1>
        <p className="mt-3 text-base leading-8 text-[#424751] sm:text-lg">
          Plan, schedule, and manage your cross-platform strategy.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center lg:items-end gap-4 w-full lg:w-auto">
        {/* CTA */}
        <button 
          onClick={() => navigate('/content-calendar/create')}
          className="bg-[#003870] text-white font-bold px-6 py-2.5 rounded-full flex items-center justify-center gap-2 hover:bg-[#003870]/90 hover:shadow-lg hover:shadow-[#003870]/20 transition-all active:scale-95 text-sm w-full sm:w-auto order-last sm:order-first"
        >
          <span className="material-symbols-outlined text-[18px]">magic_button</span>
          Generate
        </button>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          {/* Date Navigation */}
          <div className="flex items-center justify-between bg-white rounded-full p-1 shadow-sm border border-slate-100 w-full sm:w-auto">
            <button 
              onClick={onPrev}
              className="p-2 rounded-full text-slate-400 hover:text-[#003870] hover:bg-slate-50 transition-colors material-symbols-outlined"
            >
              chevron_left
            </button>
            <span className="font-headline font-bold text-slate-800 min-w-[130px] text-center px-2 text-sm sm:text-base uppercase tracking-tight">
              {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </span>
            <button 
              onClick={onNext}
              className="p-2 rounded-full text-slate-400 hover:text-[#003870] hover:bg-slate-50 transition-colors material-symbols-outlined"
            >
              chevron_right
            </button>
          </div>
          {/* View Toggles */}
          <div className="flex bg-slate-100/80 p-1 rounded-full border border-slate-200/50 w-full sm:w-auto justify-center">
            <button 
              onClick={() => setView('month')}
              className={`flex-1 sm:flex-initial px-5 py-2 rounded-full text-sm font-bold transition-all ${
                view === 'month' 
                  ? "bg-white shadow-sm text-[#003870]" 
                  : "text-slate-500 hover:text-[#003870]"
              }`}
            >
              Month
            </button>
            <button 
              onClick={() => setView('week')}
              className={`flex-1 sm:flex-initial px-5 py-2 rounded-full text-sm font-bold transition-all ${
                view === 'week' 
                  ? "bg-white shadow-sm text-[#003870]" 
                  : "text-slate-500 hover:text-[#003870]"
              }`}
            >
              Week
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CalendarHeader;

