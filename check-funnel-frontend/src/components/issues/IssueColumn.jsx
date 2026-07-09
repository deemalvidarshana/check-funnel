import IssueCard from "./IssueCard";
import IssueQuickAdd from "./IssueQuickAdd";
import { Plus } from "lucide-react";
import { useState } from "react";

export default function IssueColumn({
  clientId,
  clientName,
  title,
  description,
  issues,
  emptyText,
  canAdd = false,
  isFocused = false,
  onAddIssue,
  onStatusChange,
  onDeleteIssue,
  onTogglePinIssue,
}) {
  const [isAdding, setIsAdding] = useState(false);

  const handleAddIssue = (payload) => {
    onAddIssue?.({
      ...payload,
      clientId,
      clientName,
    });
    setIsAdding(false);
  };

  return (
    <section className="flex min-h-[420px] flex-col rounded-[2rem] border border-slate-200 bg-slate-100/60 p-4">
      <div className="mb-4 flex items-start justify-between gap-3 px-1">
        <div>
          <h2 className={`${isFocused ? "text-xl sm:text-2xl tracking-[0.14em]" : "text-sm tracking-[0.18em]"} font-extrabold uppercase text-slate-700`}>
            {title}
          </h2>
          <p className={`${isFocused ? "mt-2 text-sm" : "mt-1 text-xs"} font-bold text-slate-400`}>
            {description}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-white px-3 py-1 text-xs font-extrabold text-[#003870] shadow-sm">
            {issues.length}
          </span>
          {canAdd && (
            <button
              type="button"
              onClick={() => setIsAdding(true)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#003870] text-white shadow-sm transition hover:bg-[#004b95]"
              aria-label={`Add issue for ${title}`}
            >
              <Plus className="h-4 w-4" strokeWidth={3} />
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3">
        {isAdding && (
          <IssueQuickAdd
            onCancel={() => setIsAdding(false)}
            onSubmit={handleAddIssue}
          />
        )}

        {issues.length > 0 ? (
          issues.map((issue) => (
            <IssueCard
              key={issue.id}
              issue={issue}
              onStatusChange={onStatusChange}
              onDelete={onDeleteIssue}
              onTogglePin={onTogglePinIssue}
            />
          ))
        ) : (
          <div className="flex flex-1 items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white/70 px-5 py-8 text-center text-sm font-bold text-slate-400">
            {emptyText}
          </div>
        )}
      </div>
    </section>
  );
}
