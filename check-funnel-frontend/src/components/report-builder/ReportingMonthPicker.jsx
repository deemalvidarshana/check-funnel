import { useEffect, useRef, useState } from "react";

const monthNames = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function displayMonth(value) {
  const [year, month] = String(value || "").split("-").map(Number);
  if (!year || !month || month < 1 || month > 12) return "Select a month";
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default function ReportingMonthPicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(Number(String(value).slice(0, 4)) || new Date().getFullYear());
  const ref = useRef(null);
  const selectedYear = Number(String(value).slice(0, 4));
  const selectedMonth = Number(String(value).slice(5, 7));

  useEffect(() => {
    if (!open) return undefined;
    const closeOnOutsideClick = (event) => {
      if (ref.current && !ref.current.contains(event.target)) setOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative mt-2">
      <button
        type="button"
        aria-label="Reporting month"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => {
          if (!open && selectedYear) setViewYear(selectedYear);
          setOpen((current) => !current);
        }}
        className="flex h-12 w-full items-center justify-between gap-3 rounded-full border border-[#c2c6d3]/30 bg-[#f3f4f5]/60 px-5 text-left text-xs font-bold text-[#003870] outline-none transition hover:bg-[#f3f4f5] focus:ring-2 focus:ring-[#003870]/10"
      >
        <span>{displayMonth(value)}</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 shrink-0" aria-hidden="true">
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M7 3v4M17 3v4M3 10h18" />
        </svg>
      </button>
      {open && (
        <div role="dialog" aria-label="Choose reporting month" className="absolute left-0 right-0 top-full z-[80] mt-2 rounded-2xl border border-[#c2c6d3]/25 bg-white p-3 shadow-xl">
          <div className="mb-3 flex items-center justify-between">
            <button type="button" aria-label="Previous year" onClick={() => setViewYear((year) => year - 1)} className="flex h-8 w-8 items-center justify-center rounded-full text-[#003870] transition hover:bg-[#003870]/5">
              <span aria-hidden="true">‹</span>
            </button>
            <span className="text-xs font-extrabold text-[#003870]">{viewYear}</span>
            <button type="button" aria-label="Next year" onClick={() => setViewYear((year) => year + 1)} className="flex h-8 w-8 items-center justify-center rounded-full text-[#003870] transition hover:bg-[#003870]/5">
              <span aria-hidden="true">›</span>
            </button>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {monthNames.map((label, index) => {
              const selected = viewYear === selectedYear && index + 1 === selectedMonth;
              return (
                <button
                  key={label}
                  type="button"
                  aria-label={`${label} ${viewYear}`}
                  aria-pressed={selected}
                  onClick={() => {
                    onChange(`${viewYear}-${String(index + 1).padStart(2, "0")}`);
                    setOpen(false);
                  }}
                  className={`h-9 rounded-xl text-[10px] font-extrabold transition ${selected ? "bg-[#003870] text-white" : "text-slate-600 hover:bg-[#003870]/5 hover:text-[#003870]"}`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
