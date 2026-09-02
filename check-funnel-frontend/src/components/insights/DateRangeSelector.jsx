import { useState } from "react";

export default function DateRangeSelector({ selectedRange, onRangeChange, extraRanges = [], ranges: customRanges }) {
  const [isOpen, setIsOpen] = useState(false);

  const ranges = customRanges || [
    { label: "Last 7 Weeks", value: "7" },
    { label: "Last 6 Months", value: "30" },
    ...extraRanges,
  ];


  const currentLabel = ranges.find((r) => r.value === selectedRange)?.label || ranges[0]?.label || "Last 7 Weeks";


  return (
    <div className="relative w-full sm:w-auto">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full sm:w-auto items-center justify-between sm:justify-start gap-2 sm:gap-3 rounded-full border border-[#c2c6d3]/20 bg-[#f3f4f5]/50 px-4 sm:px-5 py-2 sm:py-2.5 transition hover:bg-[#f3f4f5] border-transparent"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-[#003870]"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>

        <span className="text-base sm:text-lg font-bold text-[#003870]">{currentLabel}</span>

        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`text-[#727782] transition-transform ${isOpen ? "rotate-180" : ""}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full z-[70] mt-2 max-h-64 w-48 overflow-y-auto rounded-2xl border border-[#c2c6d3]/20 bg-white shadow-xl animate-in fade-in slide-in-from-top-1 duration-200 no-scrollbar sm:left-auto sm:right-0">
          {ranges.map((range) => (
            <button
              key={range.value}
              onClick={() => {
                onRangeChange(range.value);
                setIsOpen(false);
              }}
              className={`w-full px-4 py-3 text-left text-sm font-bold transition hover:bg-[#f3f4f5] ${
                selectedRange === range.value ? "text-[#003870] bg-[#003870]/5" : "text-[#727782]"
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
