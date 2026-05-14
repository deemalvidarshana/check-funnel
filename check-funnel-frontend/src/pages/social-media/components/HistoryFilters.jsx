import React from 'react';

const HistoryFilters = ({ 
  selectedFilter, 
  onFilterChange, 
  clients, 
  dates, 
  isGenerated,
  isSaving,
  onSave,
  onExport
}) => {
  return (
    <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap gap-4 justify-between items-center bg-slate-50/50">
      <div>
        <h2 className="text-lg font-extrabold text-slate-800">
          {isGenerated ? "Generated Calendar" : "Calendar View & History"}
        </h2>
        <p className="text-xs text-slate-500">
          {isGenerated ? "Based on your parameters and competitor analysis" : "Select from history or generate a new one"}
        </p>
      </div>
      
      <div className="flex flex-wrap items-center gap-3">
        {/* History Dropdowns */}
        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm">
          <span className="material-symbols-outlined text-slate-400 text-[18px]">history</span>
          <select 
            value={selectedFilter.client}
            onChange={(e) => onFilterChange({ ...selectedFilter, client: e.target.value })}
            className="bg-transparent text-xs font-bold text-slate-600 focus:outline-none min-w-[120px]"
          >
            <option value="">All Clients</option>
            {clients.map(clientName => (
              <option key={clientName} value={clientName}>{clientName}</option>
            ))}
          </select>
          <div className="w-[1px] h-4 bg-slate-200 mx-1"></div>
          <select 
            value={selectedFilter.date}
            onChange={(e) => onFilterChange({ ...selectedFilter, date: e.target.value })}
            className="bg-transparent text-xs font-bold text-slate-600 focus:outline-none min-w-[120px]"
          >
            <option value="">Select Month</option>
            {dates.map(date => (
              <option key={date} value={date}>{date}</option>
            ))}
          </select>
        </div>

        {isGenerated && (
          <div className="flex gap-2">
            <button 
              onClick={onExport}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">download</span>
              Export CSV
            </button>
            <button 
              onClick={onSave}
              disabled={isSaving}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#003870] text-white text-xs font-bold hover:bg-[#002a54] transition-colors disabled:opacity-50"
            >
              {isSaving ? (
                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <span className="material-symbols-outlined text-[16px]">save</span>
              )}
              {isSaving ? 'Saving...' : 'Save to Calendar'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryFilters;
