import React from 'react';

const CalendarDay = ({ day, isToday, isCurrentMonth, children, view }) => {
  const isWeekView = view === 'week';

  if (!isCurrentMonth) {
    return (
      <div className={`p-3 bg-slate-50/30 border border-slate-200/50 opacity-40 ${isWeekView ? 'min-h-[200px] sm:min-h-[450px]' : 'min-h-[100px] sm:min-h-[140px]'}`}>
        <span className="text-sm font-semibold text-slate-400">{day}</span>
      </div>
    );
  }

  const containerClasses = isWeekView 
    ? "min-h-[300px] sm:min-h-[450px] p-3 sm:p-4 rounded-3xl" 
    : "min-h-[130px] sm:min-h-[160px] p-2 sm:p-3 rounded-2xl";

  const headerClasses = isWeekView
    ? "flex items-center justify-between pb-3 border-b border-slate-100 mb-3"
    : "flex items-center justify-between pb-1.5 border-b border-slate-100 mb-1";

  if (isToday) {
    return (
      <div className={`${containerClasses} bg-[#003870]/5 border-2 border-[#003870] shadow-sm flex flex-col relative overflow-hidden`}>
        <div className={`${headerClasses} ${isWeekView ? 'border-[#003870]/10' : 'border-[#003870]/10'}`}>
          <span className={`${isWeekView ? 'text-lg' : 'text-sm'} font-extrabold text-[#003870]`}>{day}</span>
          <span className="text-[9px] font-extrabold text-[#003870] uppercase tracking-[0.1em]">Today</span>
        </div>
        <div className="flex-grow overflow-y-auto no-scrollbar space-y-3">
          {isWeekView ? children : React.Children.toArray(children).slice(0, 2)}
        </div>
        {!isWeekView && React.Children.count(children) > 2 && (
          <div className="mt-1 flex items-center justify-center py-1.5 rounded-xl bg-white/80 border border-[#003870]/10 hover:bg-white transition-all cursor-pointer group shadow-sm">
            <span className="text-[9px] font-extrabold text-[#003870] group-hover:scale-105 transition-transform">
              + {React.Children.count(children) - 2} MORE POSTS
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`${containerClasses} bg-white shadow-sm border border-slate-300 hover:border-[#003870]/40 transition-all group flex flex-col overflow-hidden`}>
      <div className={headerClasses}>
        <span className={`${isWeekView ? 'text-lg font-black' : 'text-sm font-bold'} text-slate-700 group-hover:text-[#003870] transition-colors`}>{day}</span>
      </div>
      <div className="flex-grow overflow-y-auto no-scrollbar space-y-3">
        {isWeekView ? children : React.Children.toArray(children).slice(0, 2)}
      </div>
      {!isWeekView && React.Children.count(children) > 2 && (
        <div className="mt-1 flex items-center justify-center py-1.5 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-all cursor-pointer group shadow-sm">
          <span className="text-[9px] font-extrabold text-slate-500 group-hover:text-[#003870]">
            + {React.Children.count(children) - 2} MORE POSTS
          </span>
        </div>
      )}
    </div>
  );
};

export default CalendarDay;
