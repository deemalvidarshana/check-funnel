import React, { useState, useRef, useEffect } from 'react';

const CustomDropdown = ({ value, options, onChange, placeholder, icon }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedLabel = options.find(opt => opt.value === value)?.label || placeholder;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-slate-200 shadow-sm hover:border-[#003870]/30 transition-all min-w-[160px] justify-between group"
      >
        <div className="flex items-center gap-2">
          {icon && <span className="material-symbols-outlined text-slate-400 text-[18px] group-hover:text-[#003870] transition-colors">{icon}</span>}
          <span className="text-[13px] font-bold text-slate-600 truncate">{selectedLabel}</span>
        </div>
        <span className={`material-symbols-outlined text-slate-400 text-[18px] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>expand_more</span>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-full bg-white rounded-2xl border border-slate-100 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)] z-[100] py-2 animate-in fade-in slide-in-from-top-2 duration-200">
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-2.5 text-[13px] font-bold transition-colors hover:bg-slate-50 ${value === opt.value ? 'text-[#003870] bg-blue-50/50' : 'text-slate-600'}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const HistoryFilters = ({ 
  selectedFilter, 
  onFilterChange, 
  clients, 
  dates, 
  isGenerated,
  isSaving,
  onSave,
  onDelete,
  onExport
}) => {
  const clientOptions = [
    { value: '', label: 'All Clients' },
    ...clients.map(c => ({ value: c, label: c }))
  ];

  const dateOptions = [
    { value: '', label: 'Select Month' },
    ...dates.map(d => ({ value: d, label: d }))
  ];

  return (
    <div className="px-6 py-5 border-b border-slate-100 flex flex-wrap gap-4 justify-between items-center bg-white">
      <div>
        <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
          {isGenerated ? (
            <>
              <span className="material-symbols-outlined text-[#003870] text-[24px]">auto_awesome</span>
              Generated Calendar
            </>
          ) : "Calendar History"}
        </h2>
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
          {isGenerated ? "AI-Powered content strategy ready for review" : "Access your saved content calendars"}
        </p>
      </div>
      
      <div className="flex flex-wrap items-center gap-3">
        {/* History Dropdowns */}
        <div className="flex items-center gap-2">
          <CustomDropdown 
            value={selectedFilter.client}
            options={clientOptions}
            onChange={(val) => onFilterChange({ ...selectedFilter, client: val })}
            placeholder="All Clients"
            icon="person"
          />
          
          <CustomDropdown 
            value={selectedFilter.date}
            options={dateOptions}
            onChange={(val) => onFilterChange({ ...selectedFilter, date: val })}
            placeholder="Select Month"
            icon="calendar_month"
          />

          {selectedFilter.date && (
            <button
              onClick={onDelete}
              className="flex items-center justify-center w-10 h-10 rounded-xl border border-red-100 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm shrink-0"
              title="Delete this calendar"
            >
              <span className="material-symbols-outlined text-[20px]">delete</span>
            </button>
          )}
        </div>

        {isGenerated && (
          <div className="flex gap-2 ml-2">
            <button 
              onClick={onExport}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 text-[13px] font-bold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
            >
              <span className="material-symbols-outlined text-[18px]">download</span>
              Export
            </button>
            <button 
              onClick={onSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#003870] text-white text-[13px] font-bold hover:bg-[#002a54] hover:shadow-lg hover:shadow-[#003870]/20 transition-all disabled:opacity-50"
            >
              {isSaving ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <span className="material-symbols-outlined text-[18px]">save</span>
              )}
              {isSaving ? 'Saving...' : 'Save Calendar'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryFilters;
