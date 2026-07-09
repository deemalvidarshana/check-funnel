import React, { useState } from 'react';
import { ALL_CONTENT_TYPES, CONTENT_TYPE_FILTER_OPTIONS } from '../../../utils/contentTypes';

const CustomDropdown = ({ options, value, onChange, placeholder, minWidth }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownMinWidth = minWidth ? `${minWidth}px` : undefined;

  return (
    <div
      className="relative w-full shrink-0 sm:w-auto"
      style={dropdownMinWidth ? { '--dropdown-min-width': dropdownMinWidth } : undefined}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full sm:w-auto sm:min-w-[var(--dropdown-min-width)] flex items-center justify-between px-4 py-2.5 bg-[#f3f4f5]/50 border border-[#c2c6d3]/20 rounded-full text-sm font-bold text-[#003870] hover:bg-[#f3f4f5] transition-all shadow-sm group"
      >
        <span className="truncate whitespace-nowrap">{value || placeholder}</span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`ml-2 text-slate-400 group-hover:text-[#003870] transition-transform ${isOpen ? "rotate-180" : ""}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-[51]" onClick={() => setIsOpen(false)}></div>
          <div className="absolute left-0 lg:left-0 right-0 lg:right-auto top-full z-[52] mt-2 min-w-full lg:min-w-[200px] max-h-[400px] overflow-y-auto rounded-2xl border border-[#c2c6d3]/20 bg-white shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200 no-scrollbar">
            {options.map((option) => (
              <button
                key={option}
                onClick={() => {
                  onChange(option);
                  setIsOpen(false);
                }}
                className={`w-full px-5 py-3 text-left text-sm font-bold transition hover:bg-[#f3f4f5] ${
                  value === option ? "text-[#003870] bg-[#003870]/5" : "text-[#727782]"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const FilterBar = ({ filters, onFilterChange, clients, hideClientFilter = false }) => {
  const resetFilters = () => {
    onFilterChange('platform', 'All Platforms');
    onFilterChange('contentType', ALL_CONTENT_TYPES);
    if (!hideClientFilter) onFilterChange('client', 'All Clients');
    onFilterChange('status', 'All Statuses');
  };

  return (
    <section className="glass-panel relative z-[54] rounded-2xl p-4 shadow-sm border border-white flex flex-col lg:flex-row lg:flex-wrap lg:items-center gap-3">
      <div className="flex items-center justify-between lg:shrink-0 lg:justify-start">
        <div className="flex items-center gap-2 text-sm font-bold text-[#003870]">
          <span className="material-symbols-outlined text-[20px]">filter_list</span>
          Filters
        </div>
        <button 
          onClick={resetFilters}
          className="lg:hidden text-sm font-semibold text-slate-500 hover:text-[#003870] transition-colors"
        >
          Reset
        </button>
      </div>

      <div className="h-8 w-px bg-slate-200 hidden lg:block"></div>
      
      <div className="grid grid-cols-1 gap-2.5 sm:flex sm:flex-wrap sm:items-center flex-1 min-w-0 lg:overflow-visible no-scrollbar">
        <CustomDropdown 
          options={CONTENT_TYPE_FILTER_OPTIONS}
          value={filters.contentType}
          onChange={(val) => onFilterChange('contentType', val)}
          placeholder={ALL_CONTENT_TYPES}
          minWidth="166"
        />
        {!hideClientFilter && (
          <CustomDropdown
            options={['All Clients', ...clients]}
            value={filters.client}
            onChange={(val) => onFilterChange('client', val)}
            placeholder="All Clients"
            minWidth="150"
          />
        )}
        <CustomDropdown 
          options={['All Statuses', 'PUBLISHED', 'SCHEDULED', 'DRAFT']}
          value={filters.status}
          onChange={(val) => onFilterChange('status', val)}
          placeholder="All Statuses"
          minWidth="142"
        />
        <CustomDropdown 
          options={['Calendar View', 'Row View']}
          value={filters.viewType || 'Calendar View'}
          onChange={(val) => onFilterChange('viewType', val)}
          placeholder="View Type"
          minWidth="146"
        />
      </div>

      <button 
        onClick={resetFilters}
        className="hidden shrink-0 lg:ml-auto lg:block text-sm font-semibold text-slate-500 hover:text-[#003870] transition-colors px-2 py-2"
      >
        Reset Filters
      </button>
    </section>
  );
};

export default FilterBar;
