import { useEffect, useRef, useState } from "react";

const OPTIONS = [
  { value: "comparison", label: "Comparison" },
  { value: "current", label: "Current period only" },
];

export default function GoogleAnalyticsComparisonModeDropdown({
  value,
  onChange,
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const selected =
    OPTIONS.find((option) => option.value === value) || OPTIONS[0];

  useEffect(() => {
    const close = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div ref={rootRef} className="relative w-44">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex h-10 w-full items-center justify-between gap-3 rounded-full border border-[#c2c6d3]/30 bg-[#f3f4f5]/50 px-4 text-xs font-extrabold text-[#003870] shadow-sm transition hover:bg-[#f3f4f5] focus:outline-none focus:ring-2 focus:ring-[#1a73e8]/20"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="truncate">{selected.label}</span>
        <svg
          viewBox="0 0 20 20"
          fill="none"
          className={`h-4 w-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        >
          <path
            d="m6 8 4 4 4-4"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Chart comparison mode"
          className="absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-[#c2c6d3]/25 bg-white py-1.5 shadow-xl"
        >
          {OPTIONS.map((option) => {
            const active = option.value === value;
            return (
              <button
                type="button"
                role="option"
                aria-selected={active}
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-xs font-bold transition ${active ? "bg-[#003870]/5 text-[#003870]" : "text-[#727782] hover:bg-[#f3f4f5] hover:text-[#003870]"}`}
              >
                <span>{option.label}</span>
                {active && (
                  <svg
                    viewBox="0 0 20 20"
                    fill="none"
                    className="h-4 w-4 shrink-0"
                    aria-hidden="true"
                  >
                    <path
                      d="m5 10 3 3 7-7"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
