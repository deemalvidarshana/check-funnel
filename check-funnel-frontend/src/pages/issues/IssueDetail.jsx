import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, Trash2, X } from "lucide-react";
import {
  deleteIssue,
  getIssue,
  updateIssue as updateIssueRequest,
} from "../../api/issues";
import { getStoredIssueBoardUser, loadStoredIssues, saveIssueBoardToast, saveStoredIssues } from "../../utils/issueBoardStorage";
import IssueAttachmentUploader from "../../components/issues/IssueAttachmentUploader";
import IssueVoiceInput from "../../components/issues/IssueVoiceInput";
import IssueStatusSelect from "../../components/issues/IssueStatusSelect";
import { getIssueStatusOption, normalizeIssueStatus } from "../../utils/issueStatuses";

const formatDateTime = (value) => {
  if (!value) return "Not set";

  try {
    return new Intl.DateTimeFormat("en", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return "Not set";
  }
};

const getInitialBoardState = () => {
  const user = getStoredIssueBoardUser();
  return {
    user,
    issues: loadStoredIssues(user),
  };
};

function IssueToast({ message, type = "success", onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const borderColor = type === "success" ? "border-[#0f3d91]" : "border-red-500";
  const iconColor = type === "success" ? "text-[#0f3d91]" : "text-red-500";

  return (
    <div className={`fixed top-6 right-6 z-[300] flex items-center gap-3 rounded-xl border-l-4 bg-white px-4 py-3 shadow-xl animate-in slide-in-from-top-4 duration-300 ${borderColor}`}>
      <div className={iconColor}>
        {type === "success" ? (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        )}
      </div>
      <p className="text-sm font-semibold tracking-tight text-slate-700">{message}</p>
    </div>
  );
}

export default function IssueDetail() {
  const { issueId } = useParams();
  const navigate = useNavigate();
  const [initialBoardState] = useState(getInitialBoardState);
  const [issues, setIssues] = useState(initialBoardState.issues);
  const [currentUser] = useState(initialBoardState.user);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isLoadingIssue, setIsLoadingIssue] = useState(true);
  const [isSavingIssue, setIsSavingIssue] = useState(false);
  const [toast, setToast] = useState(null);

  const issue = useMemo(() => (
    issues.find((item) => item.id === issueId)
  ), [issueId, issues]);

  useEffect(() => {
    saveStoredIssues(currentUser, issues);
  }, [currentUser, issues]);

  useEffect(() => {
    let isMounted = true;

    async function loadRemoteIssue() {
      try {
        const remoteIssue = await getIssue(issueId);
        if (!isMounted) return;

        setIssues((currentIssues) => {
          const issueExists = currentIssues.some((item) => item.id === issueId);
          const nextIssues = issueExists
            ? currentIssues.map((item) => (item.id === issueId ? remoteIssue : item))
            : [remoteIssue, ...currentIssues];

          saveStoredIssues(currentUser, nextIssues);
          return nextIssues;
        });
      } catch (loadError) {
        console.error("Failed to load issue card from backend", loadError);
      } finally {
        if (isMounted) setIsLoadingIssue(false);
      }
    }

    loadRemoteIssue();

    return () => {
      isMounted = false;
    };
  }, [currentUser, issueId]);

  const updateIssue = (patch) => {
    setIssues((currentIssues) => currentIssues.map((item) => (
      item.id === issueId ? { ...item, ...patch } : item
    )));
    updateIssueRequest(issueId, patch).catch((saveError) => {
      console.error("Failed to save issue card update to backend", saveError);
    });
  };

  const handleStatusChange = (nextStatus) => {
    if (!issue) return;

    const normalizedStatus = normalizeIssueStatus(nextStatus);
    updateIssue({
      status: normalizedStatus,
      completedAt: normalizedStatus === "done" ? new Date().toISOString() : null,
    });
  };

  const handleUpdateIssue = async () => {
    if (!issue) return;

    setIsSavingIssue(true);

    try {
      const savedIssue = await updateIssueRequest(issueId, {
        clientId: issue.clientId,
        clientName: issue.clientName,
        title: issue.title,
        notes: issue.notes || "",
        attachments: Array.isArray(issue.attachments) ? issue.attachments : [],
        status: normalizeIssueStatus(issue.status),
        isPinned: Boolean(issue.isPinned),
        pinnedAt: issue.pinnedAt || null,
        completedAt: issue.completedAt || null,
      });

      setIssues((currentIssues) => currentIssues.map((item) => (
        item.id === issueId ? savedIssue : item
      )));
      setToast({ message: "Issue card updated successfully.", type: "success" });
    } catch (saveError) {
      console.error("Failed to update issue card", saveError);
      setToast({ message: "Failed to update issue card.", type: "error" });
    } finally {
      setIsSavingIssue(false);
    }
  };

  const handleDeleteIssue = async () => {
    const nextIssues = issues.filter((item) => item.id !== issueId);
    setIssues(nextIssues);
    saveStoredIssues(currentUser, nextIssues);
    saveIssueBoardToast({ message: "Issue card deleted successfully.", type: "success" });
    try {
      await deleteIssue(issueId);
    } catch (deleteError) {
      console.error("Failed to delete issue card from backend", deleteError);
      saveIssueBoardToast({ message: "Issue card deleted locally only.", type: "error" });
    }
    navigate("/issues");
  };

  if (!issue && isLoadingIssue) {
    return (
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <Link
          to="/issues"
          className="inline-flex w-fit items-center gap-2 text-sm font-extrabold text-[#003870] transition hover:text-[#004b95]"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={3} />
          Back to Issue Board
        </Link>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="text-sm font-bold text-slate-500">Loading issue card...</p>
        </div>
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <Link
          to="/issues"
          className="inline-flex w-fit items-center gap-2 text-sm font-extrabold text-[#003870] transition hover:text-[#004b95]"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={3} />
          Back to Issue Board
        </Link>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-slate-400">
            Missing Card
          </p>
          <h1 className="mt-3 text-3xl font-extrabold text-slate-950">
            Issue not found
          </h1>
          <p className="mt-3 text-base font-medium leading-7 text-slate-500">
            This card may have been removed from your local issue board.
          </p>
        </div>
      </div>
    );
  }

  const status = getIssueStatusOption(issue.status);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5">
      {toast && (
        <IssueToast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <Link
        to="/issues"
        className="inline-flex w-fit items-center gap-2 text-sm font-extrabold text-[#003870] transition hover:text-[#004b95]"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={3} />
        Back to Issue Board
      </Link>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_12px_34px_rgba(15,23,42,0.04)]">
          <div className="border-b border-slate-100 p-5 sm:p-6">
            <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-slate-400">
              Issue Card
            </p>
            <input
              value={issue.title}
              onChange={(event) => updateIssue({ title: event.target.value })}
              className="mt-3 w-full rounded-2xl border border-transparent bg-transparent px-0 text-3xl font-extrabold tracking-tight text-[#191c1d] outline-none transition placeholder:text-slate-300 focus:border-slate-200 focus:bg-slate-50 focus:px-4 sm:text-4xl"
              placeholder="Issue title"
            />
            <p className="mt-2 text-base font-medium leading-7 text-[#424751]">
              {issue.clientName || "Client"} issue card
            </p>
          </div>

          <div className="border-b border-slate-100 bg-slate-50/60 px-5 sm:px-6">
            <div className="flex gap-2">
              <button
                type="button"
                className="border-b-2 border-[#003870] px-4 py-3.5 text-sm font-extrabold text-[#003870]"
              >
                Description
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-4 p-5 sm:p-6">
            <IssueVoiceInput
              onRecordingComplete={(attachment) => {
                const attachments = Array.isArray(issue.attachments) ? issue.attachments : [];
                updateIssue({ attachments: [...attachments, attachment] });
              }}
            />

            <textarea
              value={issue.notes || ""}
              onChange={(event) => updateIssue({ notes: event.target.value })}
              placeholder="Write issue description..."
              rows={6}
              className="w-full resize-none rounded-[1.5rem] border border-slate-200 bg-slate-50 px-5 py-4 text-base font-medium leading-8 text-slate-700 outline-none transition placeholder:text-slate-300 focus:border-[#003870] focus:bg-white"
            />

            <IssueAttachmentUploader
              attachments={Array.isArray(issue.attachments) ? issue.attachments : []}
              onChange={(attachments) => updateIssue({ attachments })}
            />
          </div>
        </section>

        <aside className="flex flex-col gap-4">
          <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_12px_34px_rgba(15,23,42,0.04)]">
            <div className="flex flex-col gap-2">
              <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-slate-400">
                Change Status
              </p>
              <IssueStatusSelect
                value={issue.status}
                onChange={handleStatusChange}
              />
            </div>

            <div className="mt-5 space-y-4 border-t border-slate-100 pt-5">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-slate-400">
                  Status
                </p>
                <span className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-extrabold uppercase tracking-[0.12em] ${status.pillClass}`}>
                  {status.label}
                </span>
              </div>

              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-slate-400">
                  Client
                </p>
                <p className="mt-2 text-sm font-extrabold text-slate-950">
                  {issue.clientName || "Client"}
                </p>
              </div>

              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-slate-400">
                  Created
                </p>
                <p className="mt-2 text-sm font-bold text-slate-600">
                  {formatDateTime(issue.createdAt)}
                </p>
              </div>

              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-slate-400">
                  Completed
                </p>
                <p className="mt-2 text-sm font-bold text-slate-600">
                  {formatDateTime(issue.completedAt)}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_12px_34px_rgba(15,23,42,0.04)]">
            <button
              type="button"
              onClick={handleUpdateIssue}
              disabled={isSavingIssue}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#003870] px-4 py-3 text-sm font-extrabold text-white shadow-lg shadow-[#003870]/15 transition hover:bg-[#004b95] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save className="h-4 w-4" strokeWidth={3} />
              {isSavingIssue ? "Updating..." : "Update Card"}
            </button>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_12px_34px_rgba(15,23,42,0.04)]">
            {!isConfirmingDelete ? (
              <button
                type="button"
                onClick={() => setIsConfirmingDelete(true)}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-blue-50 px-4 py-3 text-sm font-extrabold text-[#003870] shadow-sm transition hover:bg-blue-100"
              >
                <Trash2 className="h-4 w-4" strokeWidth={3} />
                Delete Card
              </button>
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-blue-50 p-3">
                <p className="text-xs font-extrabold text-[#003870]">
                  Delete this card?
                </p>
                <div className="mt-3 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsConfirmingDelete(false)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm transition hover:bg-slate-50"
                    aria-label="Cancel delete"
                  >
                    <X className="h-4 w-4" strokeWidth={3} />
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteIssue}
                    className="inline-flex items-center gap-1.5 rounded-full bg-[#003870] px-4 py-2 text-xs font-extrabold text-white shadow-sm transition hover:bg-[#004b95]"
                  >
                    <Trash2 className="h-3.5 w-3.5" strokeWidth={3} />
                    Delete
                  </button>
                </div>
              </div>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
