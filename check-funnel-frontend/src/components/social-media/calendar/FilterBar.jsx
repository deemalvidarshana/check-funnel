import React, { useState } from 'react';

const CustomDropdown = ({ options, value, onChange, placeholder, minWidth }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative w-full lg:w-auto">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full lg:min-w-[${minWidth}px] flex items-center justify-between px-6 py-2.5 bg-[#f3f4f5]/50 border border-[#c2c6d3]/20 rounded-full text-sm font-bold text-[#003870] hover:bg-[#f3f4f5] transition-all shadow-sm group`}
      >
        <span className="truncate">{value || placeholder}</span>
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
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
          <div className="absolute left-0 lg:left-0 right-0 lg:right-auto top-full z-50 mt-2 min-w-full lg:min-w-[200px] overflow-hidden rounded-2xl border border-[#c2c6d3]/20 bg-white shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
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

const FilterBar = ({ filters, onFilterChange, clients }) => {
  const resetFilters = () => {
    onFilterChange('platform', 'All Platforms');
    onFilterChange('contentType', 'All Content Types');
    onFilterChange('client', 'All Clients');
    onFilterChange('status', 'All Statuses');
  };

  return (
    <section className="glass-panel rounded-2xl p-3 sm:p-4 shadow-sm border border-white flex flex-col lg:flex-row lg:items-center gap-3 sm:gap-4">
      <div className="flex items-center justify-between">
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

      <div className="h-6 w-px bg-slate-200 mx-2 hidden lg:block"></div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-wrap items-center gap-4 flex-1">
        <CustomDropdown 
          options={['All Platforms', 'Meta', 'Instagram', 'TikTok', 'LinkedIn']}
          value={filters.platform}
          onChange={(val) => onFilterChange('platform', val)}
          placeholder="All Platforms"
          minWidth="140"
        />
        <CustomDropdown 
          options={['All Content Types', 'Video', 'Image', 'Carousel']}
          value={filters.contentType}
          onChange={(val) => onFilterChange('contentType', val)}
          placeholder="All Content Types"
          minWidth="160"
        />
        <CustomDropdown 
          options={['All Clients', ...clients]}
          value={filters.client}
          onChange={(val) => onFilterChange('client', val)}
          placeholder="All Clients"
          minWidth="150"
        />
        <CustomDropdown 
          options={['All Statuses', 'Published', 'Scheduled', 'Needs Approval']}
          value={filters.status}
          onChange={(val) => onFilterChange('status', val)}
          placeholder="All Statuses"
          minWidth="140"
        />
      </div>

      <button 
        onClick={resetFilters}
        className="hidden lg:block text-sm font-semibold text-slate-500 hover:text-[#003870] transition-colors px-4 py-2"
      >
        Reset Filters
      </button>
    </section>
  );
};

export default FilterBar;
