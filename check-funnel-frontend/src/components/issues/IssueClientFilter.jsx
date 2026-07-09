import { ChevronDown, Users } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export default function IssueClientFilter({
  value,
  clients,
  onChange,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const options = [{ id: "all", name: "All Clients" }, ...clients];
  const selectedOption = options.find((option) => option.id === value) || options[0];

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const handleSelect = (clientId) => {
    onChange(clientId);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className="relative w-full sm:w-auto">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="flex h-12 w-full min-w-48 items-center justify-between gap-3 rounded-full border border-slate-200 bg-white px-5 text-sm font-extrabold text-[#003870] shadow-sm transition hover:border-[#003870]/25 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#003870]/15 sm:w-52"
      >
        <span className="truncate">{selectedOption.name}</span>
        <span className="flex items-center gap-2 text-slate-400">
          <Users className="h-4 w-4" strokeWidth={2.5} />
          <ChevronDown
            className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
            strokeWidth={3}
          />
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 max-h-64 w-full min-w-56 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-1 shadow-xl shadow-slate-200/70">
          {options.map((option) => {
            const isActive = option.id === value;

            return (
              <button
                key={option.id}
                type="button"
                onClick={() => handleSelect(option.id)}
                className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-sm font-extrabold transition ${
                  isActive
                    ? "bg-blue-50 text-[#003870]"
                    : "text-slate-500 hover:bg-slate-50 hover:text-[#003870]"
                }`}
              >
                <span className="truncate">{option.name}</span>
                {isActive && <span className="h-2 w-2 rounded-full bg-[#003870]" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
