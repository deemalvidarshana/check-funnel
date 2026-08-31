import { campaignFields } from "./campaignFields";
import ReportDropdown from "../ReportDropdown";
export default function CampaignFieldBuilder({
  value,
  onChange,
  options = campaignFields,
  label = "Campaign table fields",
}) {
  const available = options.filter((field) => !value.includes(field.key));
  const move = (index, direction) => {
    const next = [...value],
      target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };
  return (
    <div className="mt-3">
      <div className="block text-[10px] font-extrabold uppercase text-slate-500">
        {label}
        <ReportDropdown
          placeholder="＋ Add field…"
          options={available.map((field) => ({
            value: field.key,
            label: field.label,
          }))}
          onChange={(key) => onChange([...value, key])}
        />
      </div>
      <div className="mt-3 space-y-1.5">
        {value.map((key, index) => {
          const field = options.find((item) => item.key === key);
          return (
            <div
              key={key}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[10px] font-bold text-slate-600"
            >
              <span className="text-slate-300">⋮⋮</span>
              <span className="min-w-0 flex-1 truncate">
                {index + 1}. {field?.label || key}
              </span>
              <button
                type="button"
                onClick={() => move(index, -1)}
                disabled={!index}
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => move(index, 1)}
                disabled={index === value.length - 1}
              >
                ↓
              </button>
              <button
                type="button"
                onClick={() => onChange(value.filter((item) => item !== key))}
                className="text-rose-500"
              >
                ×
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
