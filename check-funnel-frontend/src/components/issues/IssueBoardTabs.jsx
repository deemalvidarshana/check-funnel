import { ISSUE_STATUSES } from "../../utils/issueStatuses";

export default function IssueBoardTabs({ value, onChange }) {
  return (
    <div className="inline-flex rounded-full border border-slate-200 bg-slate-100/70 p-1 shadow-inner">
      {ISSUE_STATUSES.map((tab) => {
        const isActive = value === tab.value;

        return (
          <button
            key={tab.value}
            type="button"
            onClick={() => onChange(tab.value)}
            className={`min-w-24 rounded-full px-5 py-2 text-sm font-bold transition-all ${
              isActive
                ? "bg-white text-[#003870] shadow-sm"
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
