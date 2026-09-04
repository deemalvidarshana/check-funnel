import { useEffect, useRef, useState } from "react";

function Chevron({ open }) {
  return (
    <svg
      className={`h-4 w-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
    >
      <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function useOutsideClose(ref, close) {
  useEffect(() => {
    const handlePointerDown = (event) => {
      if (ref.current && !ref.current.contains(event.target)) close();
    };
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [close, ref]);
}

function monthLabel(value) {
  const [year, month] = value.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });
}

export function GoogleAnalyticsMonthPicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(() => Number(value.split("-")[0]));
  const ref = useRef(null);
  useOutsideClose(ref, () => setOpen(false));

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const months = Array.from({ length: 12 }, (_, index) => ({
    label: new Date(viewYear, index, 1).toLocaleDateString("en-GB", {
      month: "short",
    }),
    value: `${viewYear}-${String(index + 1).padStart(2, "0")}`,
  }));

  return (
    <div className="relative w-full sm:w-48" ref={ref}>
      <button
        type="button"
        onClick={() => {
          setViewYear(Number(value.split("-")[0]));
          setOpen((current) => !current);
        }}
        className="flex h-11 w-full items-center justify-between gap-3 rounded-full border border-[#c2c6d3]/20 bg-[#f3f4f5]/50 px-5 text-sm font-bold text-[#003870] transition hover:bg-[#f3f4f5]"
      >
        <span className="truncate">{monthLabel(value)}</span>
        <Chevron open={open} />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-3 w-[min(18rem,calc(100vw-2rem))] rounded-3xl border border-[#c2c6d3]/30 bg-white p-4 shadow-2xl">
          <div className="mb-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setViewYear((year) => year - 1)}
              className="h-9 w-9 rounded-full hover:bg-[#f3f4f5]"
            >
              ‹
            </button>
            <b>{viewYear}</b>
            <button
              type="button"
              onClick={() => setViewYear((year) => year + 1)}
              className="h-9 w-9 rounded-full hover:bg-[#f3f4f5]"
            >
              ›
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {months.map((month) => (
              <button
                type="button"
                key={month.value}
                onClick={() => {
                  onChange(month.value);
                  setOpen(false);
                }}
                className={`h-11 rounded-2xl text-sm font-bold ${month.value === value ? "bg-[#003870] text-white" : month.value === currentMonth ? "bg-[#003870]/10 text-[#003870]" : "text-[#424751] hover:bg-[#f3f4f5]"}`}
              >
                {month.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function GoogleAnalyticsClientDropdown({
  clients,
  value,
  onChange,
  loading,
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useOutsideClose(ref, () => setOpen(false));
  const configuredClients = clients.filter(
    (client) => client.googleAnalyticsPropertyId,
  );
  const options = [
    { value: "all", label: "Select a client" },
    ...configuredClients.map((client) => ({
      value: String(client.id),
      label: client.name,
    })),
  ];
  const label = loading
    ? "Loading clients..."
    : options.find((option) => option.value === value)?.label ||
      "Select a client";

  return (
    <div className="relative w-full sm:w-64" ref={ref}>
      <button
        type="button"
        disabled={loading}
        onClick={() => setOpen((current) => !current)}
        className="flex h-11 w-full min-w-0 items-center gap-3 rounded-full border border-[#c2c6d3]/20 bg-[#f3f4f5]/50 px-5 text-sm font-bold text-[#003870] transition hover:bg-[#f3f4f5] disabled:opacity-60"
      >
        <span className="min-w-0 flex-1 truncate text-left">{label}</span>
        <Chevron open={open} />
      </button>
      {open && !loading && (
        <div className="absolute right-0 top-full z-50 mt-2 max-h-72 w-[min(16rem,calc(100vw-2rem))] overflow-y-auto rounded-2xl border border-[#c2c6d3]/20 bg-white py-1 shadow-xl">
          {options.map((option) => (
            <button
              type="button"
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
              className={`w-full px-4 py-3 text-left text-sm font-bold transition hover:bg-[#f3f4f5] ${value === option.value ? "bg-[#003870]/5 text-[#003870]" : "text-[#727782]"}`}
            >
              <span className="block truncate" title={option.label}>
                {option.label}
              </span>
            </button>
          ))}
          {configuredClients.length === 0 && (
            <p className="px-4 py-3 text-xs font-semibold leading-5 text-[#727782]">
              Map a GA4 property to a client before opening its report.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

const JOURNEY_TYPES = [
  {
    value: "ecommerce",
    label: "Ecommerce",
    description: "Revenue and purchase journey",
  },
  {
    value: "lead-generation",
    label: "Lead Generation",
    description: "Enquiry and lead journey",
  },
  {
    value: "enquiry-generation",
    label: "Enquiry Generation",
    description: "Forms and contact enquiries",
  },
];

export function GoogleAnalyticsJourneyTypeDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useOutsideClose(ref, () => setOpen(false));
  const selected =
    JOURNEY_TYPES.find((option) => option.value === value) || JOURNEY_TYPES[0];

  return (
    <div className="relative w-full sm:w-56" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex h-11 w-full min-w-0 items-center gap-3 rounded-full border border-[#c2c6d3]/20 bg-white px-5 text-sm font-bold text-[#003870] shadow-sm transition hover:bg-[#f8f9fa]"
      >
        <span
          className={`h-2.5 w-2.5 shrink-0 rounded-full ${value === "ecommerce" ? "bg-emerald-500" : value === "lead-generation" ? "bg-amber-500" : "bg-sky-500"}`}
        />
        <span className="min-w-0 flex-1 truncate text-left">
          {selected.label}
        </span>
        <Chevron open={open} />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-[min(19rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-[#c2c6d3]/20 bg-white p-1.5 shadow-xl">
          {JOURNEY_TYPES.map((option) => (
            <button
              type="button"
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
              className={`w-full rounded-xl px-4 py-3 text-left transition hover:bg-[#f3f4f5] ${value === option.value ? "bg-[#003870]/5" : ""}`}
            >
              <span className="block text-sm font-extrabold text-[#003870]">
                {option.label}
              </span>
              <span className="mt-0.5 block text-[10px] font-semibold text-[#8a9099]">
                {option.description}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
