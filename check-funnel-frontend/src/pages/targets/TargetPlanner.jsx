import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { getClientById, getClients } from "../../api/client";
import { getFacebookInsights } from "../../api/facebook";
import { getInstagramInsights } from "../../api/instagram";
import { createTargetSnapshot, getTargetSnapshot } from "../../api/targets";
import { getTiktokInsights } from "../../api/tiktok";
import {
  PLATFORM_LABELS,
  attachRangeMetadata,
  buildTargetSummary,
  buildTiktokMonthlyData,
  formatMonthLabel,
  formatMonthKey,
  formatNumber,
  formatPercent,
  generateMonthlyRanges,
  getMetricConfigs,
  hasPlatformCredentials,
  isClientActiveForPlatform,
  normalizeActiveChannels,
} from "../../utils/targetMetrics";

const PLATFORM_KEYS = ["facebook", "instagram", "tiktok"];
const TARGET_FETCH_TIMEOUT_MS = 45000;
const TARGET_FETCH_CONCURRENCY = 2;

function CalendarIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" strokeLinecap="round" />
    </svg>
  );
}

function ChevronIcon({ direction = "left" }) {
  return (
    <svg
      className={`h-4 w-4 ${direction === "right" ? "rotate-180" : ""}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
    >
      <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
      <path d="M12 20h9" strokeLinecap="round" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" strokeLinejoin="round" />
    </svg>
  );
}

function SaveIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z" strokeLinejoin="round" />
      <path d="M17 21v-8H7v8M7 3v5h8" strokeLinejoin="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
    </svg>
  );
}

function getNextMonthKey(date = new Date()) {
  return formatMonthKey(new Date(date.getFullYear(), date.getMonth() + 1, 1));
}

function getMonthRange(monthKey) {
  const [year, month] = monthKey.split("-").map(Number);
  const sinceDate = new Date(year, month - 1, 1);
  const untilDate = new Date(year, month, 0);

  return {
    monthKey,
    monthLabel: getMonthLabelFromKey(monthKey),
    since: `${year}-${String(month).padStart(2, "0")}-01`,
    until: `${year}-${String(month).padStart(2, "0")}-${String(untilDate.getDate()).padStart(2, "0")}`,
    isCurrentMonth: formatMonthKey(new Date()) === monthKey,
    sinceDate,
    untilDate,
  };
}

function getMonthLabelFromKey(monthKey) {
  if (!/^\d{4}-\d{2}$/.test(monthKey || "")) return "Selected month";
  const [year, month] = monthKey.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });
}

function normalizeClient(client) {
  return {
    ...client,
    activeChannels: normalizeActiveChannels(client),
  };
}

function errorMessage(error) {
  const message = error?.response?.data?.message || error?.message || "Unable to fetch live insights.";
  return Array.isArray(message) ? message.join(", ") : message;
}

function buildUnavailableSummary(client, platform, message, status = "missing_config") {
  return {
    clientId: client.id,
    clientName: client.name,
    platform,
    generatedAt: new Date().toISOString(),
    status,
    message,
    completedMonthCount: 0,
    currentMonthLabel: formatMonthLabel(new Date()),
    metricTargets: getMetricConfigs(platform).map((metric) => ({
      key: metric.key,
      label: metric.label,
      average: 0,
      target: 0,
      currentMonth: 0,
      progress: 0,
      ruleApplied: "none",
    })),
  };
}

function buildLoadingSummary(client, platform) {
  return buildUnavailableSummary(
    client,
    platform,
    `Pulling live monthly data from ${PLATFORM_LABELS[platform]}...`,
    "loading"
  );
}

function withTimeout(promise, timeoutMs, message) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      window.setTimeout(() => reject(new Error(message)), timeoutMs);
    }),
  ]);
}

async function loadFacebookTarget(client) {
  if (!hasPlatformCredentials(client, "facebook")) {
    return buildUnavailableSummary(client, "facebook", "Facebook Page ID or API key is missing.");
  }

  const generatedAt = new Date();
  const ranges = generateMonthlyRanges(generatedAt);
  const monthlyData = await Promise.all(
    ranges.map((range) =>
      getFacebookInsights(client.facebookPageId, client.facebookApiKey, range.since, range.until)
        .then((response) => attachRangeMetadata(response, range))
        .catch((error) => ({ ...range, error: errorMessage(error) }))
    )
  );

  return buildTargetSummary({ client, platform: "facebook", monthlyData, generatedAt });
}

async function loadInstagramTarget(client) {
  if (!hasPlatformCredentials(client, "instagram")) {
    return buildUnavailableSummary(client, "instagram", "Instagram Account ID or API key is missing.");
  }

  const generatedAt = new Date();
  const ranges = generateMonthlyRanges(generatedAt);
  const response = await getInstagramInsights(client.instagramAccountId, client.instagramApiKey, undefined, "30");
  const weeks = response.weeks || [];

  const monthlyData = weeks.map((row, index) => {
    const matchingRange = ranges.find((range) => range.since === row.since) || ranges[index] || ranges[ranges.length - 1];
    return attachRangeMetadata(row, matchingRange);
  });

  return buildTargetSummary({ client, platform: "instagram", monthlyData, generatedAt });
}

async function loadTiktokTarget(client) {
  if (!hasPlatformCredentials(client, "tiktok")) {
    return buildUnavailableSummary(client, "tiktok", "TikTok credentials are missing or incomplete.");
  }

  const generatedAt = new Date();
  const response = await getTiktokInsights(client.id);
  const monthlyData = buildTiktokMonthlyData(response.videos || [], generatedAt);
  const summary = buildTargetSummary({ client, platform: "tiktok", monthlyData, generatedAt });

  return {
    ...summary,
    profileStats: response.user,
  };
}

async function loadClientTarget(client, platform) {
  if (platform === "facebook") return loadFacebookTarget(client);
  if (platform === "instagram") return loadInstagramTarget(client);
  if (platform === "tiktok") return loadTiktokTarget(client);
  return buildUnavailableSummary(client, platform, "Unsupported platform.", "error");
}

async function loadClientBasis(client, platform, targetMonth) {
  const range = getMonthRange(targetMonth);
  const buildBasisSummary = (row) => ({
    clientId: client.id,
    clientName: client.name,
    platform,
    metricTargets: getMetricConfigs(platform).map((metric) => ({
      key: metric.key,
      currentMonth: Number(metric.getValue(row)) || 0,
    })),
  });

  if (platform === "facebook") {
    if (!hasPlatformCredentials(client, "facebook")) return null;
    const response = await getFacebookInsights(client.facebookPageId, client.facebookApiKey, range.since, range.until);
    return buildBasisSummary(attachRangeMetadata(response, { ...range, isCurrentMonth: true }));
  }

  if (platform === "instagram") {
    if (!hasPlatformCredentials(client, "instagram")) return null;
    const response = await getInstagramInsights(client.instagramAccountId, client.instagramApiKey, range.until, "30");
    const matchingRow = (response.weeks || []).find((row) => row.since === range.since) || response.weeks?.at(-1);
    if (!matchingRow) return null;
    return buildBasisSummary(attachRangeMetadata(matchingRow, { ...range, isCurrentMonth: true }));
  }

  if (platform === "tiktok") {
    if (!hasPlatformCredentials(client, "tiktok")) return null;
    const response = await getTiktokInsights(client.id);
    const monthlyData = buildTiktokMonthlyData(response.videos || [], range.untilDate);
    const matchingRow = monthlyData.find((row) => row.monthKey === targetMonth);
    if (!matchingRow) return null;
    return buildBasisSummary({ ...matchingRow, isCurrentMonth: true });
  }

  return null;
}

function prepareRowsForSnapshot(rows, targetMonth) {
  return rows.map((row) => ({
    ...row,
    targetMonth,
    targetMonthLabel: getMonthLabelFromKey(targetMonth),
    metricTargets: row.metricTargets.map((metric) => ({
      ...metric,
      basisValue: null,
      basisProgress: null,
    })),
  }));
}

function mergeSnapshotRowsWithClients(rows = [], platform, platformClients = []) {
  const rowsByClientId = new Set(rows.map((row) => row.clientId));
  const missingRows = platformClients
    .filter((client) => !rowsByClientId.has(client.id))
    .map((client) =>
      buildUnavailableSummary(
        client,
        platform,
        `No saved ${PLATFORM_LABELS[platform]} target for this client. Create Target again to save it.`,
        "missing_snapshot"
      )
    );

  return [...rows, ...missingRows];
}

function applyBasisRows(rows, basisRows, targetMonth, basisStatus = "realtime") {
  const basisByClientId = new Map(
    basisRows.filter(Boolean).map((row) => [row.clientId, row])
  );

  return rows.map((row) => {
    const basisRow = basisByClientId.get(row.clientId);
    if (!basisRow) return row;

    return {
      ...row,
      basisStatus,
      basisMonthLabel: getMonthLabelFromKey(targetMonth),
      metricTargets: row.metricTargets.map((metric) => {
        const basisMetric = basisRow.metricTargets.find((item) => item.key === metric.key);
        const basisValue = basisMetric?.currentMonth ?? null;

        return {
          ...metric,
          basisValue,
          basisProgress: basisValue !== null && metric.target > 0 ? basisValue / metric.target : null,
        };
      }),
    };
  });
}

function cloneTargetRows(rows = []) {
  return rows.map((row) => ({
    ...row,
    metricTargets: (row.metricTargets || []).map((metric) => ({ ...metric })),
  }));
}

function normalizeEditableNumber(value) {
  const number = Number(String(value ?? "").replace(/,/g, ""));
  return Number.isFinite(number) && number >= 0 ? number : 0;
}

function prepareEditedRowsForSave(rows = []) {
  return rows.map((row) => ({
    ...row,
    metricTargets: (row.metricTargets || []).map((metric) => {
      const average = normalizeEditableNumber(metric.average);
      const target = normalizeEditableNumber(metric.target);
      const currentMonth = normalizeEditableNumber(metric.currentMonth);
      const basisValue = metric.basisValue === null || metric.basisValue === undefined
        ? null
        : normalizeEditableNumber(metric.basisValue);

      return {
        ...metric,
        average,
        target,
        currentMonth,
        progress: target > 0 ? currentMonth / target : 0,
        basisValue,
        basisProgress: basisValue !== null && target > 0 ? basisValue / target : null,
      };
    }),
  }));
}

function PlatformTabs({ activePlatform, onChange }) {
  return (
    <div className="flex w-full overflow-x-auto rounded-full bg-[#f3f4f5] p-1 sm:w-auto">
      {PLATFORM_KEYS.map((platform) => (
        <button
          key={platform}
          onClick={() => onChange(platform)}
          className={`flex-shrink-0 rounded-full px-5 py-2.5 text-sm font-bold transition ${
            activePlatform === platform
              ? "bg-[#003870] text-white shadow-sm"
              : "text-[#727782] hover:bg-white hover:text-[#003870]"
          }`}
        >
          {PLATFORM_LABELS[platform]}
        </button>
      ))}
    </div>
  );
}

function MonthPicker({ value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewYear, setViewYear] = useState(() => Number(value.split("-")[0]) || new Date().getFullYear());
  const pickerRef = useRef(null);

  const months = useMemo(() => (
    Array.from({ length: 12 }, (_, index) => ({
      month: index + 1,
      label: new Date(viewYear, index, 1).toLocaleDateString("en-GB", { month: "short" }),
      value: `${viewYear}-${String(index + 1).padStart(2, "0")}`,
    }))
  ), [viewYear]);

  useEffect(() => {
    function handleOutsideClick(event) {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const selectedMonth = value.split("-")[1];
  const currentMonthValue = formatMonthKey(new Date());

  return (
    <div className="relative" ref={pickerRef}>
      <button
        type="button"
        onClick={() => {
          setViewYear(Number(value.split("-")[0]) || new Date().getFullYear());
          setIsOpen((open) => !open);
        }}
        className="inline-flex h-11 min-w-56 items-center justify-between gap-3 rounded-full border border-[#c2c6d3]/30 bg-white px-5 text-sm font-bold text-[#003870] shadow-sm transition hover:bg-[#f3f4f5]"
      >
        <span className="inline-flex items-center gap-3">
          <CalendarIcon />
          {getMonthLabelFromKey(value)}
        </span>
        <svg className={`h-4 w-4 text-[#727782] transition-transform ${isOpen ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-3 w-72 rounded-3xl border border-[#c2c6d3]/30 bg-white p-4 shadow-2xl animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="mb-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setViewYear((year) => year - 1)}
              className="flex h-9 w-9 items-center justify-center rounded-full text-[#727782] transition hover:bg-[#f3f4f5] hover:text-[#003870]"
              title="Previous year"
            >
              <ChevronIcon />
            </button>
            <span className="text-lg font-extrabold text-[#191c1d]">{viewYear}</span>
            <button
              type="button"
              onClick={() => setViewYear((year) => year + 1)}
              className="flex h-9 w-9 items-center justify-center rounded-full text-[#727782] transition hover:bg-[#f3f4f5] hover:text-[#003870]"
              title="Next year"
            >
              <ChevronIcon direction="right" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {months.map((month) => {
              const isSelected = month.value === value;
              const isSameMonth = month.value === currentMonthValue;

              return (
                <button
                  key={month.value}
                  type="button"
                  onClick={() => {
                    onChange(month.value);
                    setIsOpen(false);
                  }}
                  className={`h-11 rounded-2xl text-sm font-bold transition ${
                    isSelected
                      ? "bg-[#003870] text-white shadow-md"
                      : isSameMonth
                        ? "bg-[#003870]/10 text-[#003870] hover:bg-[#003870]/15"
                        : "text-[#424751] hover:bg-[#f3f4f5] hover:text-[#003870]"
                  }`}
                >
                  {month.label}
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-[#edeeef] pt-3">
            <button
              type="button"
              onClick={() => {
                onChange(getNextMonthKey());
                setIsOpen(false);
              }}
              className="text-xs font-bold uppercase tracking-widest text-[#003870] transition hover:text-[#014f99]"
            >
              Next target month
            </button>
            <span className="text-xs font-bold uppercase tracking-widest text-[#727782]">
              {String(selectedMonth || "").padStart(2, "0")}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TargetPlanner() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const requestedPlatform = searchParams.get("platform");
  const scopedClientId = id ? Number(id) : null;
  const [clients, setClients] = useState([]);
  const [activePlatform, setActivePlatform] = useState(
    PLATFORM_KEYS.includes(requestedPlatform) ? requestedPlatform : "facebook"
  );
  const [clientsLoading, setClientsLoading] = useState(true);
  const [targetsLoading, setTargetsLoading] = useState(false);
  const [targetRows, setTargetRows] = useState([]);
  const [selectedTargetMonth, setSelectedTargetMonth] = useState(() => getNextMonthKey());
  const [savedSnapshot, setSavedSnapshot] = useState(null);
  const [snapshotLoading, setSnapshotLoading] = useState(false);
  const [savingTarget, setSavingTarget] = useState(false);
  const [savingEdits, setSavingEdits] = useState(false);
  const [isEditingValues, setIsEditingValues] = useState(false);
  const [editedRows, setEditedRows] = useState([]);
  const [statusMessage, setStatusMessage] = useState("");
  const [clientLoadError, setClientLoadError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadClients() {
      setClientsLoading(true);
      try {
        const data = scopedClientId ? [await getClientById(scopedClientId)] : await getClients();
        if (!cancelled) {
          setClientLoadError("");
          setClients(data.map(normalizeClient));
        }
      } catch (error) {
        console.error("Failed to load clients for targets", error);
        if (!cancelled) {
          setClients([]);
          setClientLoadError(`Client load failed: ${errorMessage(error)}. Please sign in again if this keeps happening.`);
        }
      } finally {
        if (!cancelled) setClientsLoading(false);
      }
    }

    loadClients();
    return () => {
      cancelled = true;
    };
  }, [scopedClientId]);

  useEffect(() => {
    if (!clients.length) return;
    if (PLATFORM_KEYS.includes(requestedPlatform)) {
      setActivePlatform(requestedPlatform);
      return;
    }

    const preferredPlatform = PLATFORM_KEYS.find((platform) =>
      clients.some((client) => isClientActiveForPlatform(client, platform))
    );
    if (preferredPlatform) setActivePlatform(preferredPlatform);
  }, [clients, requestedPlatform]);

  const targetClients = useMemo(() => clients, [clients]);

  const metricConfigs = useMemo(() => getMetricConfigs(activePlatform), [activePlatform]);
  const readyRows = useMemo(() => targetRows.filter((row) => row.status === "ready"), [targetRows]);
  const isViewingSavedTarget = Boolean(savedSnapshot?.rows?.length);
  const hasDraftRows = targetRows.length > 0;
  const selectedTargetMonthLabel = getMonthLabelFromKey(selectedTargetMonth);
  const nextTargetMonth = getNextMonthKey();
  const nextTargetMonthLabel = getMonthLabelFromKey(nextTargetMonth);
  const rawDisplayRows = isViewingSavedTarget
    ? mergeSnapshotRowsWithClients(
        isEditingValues ? editedRows : savedSnapshot.rows,
        activePlatform,
        targetClients
      )
    : targetRows;
  const displayRows = rawDisplayRows.filter((row) =>
    row.status === "ready" || row.status === "loading"
  );
  const canEditSavedTarget = isViewingSavedTarget && displayRows.some((row) => row.status === "ready");
  const hasAnyTargetClients = clients.length > 0;
  const createTargetDisabled = savingTarget || savingEdits || targetsLoading || clientsLoading || !hasAnyTargetClients;
  const createTargetTitle = !hasAnyTargetClients
    ? "Clients must load before targets can be created."
    : `Creates the target for ${nextTargetMonthLabel}`;

  useEffect(() => {
    setIsEditingValues(false);
    setEditedRows([]);
  }, [activePlatform, selectedTargetMonth, savedSnapshot?.id]);

  const getClientsForPlatform = () => {
    return clients;
  };

  const loadDraftTargetRows = async (
    platform = activePlatform,
    platformClients = targetClients,
    shouldUpdateTable = platform === activePlatform
  ) => {
    if (!platformClients.length) {
      if (shouldUpdateTable) setTargetRows([]);
      return [];
    }

    if (shouldUpdateTable) {
      setTargetRows(platformClients.map((client) => buildLoadingSummary(client, platform)));
    }

    const completedRows = [];
    let nextClientIndex = 0;

    const loadNextClient = async () => {
      while (nextClientIndex < platformClients.length) {
        const clientIndex = nextClientIndex;
        nextClientIndex += 1;
        const client = platformClients[clientIndex];

        const row = await withTimeout(
          loadClientTarget(client, platform),
          TARGET_FETCH_TIMEOUT_MS,
          `${PLATFORM_LABELS[platform]} live data timed out for ${client.name}.`
        ).catch((error) =>
          buildUnavailableSummary(client, platform, errorMessage(error), "error")
        );

        completedRows.push(row);
        if (shouldUpdateTable) {
          setTargetRows((previousRows) =>
            previousRows.map((existingRow) =>
              existingRow.clientId === client.id ? row : existingRow
            )
          );
        }
      }
    };

    await Promise.all(
      Array.from(
        { length: Math.min(TARGET_FETCH_CONCURRENCY, platformClients.length) },
        loadNextClient
      )
    );

    return completedRows;
  };

  useEffect(() => {
    let cancelled = false;

    async function loadSavedSnapshot() {
      setSnapshotLoading(true);
      setStatusMessage("");
      setTargetRows([]);
      setSavedSnapshot(null);
      try {
        const snapshot = await getTargetSnapshot({
          platform: activePlatform,
          targetMonth: selectedTargetMonth,
          scopeClientId: scopedClientId,
        });
        if (!cancelled) setSavedSnapshot(snapshot);
      } catch (error) {
        console.error("Failed to load saved target snapshot", error);
        if (!cancelled) {
          setSavedSnapshot(null);
          setStatusMessage(`Saved target load failed: ${errorMessage(error)}`);
        }
      } finally {
        if (!cancelled) setSnapshotLoading(false);
      }
    }

    loadSavedSnapshot();
    return () => {
      cancelled = true;
    };
  }, [activePlatform, scopedClientId, selectedTargetMonth]);

  useEffect(() => {
    if (!savedSnapshot?.rows?.length || !clients.length) return;

    const currentMonth = formatMonthKey(new Date());
    const isFutureMonth = selectedTargetMonth > currentMonth;
    const isPastMonth = selectedTargetMonth < currentMonth;
    const hasRealtimeBasis = selectedTargetMonth === currentMonth
      && savedSnapshot.rows.every((row) => row.basisStatus === "realtime");

    if (isFutureMonth) return;
    if (hasRealtimeBasis) return;
    if (isPastMonth && savedSnapshot.finalizedAt) return;

    let cancelled = false;

    async function syncBasisOnly() {
      setSnapshotLoading(true);
      try {
        const clientsById = new Map(clients.map((client) => [client.id, client]));
        const basisRows = await Promise.all(
          savedSnapshot.rows.map((row) => {
            const client = clientsById.get(row.clientId);
            if (!client) return null;
            return loadClientBasis(client, activePlatform, selectedTargetMonth).catch(() => null);
          })
        );

        if (cancelled) return;

        const updatedRows = applyBasisRows(
          savedSnapshot.rows,
          basisRows,
          selectedTargetMonth,
          isPastMonth ? "final" : "realtime"
        );

        if (isPastMonth) {
          const finalizedAt = new Date().toISOString();
          const updatedSnapshot = await createTargetSnapshot({
            platform: activePlatform,
            targetMonth: selectedTargetMonth,
            generatedMonth: savedSnapshot.generatedMonth,
            generatedAt: savedSnapshot.generatedAt,
            finalizedAt,
            scopeClientId: scopedClientId,
            rows: updatedRows,
          });

          if (!cancelled) setSavedSnapshot(updatedSnapshot);
        } else {
          setSavedSnapshot((previous) => previous ? { ...previous, rows: updatedRows } : previous);
        }
      } finally {
        if (!cancelled) setSnapshotLoading(false);
      }
    }

    syncBasisOnly();
    return () => {
      cancelled = true;
    };
  }, [
    activePlatform,
    clients,
    savedSnapshot?.generatedAt,
    savedSnapshot?.generatedMonth,
    savedSnapshot?.id,
    savedSnapshot?.finalizedAt,
    savedSnapshot?.rows,
    scopedClientId,
    selectedTargetMonth,
  ]);

  const handleStartEditing = () => {
    if (!savedSnapshot?.rows?.length) return;
    setEditedRows(cloneTargetRows(savedSnapshot.rows));
    setIsEditingValues(true);
    setStatusMessage("Editing target values. Save when finished.");
  };

  const handleCancelEditing = () => {
    setIsEditingValues(false);
    setEditedRows([]);
    setStatusMessage("");
  };

  const handleMetricEdit = (clientId, metricKey, field, value) => {
    setEditedRows((previousRows) =>
      previousRows.map((row) => {
        if (row.clientId !== clientId) return row;

        return {
          ...row,
          metricTargets: (row.metricTargets || []).map((metric) =>
            metric.key === metricKey
              ? { ...metric, [field]: value, ruleApplied: "manual" }
              : metric
          ),
        };
      })
    );
  };

  const handleSaveEdits = async () => {
    if (!savedSnapshot?.rows?.length) return;

    const rowsToSave = prepareEditedRowsForSave(editedRows);
    setSavingEdits(true);
    setStatusMessage("");
    try {
      const updatedSnapshot = await createTargetSnapshot({
        platform: activePlatform,
        targetMonth: selectedTargetMonth,
        generatedMonth: savedSnapshot.generatedMonth,
        generatedAt: savedSnapshot.generatedAt,
        finalizedAt: savedSnapshot.finalizedAt,
        scopeClientId: scopedClientId,
        rows: rowsToSave,
      });

      setSavedSnapshot(updatedSnapshot);
      setEditedRows([]);
      setIsEditingValues(false);
      setStatusMessage("Target values saved.");
    } catch (error) {
      setStatusMessage(errorMessage(error));
    } finally {
      setSavingEdits(false);
    }
  };

  const handleCreateTarget = async () => {
    const platformJobs = PLATFORM_KEYS.map((platform) => ({
      platform,
      platformClients: getClientsForPlatform(platform),
    })).filter((job) => job.platformClients.length > 0);

    if (!platformJobs.length) {
      setStatusMessage("No clients available to create targets yet.");
      return;
    }

    const generatedAt = new Date();
    const targetMonth = getNextMonthKey(generatedAt);

    setSavingTarget(true);
    setTargetsLoading(true);
    setStatusMessage("");
    try {
      const createdPlatforms = [];
      const failedPlatforms = [];
      let activeSnapshot = null;

      for (const { platform, platformClients } of platformJobs) {
        const generatedRows = await loadDraftTargetRows(
          platform,
          platformClients,
          platform === activePlatform
        );
        const readyRowsToSave = generatedRows.filter((row) => row.status === "ready");

        if (!readyRowsToSave.length) {
          failedPlatforms.push(PLATFORM_LABELS[platform]);
          continue;
        }

        const snapshotRows = prepareRowsForSnapshot(generatedRows, targetMonth);
        const snapshot = await createTargetSnapshot({
          platform,
          targetMonth,
          generatedMonth: formatMonthKey(generatedAt),
          generatedAt: generatedAt.toISOString(),
          scopeClientId: scopedClientId,
          rows: snapshotRows,
        });

        createdPlatforms.push(PLATFORM_LABELS[platform]);
        if (platform === activePlatform) activeSnapshot = snapshot;
      }

      if (!createdPlatforms.length) {
        setStatusMessage("No ready target rows to create yet.");
        return;
      }

      setSelectedTargetMonth(targetMonth);
      if (activeSnapshot) setSavedSnapshot(activeSnapshot);
      setTargetRows([]);
      setStatusMessage(
        `Target created for ${getMonthLabelFromKey(targetMonth)}: ${createdPlatforms.join(", ")}.${
          failedPlatforms.length ? ` Skipped: ${failedPlatforms.join(", ")}.` : ""
        }`
      );
    } catch (error) {
      setStatusMessage(errorMessage(error));
    } finally {
      setTargetsLoading(false);
      setSavingTarget(false);
    }
  };

  return (
    <section className="w-full max-w-full overflow-hidden">
      <header className="mb-8 flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
        <div className="max-w-4xl">
          <h1 className="text-4xl tracking-tight text-[#191c1d] sm:text-5xl">
            <span className="font-extrabold">Performance </span>
            <span className="font-medium">Targets</span>
          </h1>
          <p className="mt-3 text-base font-medium leading-8 text-[#424751] sm:text-lg">
            Targets are calculated from live platform insights. The current month is excluded from the baseline,
            completed months are averaged, and each created target applies to the next month.
          </p>
        </div>

        <div className="flex flex-col gap-4 sm:items-end">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            <MonthPicker value={selectedTargetMonth} onChange={setSelectedTargetMonth} />
            {scopedClientId && (
              <Link
                to={`/clients/${scopedClientId}/insights`}
                className="inline-flex h-11 items-center justify-center rounded-full border border-[#c2c6d3]/30 bg-white px-5 text-sm font-bold text-[#003870] transition hover:bg-[#f3f4f5]"
              >
                Back to Insights
              </Link>
            )}
            <button
              onClick={handleCreateTarget}
              disabled={createTargetDisabled}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#003870] px-5 text-sm font-bold text-white shadow-lg transition hover:bg-[#014f99] active:scale-95 disabled:opacity-60"
              title={createTargetTitle}
            >
              <PlusIcon />
              {savingTarget ? "Creating..." : "Create"}
            </button>
          </div>

          <PlatformTabs activePlatform={activePlatform} onChange={setActivePlatform} />
          <p className="text-xs font-bold uppercase tracking-widest text-[#727782]">
            Create now applies to {nextTargetMonthLabel}
          </p>
        </div>
      </header>

      <div className="min-w-0">
        <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-2xl font-extrabold text-[#191c1d]">
              {PLATFORM_LABELS[activePlatform]} {selectedTargetMonthLabel} Target Table
            </h2>
            <p className="mt-1 text-sm font-semibold text-[#727782]">
              {isViewingSavedTarget
                ? `Saved target generated from ${getMonthLabelFromKey(savedSnapshot.generatedMonth)} data`
                : hasDraftRows
                  ? `${readyRows.length} of ${targetClients.length} client${targetClients.length === 1 ? "" : "s"} ready for saving`
                  : `No saved target for ${selectedTargetMonthLabel} yet`}
            </p>
            {statusMessage && (
              <p className="mt-1 text-sm font-bold text-[#003870]">{statusMessage}</p>
            )}
            {clientLoadError && (
              <p className="mt-1 text-sm font-bold text-[#93000a]">{clientLoadError}</p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {canEditSavedTarget && (
              isEditingValues ? (
                <>
                  <button
                    type="button"
                    onClick={handleCancelEditing}
                    disabled={savingEdits}
                    className="inline-flex h-9 items-center gap-2 rounded-full border border-[#c2c6d3]/40 bg-white px-4 text-xs font-bold uppercase tracking-widest text-[#424751] transition hover:bg-[#f3f4f5] disabled:opacity-60"
                  >
                    <CloseIcon />
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveEdits}
                    disabled={savingEdits}
                    className="inline-flex h-9 items-center gap-2 rounded-full bg-[#003870] px-4 text-xs font-bold uppercase tracking-widest text-white transition hover:bg-[#014f99] disabled:opacity-60"
                  >
                    <SaveIcon />
                    {savingEdits ? "Saving" : "Save"}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={handleStartEditing}
                  disabled={targetsLoading || snapshotLoading}
                  className="inline-flex h-9 items-center gap-2 rounded-full border border-[#c2c6d3]/40 bg-white px-4 text-xs font-bold uppercase tracking-widest text-[#003870] transition hover:bg-[#f3f4f5] disabled:opacity-60"
                >
                  <EditIcon />
                  Edit
                </button>
              )
            )}
            {(targetsLoading || snapshotLoading) && (
              <span className="self-start rounded-full bg-[#003870]/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-[#003870] md:self-auto">
                Syncing
              </span>
            )}
          </div>
        </div>

        <div className="overflow-x-auto border border-[#c2c6d3]/30 bg-white">
              <table className="w-full min-w-[900px] border-collapse text-left">
                <thead>
                  <tr className="bg-[#f3f4f5] text-[10px] font-bold uppercase tracking-widest text-[#727782]">
                    <th className="px-6 py-4">Client</th>
                    {metricConfigs.map((metric) => (
                      <Fragment key={metric.key}>
                        <th className="px-4 py-4 text-right border-l border-[#c2c6d3]/20">
                          Average Monthly {metric.label}
                        </th>
                        <th className="px-4 py-4 text-right text-[#003870]">
                          Expected Monthly {metric.label}
                        </th>
                      </Fragment>
                    ))}
                    <th className="px-6 py-4 border-l border-[#c2c6d3]/20">Basis</th>
                  </tr>
                </thead>
                <tbody className="text-sm font-semibold text-[#424751]">
                  {clientsLoading ? (
                    <tr>
                      <td className="px-6 py-8 text-[#727782]" colSpan={(metricConfigs.length * 2) + 2}>
                        Loading configured clients...
                      </td>
                    </tr>
                  ) : displayRows.length === 0 ? (
                    <tr>
                      <td className="px-6 py-8 text-[#727782]" colSpan={(metricConfigs.length * 2) + 2}>
                        {isViewingSavedTarget
                          ? `No connected ${PLATFORM_LABELS[activePlatform]} clients found for this saved target.`
                          : `No saved target for ${PLATFORM_LABELS[activePlatform]} ${selectedTargetMonthLabel}. Use Create to generate one.`}
                      </td>
                    </tr>
                  ) : (
                    displayRows.map((row) => (
                      <tr key={`${row.clientId}-${row.platform}`} className="border-b border-[#edeeef] last:border-b-0 hover:bg-[#f8f9fa]">
                        <td className="px-6 py-5 align-top">
                          <div className="font-extrabold text-[#191c1d]">{row.clientName}</div>
                        </td>

                        {row.status === "ready" ? (
                          <>
                            {row.metricTargets.map((metric) => (
                              <Fragment key={`${row.clientId}-${metric.key}`}>
                                <td className="px-4 py-5 text-right align-top border-l border-[#c2c6d3]/10">
                                  {isEditingValues ? (
                                    <input
                                      type="number"
                                      min="0"
                                      step="1"
                                      value={metric.average ?? ""}
                                      onChange={(event) => handleMetricEdit(row.clientId, metric.key, "average", event.target.value)}
                                      className="h-10 w-28 rounded-xl border border-[#c2c6d3]/40 bg-white px-3 text-right font-extrabold text-[#191c1d] outline-none transition focus:border-[#003870] focus:ring-2 focus:ring-[#003870]/15"
                                    />
                                  ) : (
                                    <div className="font-extrabold text-[#191c1d]">{formatNumber(metric.average)}</div>
                                  )}
                                  <div className="mt-1 text-[11px] font-bold text-[#727782]">
                                    {row.completedMonthCount} month avg.
                                  </div>
                                </td>
                                <td className="px-4 py-5 text-right align-top">
                                  {isEditingValues ? (
                                    <input
                                      type="number"
                                      min="0"
                                      step="1"
                                      value={metric.target ?? ""}
                                      onChange={(event) => handleMetricEdit(row.clientId, metric.key, "target", event.target.value)}
                                      className="h-10 w-28 rounded-xl border border-[#003870]/25 bg-white px-3 text-right font-extrabold text-[#003870] outline-none transition focus:border-[#003870] focus:ring-2 focus:ring-[#003870]/15"
                                    />
                                  ) : (
                                    <div className="font-extrabold text-[#003870]">{formatNumber(metric.target)}</div>
                                  )}
                                  <div className="mt-2 flex justify-end">
                                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest ${
                                      metric.ruleApplied === "manual"
                                        ? "bg-[#ede7f6] text-[#4b3b78]"
                                        : metric.ruleApplied === "minimum"
                                        ? "bg-[#fff4de] text-[#8a5200]"
                                        : "bg-[#003870]/10 text-[#003870]"
                                    }`}>
                                      {metric.ruleApplied === "manual"
                                        ? "Manual"
                                        : metric.ruleApplied === "minimum" ? "Floor" : "+40%"}
                                    </span>
                                  </div>
                                </td>
                              </Fragment>
                            ))}
                            <td className="px-6 py-5 align-top border-l border-[#c2c6d3]/10">
                              <div className="text-xs font-bold uppercase tracking-widest text-[#727782]">
                                {isViewingSavedTarget
                                  ? `${row.basisStatus === "final" ? "Final" : row.basisStatus === "realtime" ? "Realtime" : "Pending"} basis: ${selectedTargetMonthLabel}`
                                  : `Will apply to: ${nextTargetMonthLabel}`}
                              </div>
                              <div className="mt-3 space-y-2">
                                {row.metricTargets.map((metric) => (
                                  <div key={`${row.clientId}-${metric.key}-progress`} className="flex items-center justify-between gap-4">
                                    <span className="text-xs font-bold text-[#727782]">{metric.shortLabel}</span>
                                    <span className="text-xs font-extrabold text-[#191c1d]">
                                      {isViewingSavedTarget
                                        ? metric.basisValue === null || metric.basisValue === undefined
                                          ? "Pending"
                                          : `${formatNumber(metric.basisValue)} (${formatPercent(metric.basisProgress)})`
                                        : `${formatNumber(metric.currentMonth)} (${formatPercent(metric.progress)})`}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </td>
                          </>
                        ) : (
                          <td className="px-4 py-5 text-[#93000a]" colSpan={(metricConfigs.length * 2) + 1}>
                            <span className={row.status === "loading" ? "text-[#727782]" : "text-[#93000a]"}>
                              {row.message}
                            </span>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
        </div>
      </div>
    </section>
  );
}
