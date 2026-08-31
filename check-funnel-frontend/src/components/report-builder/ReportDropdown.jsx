import { useEffect, useRef, useState } from "react";

export default function ReportDropdown({
  value = "",
  options,
  placeholder,
  onChange,
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const close = (event) =>
      ref.current && !ref.current.contains(event.target) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);
  const selected = options.find(
    (option) => String(option.value) === String(value),
  );
  return (
    <div ref={ref} className="relative mt-2">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex h-12 w-full items-center justify-between gap-3 rounded-full border border-[#c2c6d3]/30 bg-[#f3f4f5]/60 px-5 text-left text-xs font-bold text-[#003870] outline-none transition hover:bg-[#f3f4f5] focus:ring-2 focus:ring-[#003870]/10"
      >
        <span className="min-w-0 flex-1 truncate">
          {selected?.label || placeholder}
        </span>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          className={`h-4 w-4 shrink-0 transition ${open ? "rotate-180" : ""}`}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {open && (
        <div className="absolute left-0 right-0 top-full z-[80] mt-2 max-h-64 overflow-y-auto rounded-2xl border border-[#c2c6d3]/25 bg-white py-1.5 shadow-xl">
          {options.length ? (
            options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(String(option.value));
                  setOpen(false);
                }}
                className={`flex w-full px-4 py-3 text-left text-xs font-bold transition hover:bg-[#f3f4f5] ${String(option.value) === String(value) ? "bg-[#003870]/5 text-[#003870]" : "text-[#59616d]"}`}
              >
                <span className="truncate">{option.label}</span>
              </button>
            ))
          ) : (
            <p className="px-4 py-3 text-xs font-semibold text-slate-400">
              No fields available
            </p>
          )}
        </div>
      )}
    </div>
  );
}
