import { ISSUE_STATUSES } from "../../utils/issueStatuses";

export default function IssueBoardTabs({ value, onChange }) {
  return (
    <div className="flex w-full rounded-full bg-slate-100/70 p-1 shadow-inner ring-1 ring-slate-200/70 sm:w-auto">
      {ISSUE_STATUSES.map((tab) => {
        const isActive = value === tab.value;

        return (
          <button
            key={tab.value}
            type="button"
            onClick={() => onChange(tab.value)}
            className={`min-w-0 flex-1 rounded-full px-5 py-2 text-sm font-bold transition-all sm:min-w-24 sm:flex-none ${
              isActive
                ? "bg-white text-[#003870] shadow-sm ring-1 ring-slate-200/80"
                : "text-slate-500 hover:text-[#003870]"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
