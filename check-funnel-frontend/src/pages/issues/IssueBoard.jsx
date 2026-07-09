import { useEffect, useMemo, useState } from "react";
import { getClients } from "../../api/client";
import {
  createIssue,
  deleteIssue,
  getIssues,
  updateIssue,
} from "../../api/issues";
import IssueBoardTabs from "../../components/issues/IssueBoardTabs";
import IssueColumn from "../../components/issues/IssueColumn";
import IssueClientFilter from "../../components/issues/IssueClientFilter";
import { getStoredIssueBoardUser, loadStoredIssues, saveStoredIssues, takeIssueBoardToast } from "../../utils/issueBoardStorage";
import { getIssueStatusOption, normalizeIssueStatus } from "../../utils/issueStatuses";

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

const getInitialBoardState = () => {
  const user = getStoredIssueBoardUser();
  return {
    user,
    issues: loadStoredIssues(user),
  };
};

export default function IssueBoard() {
  const [initialBoardState] = useState(getInitialBoardState);
  const [clients, setClients] = useState([]);
  const [issues, setIssues] = useState(initialBoardState.issues);
  const [clientFilter, setClientFilter] = useState("all");
  const [viewMode, setViewMode] = useState("todo");
  const [toast, setToast] = useState(null);
  const [currentUser] = useState(initialBoardState.user);

  useEffect(() => {
    let isMounted = true;

    async function loadClients() {
      try {
        const fetchedClients = await getClients();
        if (isMounted) setClients(fetchedClients);
      } catch (loadError) {
        console.error("Failed to load clients for issue board", loadError);
      }
    }

    loadClients();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    saveStoredIssues(currentUser, issues);
  }, [currentUser, issues]);

  useEffect(() => {
    let isMounted = true;

    async function loadRemoteIssues() {
      try {
        const localIssues = loadStoredIssues(currentUser);
        const fetchedIssues = await getIssues();
        const fetchedIssueIds = new Set(fetchedIssues.map((issue) => issue.id));
        const localOnlyIssues = localIssues.filter((issue) => !fetchedIssueIds.has(issue.id));
        const migratedIssues = localOnlyIssues.length > 0
          ? await Promise.all(
              localOnlyIssues.map((issue) => createIssue(issue).catch((migrationError) => {
                console.error("Failed to migrate local issue card to backend", migrationError);
                return issue;
              }))
            )
          : [];

        if (!isMounted) return;

        const nextIssues = [...migratedIssues, ...fetchedIssues];
        setIssues(nextIssues);
        saveStoredIssues(currentUser, nextIssues);
      } catch (loadError) {
        console.error("Failed to load issue board cards from backend", loadError);
      }
    }

    loadRemoteIssues();

    return () => {
      isMounted = false;
    };
  }, [currentUser]);

  useEffect(() => {
    const pendingToast = takeIssueBoardToast();
    if (pendingToast) setToast(pendingToast);
  }, []);

  const clientOptions = useMemo(() => (
    clients.map((client) => ({
      id: String(client.id),
      name: client.name,
    }))
  ), [clients]);

  const visibleIssues = useMemo(() => {
    const byClient = clientFilter === "all"
      ? issues
      : issues.filter((issue) => String(issue.clientId) === String(clientFilter));

    return byClient.filter((issue) => normalizeIssueStatus(issue.status) === viewMode);
  }, [clientFilter, issues, viewMode]);

  const visibleClientColumns = useMemo(() => {
    const selectedClients = clientFilter === "all"
      ? clientOptions
      : clientOptions.filter((client) => client.id === String(clientFilter));

    const missingIssueClients = visibleIssues.reduce((missingClients, issue) => {
      const clientId = String(issue.clientId);

      if (
        selectedClients.some((client) => client.id === clientId)
        || missingClients.some((client) => client.id === clientId)
      ) {
        return missingClients;
      }

      missingClients.push({
        id: clientId,
        name: issue.clientName || "Client",
      });
      return missingClients;
    }, []);

    return [...selectedClients, ...missingIssueClients];
  }, [clientFilter, clientOptions, visibleIssues]);

  const handleAddIssue = ({ clientId, clientName, title, notes, attachments = [] }) => {
    const now = new Date().toISOString();
    const newIssue = {
      id: `issue-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      clientId: String(clientId),
      clientName,
      title,
      notes,
      attachments,
      status: viewMode,
      createdAt: now,
      completedAt: viewMode === "done" ? now : null,
    };

    setIssues((currentIssues) => [newIssue, ...currentIssues]);
    createIssue(newIssue)
      .then((savedIssue) => {
        setIssues((currentIssues) => currentIssues.map((issue) => (
          issue.id === newIssue.id ? savedIssue : issue
        )));
      })
      .catch((saveError) => {
        console.error("Failed to save issue card to backend", saveError);
        setToast({ message: "Issue card saved locally only.", type: "error" });
      });
  };

  const handleStatusChange = (issueId, nextStatus) => {
    const normalizedStatus = normalizeIssueStatus(nextStatus);
    const completedAt = normalizedStatus === "done" ? new Date().toISOString() : null;

    setIssues((currentIssues) => currentIssues.map((issue) => (
      issue.id === issueId
        ? {
            ...issue,
            status: normalizedStatus,
            completedAt,
          }
        : issue
    )));
    updateIssue(issueId, { status: normalizedStatus, completedAt }).catch((saveError) => {
      console.error("Failed to update issue status in backend", saveError);
    });
  };

  const handleDeleteIssue = (issueId) => {
    const deletedIssue = issues.find((issue) => issue.id === issueId);
    setIssues((currentIssues) => currentIssues.filter((issue) => issue.id !== issueId));
    setToast({ message: "Issue card deleted successfully.", type: "success" });
    deleteIssue(issueId).catch((deleteError) => {
      console.error("Failed to delete issue card from backend", deleteError);
      if (deletedIssue) {
        setIssues((currentIssues) => [deletedIssue, ...currentIssues]);
      }
      setToast({ message: "Failed to delete issue card.", type: "error" });
    });
  };

  const handleTogglePinIssue = (issueId) => {
    const targetIssue = issues.find((issue) => issue.id === issueId);
    const isPinned = !targetIssue?.isPinned;
    const pinnedAt = isPinned ? new Date().toISOString() : null;

    setIssues((currentIssues) => currentIssues.map((issue) => (
      issue.id === issueId
        ? {
            ...issue,
            isPinned,
            pinnedAt,
          }
        : issue
    )));
    updateIssue(issueId, { isPinned, pinnedAt }).catch((saveError) => {
      console.error("Failed to update pinned issue in backend", saveError);
    });
  };

  const sortIssuesForList = (items) => [...items].sort((firstIssue, secondIssue) => {
    if (Boolean(firstIssue.isPinned) !== Boolean(secondIssue.isPinned)) {
      return firstIssue.isPinned ? -1 : 1;
    }

    const firstDate = new Date(firstIssue.pinnedAt || firstIssue.createdAt || 0).getTime();
    const secondDate = new Date(secondIssue.pinnedAt || secondIssue.createdAt || 0).getTime();
    return secondDate - firstDate;
  });

  const issuesByClient = (clientId) => sortIssuesForList(visibleIssues.filter((issue) => (
    String(issue.clientId) === String(clientId)
  )));

  return (
    <div className="flex w-full flex-col gap-7">
      {toast && (
        <IssueToast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <header className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 flex-1 space-y-2">
          <h1 className="text-4xl tracking-tight text-[#191c1d] sm:text-5xl">
            <span className="font-extrabold">Issue </span>
            <span className="font-medium">Board</span>
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-8 text-[#424751] sm:text-lg">
            Client-wise Kanban view for small tasks, issues, and follow-ups.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <IssueClientFilter
            value={clientFilter}
            clients={clientOptions}
            onChange={setClientFilter}
          />

          <IssueBoardTabs value={viewMode} onChange={setViewMode} />
        </div>
      </header>

      <div className="-mx-4 overflow-x-auto px-4 pb-3 sm:mx-0 sm:px-0 no-scrollbar">
        <div className={`grid grid-flow-col gap-5 ${
          clientFilter === "all"
            ? "auto-cols-[minmax(300px,360px)]"
            : "auto-cols-[minmax(300px,1fr)]"
        }`}>
          {visibleClientColumns.length > 0 ? (
            visibleClientColumns.map((client) => (
              <IssueColumn
                key={client.id}
                clientId={client.id}
                clientName={client.name}
                title={client.name}
                description={`${getIssueStatusOption(viewMode).label} issues`}
                emptyText={`No ${getIssueStatusOption(viewMode).label.toLowerCase()} issues for this client.`}
                issues={issuesByClient(client.id)}
                canAdd
                isFocused={clientFilter !== "all"}
                onAddIssue={handleAddIssue}
                onStatusChange={handleStatusChange}
                onDeleteIssue={handleDeleteIssue}
                onTogglePinIssue={handleTogglePinIssue}
              />
            ))
          ) : (
            <IssueColumn
              title="No Clients"
              description="Client board"
              emptyText="Add clients first, then create issue cards."
              issues={[]}
              canAdd={false}
              onStatusChange={handleStatusChange}
              onDeleteIssue={handleDeleteIssue}
              onTogglePinIssue={handleTogglePinIssue}
            />
          )}
        </div>
      </div>
    </div>
  );
}
