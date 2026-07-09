import { useNavigate } from "react-router-dom";
import IssueStatusSelect from "./IssueStatusSelect";
import { getIssueStatusOption } from "../../utils/issueStatuses";
import { Pin, PinOff, Trash2, X } from "lucide-react";
import { useState } from "react";

const formatDate = (value) => {
  if (!value) return "";

  try {
    return new Intl.DateTimeFormat("en", {
      day: "2-digit",
      month: "short",
    }).format(new Date(value));
  } catch {
    return "";
  }
};

const DESCRIPTION_PREVIEW_LIMIT = 140;

const getDescriptionPreview = (description = "") => {
  const normalizedDescription = description.replace(/\s+/g, " ").trim();

  if (normalizedDescription.length <= DESCRIPTION_PREVIEW_LIMIT) {
    return normalizedDescription;
  }

  return `${normalizedDescription.slice(0, DESCRIPTION_PREVIEW_LIMIT).trim()}...`;
};

export default function IssueCard({
  issue,
  onStatusChange,
  onDelete,
  onTogglePin,
}) {
  const navigate = useNavigate();
  const status = getIssueStatusOption(issue.status);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => navigate(`/issues/${issue.id}`)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          navigate(`/issues/${issue.id}`);
        }
      }}
      className="cursor-pointer rounded-3xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#003870]/25 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#003870]/20"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="truncate text-xs font-extrabold uppercase tracking-[0.18em] text-[#003870]">
              {status.label} issue
            </p>
            {issue.isPinned && (
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#003870]">
                <Pin className="h-3 w-3" strokeWidth={3} />
                Pinned
              </span>
            )}
          </div>
          <h3 className="mt-2 text-base font-extrabold leading-snug text-slate-950">
            {issue.title}
          </h3>
        </div>
        <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-500">
          {formatDate(issue.createdAt)}
        </span>
      </div>

      {issue.notes && (
        <p className="mt-3 line-clamp-3 min-h-[72px] text-sm font-medium leading-6 text-slate-500">
          {getDescriptionPreview(issue.notes)}
        </p>
      )}

      {isConfirmingDelete && (
        <div
          className="mt-4 rounded-2xl border border-red-100 bg-red-50 px-3 py-3"
          onClick={(event) => event.stopPropagation()}
        >
          <p className="text-xs font-extrabold text-[#003870]">
            Delete this card?
          </p>
          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                setIsConfirmingDelete(false);
              }}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm transition hover:bg-slate-50"
              aria-label="Cancel delete"
            >
              <X className="h-3.5 w-3.5" strokeWidth={3} />
            </button>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onDelete(issue.id);
              }}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#003870] px-3 py-1.5 text-xs font-extrabold text-white shadow-sm transition hover:bg-[#004b95]"
            >
              <Trash2 className="h-3.5 w-3.5" strokeWidth={3} />
              Delete
            </button>
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onTogglePin(issue.id);
          }}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-[#003870] shadow-sm transition hover:bg-blue-100"
          aria-label={issue.isPinned ? "Unpin issue card" : "Pin issue card"}
        >
          {issue.isPinned ? (
            <PinOff className="h-4 w-4" strokeWidth={3} />
          ) : (
            <Pin className="h-4 w-4" strokeWidth={3} />
          )}
        </button>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            setIsConfirmingDelete(true);
          }}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-[#003870] shadow-sm transition hover:bg-blue-100"
          aria-label="Delete issue card"
        >
          <Trash2 className="h-4 w-4" strokeWidth={3} />
        </button>
        <div className="ml-auto">
          <IssueStatusSelect
            value={issue.status}
            compact
            onChange={(nextStatus) => onStatusChange(issue.id, nextStatus)}
          />
        </div>
      </div>
    </article>
  );
}
