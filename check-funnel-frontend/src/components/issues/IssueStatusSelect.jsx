import { ISSUE_STATUSES, getIssueStatusOption, normalizeIssueStatus } from "../../utils/issueStatuses";
import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export default function IssueStatusSelect({
  value,
  onChange,
  compact = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const selectedStatus = getIssueStatusOption(value);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const handleSelect = (nextStatus) => {
    onChange(nextStatus);
    setIsOpen(false);
  };

  return (
    <div
      ref={dropdownRef}
      className="relative"
      onClick={(event) => event.stopPropagation()}
    >
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className={`inline-flex items-center justify-between gap-2 rounded-full border text-xs font-extrabold uppercase tracking-[0.12em] shadow-sm outline-none transition hover:shadow-md focus:ring-2 focus:ring-[#003870]/15 ${
          selectedStatus.selectClass
        } ${compact ? "min-w-24 px-3 py-1.5" : "min-w-36 px-4 py-2.5"}`}
      >
        <span>{selectedStatus.label}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform ${isOpen ? "rotate-180" : ""}`}
          strokeWidth={3}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 min-w-36 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1 shadow-xl shadow-slate-200/70">
          {ISSUE_STATUSES.map((status) => {
            const isActive = normalizeIssueStatus(value) === status.value;

            return (
              <button
                key={status.value}
                type="button"
                onClick={() => handleSelect(status.value)}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-xs font-extrabold uppercase tracking-[0.12em] transition ${
                  isActive
                    ? "bg-blue-50 text-[#003870]"
                    : "text-slate-500 hover:bg-slate-50 hover:text-[#003870]"
                }`}
              >
                {status.label}
                {isActive && (
                  <span className="h-2 w-2 rounded-full bg-[#003870]" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
