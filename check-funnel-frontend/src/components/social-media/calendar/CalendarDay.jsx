import React from 'react';

const CalendarDay = ({ day, isToday, isCurrentMonth, children, view }) => {
  const isWeekView = view === 'week';
  const childItems = React.Children.toArray(children);
  const hasScrollableMonthPosts = !isWeekView && childItems.length > 2;
  const contentClasses = `min-h-0 flex-grow space-y-3 ${
    isWeekView || hasScrollableMonthPosts
      ? 'overflow-y-auto no-scrollbar'
      : 'overflow-visible'
  }`;

  if (!isCurrentMonth) {
    return (
      <div className={`p-3 bg-slate-50/30 border border-slate-200/50 opacity-40 ${isWeekView ? 'min-h-[200px] sm:min-h-[450px]' : 'min-h-[100px] sm:min-h-[140px]'}`}>
        <span className="text-sm font-semibold text-slate-400">{day}</span>
      </div>
    );
  }

  const containerClasses = isWeekView 
    ? "min-h-[300px] sm:min-h-[450px] p-3 sm:p-4 rounded-3xl" 
    : hasScrollableMonthPosts
      ? "min-h-[250px] max-h-[290px] sm:min-h-[280px] sm:max-h-[320px] p-2 sm:p-3 rounded-2xl"
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
        <div className={contentClasses}>
          {isWeekView ? children : childItems}
        </div>
      </div>
    );
  }

  return (
    <div className={`${containerClasses} bg-white shadow-sm border border-slate-300 hover:border-[#003870]/40 transition-all group flex flex-col overflow-hidden`}>
      <div className={headerClasses}>
        <span className={`${isWeekView ? 'text-lg font-black' : 'text-sm font-bold'} text-slate-700 group-hover:text-[#003870] transition-colors`}>{day}</span>
      </div>
      <div className={contentClasses}>
        {isWeekView ? children : childItems}
      </div>
    </div>
  );
};

export default CalendarDay;
