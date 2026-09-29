import { useCallback, useEffect, useRef, useState } from "react";
import {
  getClientById,
  getClientInsightsReportData,
  getClients,
} from "../../api/client";
import {
  getPaidAdsInsights,
  getPaidAdsMonthlyComparison,
  getPaidAdsRangeMonthlyComparison,
} from "../../api/paidAds";
import { generateOrganicReportHighlights } from "../../api/ai";
import ReportControls from "../../components/report-builder/ReportControls";
import ReportPreview from "../../components/report-builder/ReportPreview";
import { defaultReportSettings } from "../../components/report-builder/reportData";
import { defaultComparisonMonths } from "../../utils/paidAdsMonthComparison";
import { buildCampaignObjectivePages } from "../../components/report-builder/paid-slides/campaignFields";
import { buildOrganicHighlightsInput } from "../../components/report-builder/organicHighlightsData";
import {
  downloadReportPdf,
  downloadReportPptx,
  reportFilename,
} from "../../components/report-builder/reportPdf";

function currentMonth() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function defaultComparisonRanges(month) {
  const [year, value] = month.split("-").map(Number);
  const iso = (date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  return {
    currentSince: iso(new Date(year, value - 1, 1)),
    currentUntil: iso(new Date(year, value, 0)),
    compareSince: iso(new Date(year, value - 2, 1)),
    compareUntil: iso(new Date(year, value - 1, 0)),
  };
}

export default function ReportBuilder() {
  const [clients, setClients] = useState([]);
  const [clientId, setClientId] = useState("");
  const [month, setMonth] = useState(currentMonth);
  const [client, setClient] = useState(null);
  const [paidData, setPaidData] = useState(null);
  const [paidMonthlyData, setPaidMonthlyData] = useState(null);
  const [paidRangeMonthlyData, setPaidRangeMonthlyData] = useState(null);
  const [paidRangeMonthlyLoading, setPaidRangeMonthlyLoading] = useState(false);
  const [paidRangeMonthlyError, setPaidRangeMonthlyError] = useState("");
  const [socialData, setSocialData] = useState(null);
  const [organicHighlights, setOrganicHighlights] = useState(null);
  const [organicHighlightsLoading, setOrganicHighlightsLoading] = useState(false);
  const [organicHighlightsError, setOrganicHighlightsError] = useState("");
  const [settings, setSettings] = useState(defaultReportSettings);
  const [sourceErrors, setSourceErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [sourceLoading, setSourceLoading] = useState(false);
  const [monthlyLoading, setMonthlyLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [previewEdits, setPreviewEdits] = useState({
    text: {},
    columnWidths: {},
  });
  const [pageError, setPageError] = useState("");
  const [editorWidth, setEditorWidth] = useState(340);
  const [resizing, setResizing] = useState(false);
  const [comparisonDraft, setComparisonDraft] = useState(() =>
    defaultComparisonRanges(currentMonth()),
  );
  const [appliedComparison, setAppliedComparison] = useState(null);
  const [comparisonMode, setComparisonMode] = useState("previous");
  const [selectedMonths, setSelectedMonths] = useState(() =>
    defaultComparisonMonths(currentMonth()),
  );
  const previewRef = useRef(null);
  const resizeRef = useRef(null);
  const sourceRequestRef = useRef(0);
  const monthlyRequestRef = useRef(0);
  const paidRangeRequestRef = useRef(0);

  useEffect(() => {
    let active = true;
    getClients()
      .then((result) => {
        if (!active) return;
        const list = Array.isArray(result) ? result : [];
        setClients(list);
        if (list.length) setClientId(String(list[0].id));
      })
      .catch((error) =>
        setPageError(
          error?.response?.data?.message ||
            error.message ||
            "Unable to load clients.",
        ),
      );
    return () => {
      active = false;
    };
  }, []);

  const loadSources = useCallback(async (refresh = false) => {
    if (!clientId) return;
    const requestId = ++sourceRequestRef.current;
    const effectiveComparison =
      comparisonMode === "months"
        ? { months: selectedMonths.join(",") }
        : appliedComparison || defaultComparisonRanges(month);
    setLoading(true);
    setSourceLoading(true);
    setPageError("");
    setSourceErrors((current) =>
      current.paidMonthly ? { paidMonthly: current.paidMonthly } : {},
    );
    setPaidData(null);
    setSocialData(null);

    const clientRequest = getClientById(clientId)
      .then((value) => {
        if (requestId === sourceRequestRef.current) setClient(value);
      })
      .catch((error) => {
        if (requestId !== sourceRequestRef.current) return;
        setClient(null);
        setPageError(
          error?.response?.data?.message || "Unable to load this client.",
        );
      });

    const paidRequest = getPaidAdsInsights(
        clientId,
        month,
        appliedComparison
          ? {
              since: appliedComparison.currentSince,
              until: appliedComparison.currentUntil,
              compareSince: appliedComparison.compareSince,
              compareUntil: appliedComparison.compareUntil,
            }
          : {},
      )
      .then((value) => {
        if (requestId === sourceRequestRef.current) setPaidData(value);
      })
      .catch((error) => {
        if (requestId !== sourceRequestRef.current) return;
        setSourceErrors((current) => ({
          ...current,
          paid:
            error?.response?.data?.message ||
            error?.message ||
            "Paid Ads source failed",
        }));
      });

    const socialRequests = ["facebook", "instagram", "tiktok"].map(
      (platform) =>
        getClientInsightsReportData(
          clientId,
          platform,
          effectiveComparison,
          refresh,
        )
          .then((report) => {
            if (requestId !== sourceRequestRef.current) return;
            setSocialData((current) => ({
              ...(current || report),
              ...report,
              includedPlatforms: [
                ...new Set([
                  ...(current?.includedPlatforms || []),
                  ...(report.includedPlatforms || []),
                ]),
              ],
              platforms: {
                ...(current?.platforms || {}),
                ...(report.platforms || {}),
              },
            }));
          })
          .catch((error) => {
            if (requestId !== sourceRequestRef.current) return;
            setSourceErrors((current) => ({
              ...current,
              [platform]:
                error?.response?.data?.message ||
                error?.message ||
                `${platform} source failed`,
            }));
          }),
    );

    await Promise.allSettled([clientRequest, paidRequest, ...socialRequests]);
    if (requestId === sourceRequestRef.current) {
      setLoading(false);
      setSourceLoading(false);
    }
  }, [clientId, month, appliedComparison, comparisonMode, selectedMonths]);

  const loadMonthlyComparison = useCallback(async () => {
    if (
      comparisonMode !== "months" ||
      !clientId ||
      !selectedMonths.length
    ) {
      setMonthlyLoading(false);
      return;
    }
    const requestId = ++monthlyRequestRef.current;
    setMonthlyLoading(true);
    setSourceErrors((current) => {
      const next = { ...current };
      delete next.paidMonthly;
      return next;
    });
    try {
      const result = await getPaidAdsMonthlyComparison(clientId, selectedMonths);
      if (requestId !== monthlyRequestRef.current) return;
      setPaidMonthlyData(result);
    } catch (error) {
      if (requestId !== monthlyRequestRef.current) return;
      setPaidMonthlyData(null);
      setSourceErrors((current) => ({
        ...current,
        paidMonthly:
          error?.response?.data?.message ||
          error?.message ||
          "Paid Ads monthly comparison failed",
      }));
    } finally {
      if (requestId === monthlyRequestRef.current) setMonthlyLoading(false);
    }
  }, [clientId, comparisonMode, selectedMonths]);

  const paidRangeEnabled = settings.sections.paidMonthlyComparison &&
    settings.paidMonthlyGraphMode === "range" && comparisonMode !== "months";
  const loadPaidRangeComparison = useCallback(async () => {
    const requestId = ++paidRangeRequestRef.current;
    if (!paidRangeEnabled || !clientId) {
      setPaidRangeMonthlyData(null);
      setPaidRangeMonthlyError("");
      setPaidRangeMonthlyLoading(false);
      return;
    }
    setPaidRangeMonthlyData(null);
    setPaidRangeMonthlyError("");
    setPaidRangeMonthlyLoading(true);
    const range = appliedComparison || defaultComparisonRanges(month);
    try {
      const result = await getPaidAdsRangeMonthlyComparison(clientId, {
        since: range.currentSince,
        until: range.currentUntil,
        compareSince: range.compareSince,
        compareUntil: range.compareUntil,
      });
      if (requestId === paidRangeRequestRef.current) setPaidRangeMonthlyData(result);
    } catch (error) {
      if (requestId !== paidRangeRequestRef.current) return;
      setPaidRangeMonthlyError(
        error?.response?.data?.message || error?.message || "Paid range comparison failed",
      );
    } finally {
      if (requestId === paidRangeRequestRef.current) setPaidRangeMonthlyLoading(false);
    }
  }, [clientId, month, appliedComparison, paidRangeEnabled]);

  useEffect(() => {
    loadSources();
  }, [loadSources]);

  useEffect(() => {
    loadMonthlyComparison();
  }, [loadMonthlyComparison]);

  useEffect(() => {
    loadPaidRangeComparison();
  }, [loadPaidRangeComparison]);

  useEffect(() => {
    setPreviewEdits({ text: {}, columnWidths: {} });
  }, [clientId, month]);

  const updatePreviewText = useCallback((key, value) => {
    setPreviewEdits((current) => ({
      ...current,
      text: { ...current.text, [key]: value },
    }));
  }, []);

  const updatePreviewColumnWidths = useCallback((key, widths) => {
    setPreviewEdits((current) => ({
      ...current,
      columnWidths: { ...current.columnWidths, [key]: widths },
    }));
  }, []);

  const refreshAllSources = useCallback(
    () =>
      comparisonMode === "months"
        ? Promise.all([loadSources(true), loadMonthlyComparison()])
        : Promise.all([loadSources(true), loadPaidRangeComparison()]),
    [comparisonMode, loadSources, loadMonthlyComparison, loadPaidRangeComparison],
  );

  const organicHighlightsInput = buildOrganicHighlightsInput({
    client,
    socialData,
    comparisonMode,
    month,
    instruction: settings.organicHighlightsInstruction,
  });
  const organicHighlightsKey = JSON.stringify({ clientId, organicHighlightsInput });
  const organicHighlightsReady = organicHighlights?.key === organicHighlightsKey;
  const organicHighlightsAvailable = !sourceLoading && !loading &&
    Boolean(clientId && client && organicHighlightsInput.platforms.length);

  const generateOrganicHighlights = async () => {
    if (!organicHighlightsAvailable || organicHighlightsLoading) return;
    setOrganicHighlightsLoading(true);
    setOrganicHighlightsError("");
    try {
      const result = await generateOrganicReportHighlights(organicHighlightsInput);
      if (!Array.isArray(result?.points) || !result.points.length) {
        throw new Error("AI returned no report highlights.");
      }
      setOrganicHighlights({
        key: organicHighlightsKey,
        points: result.points,
        generatedByAi: result.generatedByAi !== false,
      });
    } catch (error) {
      setOrganicHighlightsError(
        error?.response?.data?.message || error?.message || "Unable to generate organic highlights.",
      );
    } finally {
      setOrganicHighlightsLoading(false);
    }
  };

  const download = async (format = "pdf") => {
    if (settings.sections.organicHighlights && !organicHighlightsReady) {
      setPageError("Generate the organic performance highlights, or turn off that slide, before downloading.");
      return;
    }
    setDownloading(true);
    setPageError("");
    try {
      const filename = reportFilename(client?.name, month, format);
      if (format === "pptx")
        await downloadReportPptx(previewRef.current, filename);
      else await downloadReportPdf(previewRef.current, filename);
    } catch (error) {
      setPageError(error.message || "Unable to create the PDF.");
    } finally {
      setDownloading(false);
    }
  };

  const navigateToSlide = (pageKey) => {
    const container = previewRef.current;
    const slide = container?.querySelector(
      `[data-report-page-key="${pageKey}"]`,
    );
    if (!container || !slide) return;
    const top =
      container.scrollTop +
      slide.getBoundingClientRect().top -
      container.getBoundingClientRect().top;
    container.scrollTo({ top, behavior: "smooth" });
  };

  const startResize = (event) => {
    resizeRef.current = { startX: event.clientX, startWidth: editorWidth };
    event.currentTarget.setPointerCapture(event.pointerId);
    setResizing(true);
  };

  const resize = (event) => {
    if (!resizeRef.current) return;
    const maxWidth = Math.min(720, Math.max(340, window.innerWidth * 0.55));
    setEditorWidth(
      Math.min(
        maxWidth,
        Math.max(
          260,
          resizeRef.current.startWidth +
            event.clientX -
            resizeRef.current.startX,
        ),
      ),
    );
  };

  const stopResize = (event) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
    resizeRef.current = null;
    setResizing(false);
  };

  const pageKeys = [
    "cover",
    ...(settings.sections.executive ? ["executive"] : []),
    ...(settings.sections.paidTrend ? ["paidTrend"] : []),
    ...(settings.sections.instagramTable ? ["instagramTable"] : []),
    ...(settings.sections.instagramGraph ? ["instagramGraph"] : []),
    ...(settings.sections.tiktokTable ? ["tiktokTable"] : []),
    ...(settings.sections.tiktokGraph ? ["tiktokGraph"] : []),
    ...(settings.sections.organicHighlights ? ["organicHighlights"] : []),
    ...(settings.sections.paidOverview ? ["paidOverview"] : []),
    ...(settings.sections.paidDailyTrend ? ["paidDailyTrend"] : []),
    ...(settings.sections.paidMonthlyComparison
      ? ["paidMonthlyComparison"]
      : []),
    ...(settings.sections.paidCampaignTable
      ? Array.from(
          {
            length: buildCampaignObjectivePages(
              paidData?.campaigns || [],
              settings,
            ).length,
          },
          (_, index) =>
            index ? `paidCampaignTable-${index}` : "paidCampaignTable",
        )
      : []),
    ...(settings.sections.paidConversionFunnel ? ["paidConversionFunnel"] : []),
  ];
  const pageCount = pageKeys.length;
  const slideNumbers = Object.fromEntries(
    pageKeys.map((key, index) => [key, index + 1]),
  );
  return (
    <main
      className={`min-h-full bg-[#f8f9fa] ${resizing ? "cursor-col-resize select-none" : ""}`}
    >
      <div className="mx-auto max-w-[1900px]">
        <div className="mb-6 grid min-w-0 gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          <div className="min-w-0">
            <h1 className="text-3xl tracking-tight text-[#191c1d] min-[420px]:text-4xl xl:text-[40px] 2xl:text-5xl">
              <span className="font-extrabold">Report </span>
              <span className="font-medium">Builder</span>
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-[#424751] sm:text-lg">
              Build editable PDF reports from Social Insights and Paid Ads data.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-slate-500">
            <span
              className={`mr-2 inline-block h-2 w-2 rounded-full ${sourceLoading ? "animate-pulse bg-amber-400" : "bg-emerald-500"}`}
            />
            {sourceLoading
              ? "Live preview · updating data sources"
              : "Live preview ready"}
          </div>
        </div>
        {pageError && (
          <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-bold text-red-600">
            {pageError}
          </div>
        )}
        <div
          className="grid gap-y-6 xl:grid-cols-[var(--report-editor-width)_14px_minmax(0,1fr)] xl:gap-y-0"
          style={{ "--report-editor-width": `${editorWidth}px` }}
        >
          <ReportControls
            paidData={paidData}
            clients={clients}
            clientId={clientId}
            month={month}
            settings={settings}
            loading={loading}
            onClientChange={setClientId}
            onMonthChange={(nextMonth) => {
              setMonth(nextMonth);
              setComparisonDraft(defaultComparisonRanges(nextMonth));
              setAppliedComparison(null);
              setComparisonMode("previous");
              setSelectedMonths(defaultComparisonMonths(nextMonth));
            }}
            onSettingsChange={setSettings}
            onRefresh={refreshAllSources}
            onDownload={download}
            downloading={downloading}
            onNavigateSlide={navigateToSlide}
            slideNumbers={slideNumbers}
            comparisonDraft={comparisonDraft}
            comparisonMode={comparisonMode}
            onComparisonDraftChange={setComparisonDraft}
            onApplyComparison={() => {
              setAppliedComparison({ ...comparisonDraft });
              setComparisonMode("custom");
            }}
            onUsePreviousPeriod={() => {
              setAppliedComparison(null);
              setComparisonMode("previous");
            }}
            comparisonLoading={loading}
            selectedMonths={selectedMonths}
            onMonthsChange={(months) => {
              setSelectedMonths(months);
              setComparisonMode("months");
            }}
            monthlyLoading={monthlyLoading}
            onGenerateOrganicHighlights={generateOrganicHighlights}
            organicHighlightsAvailable={organicHighlightsAvailable}
            organicHighlightsLoading={organicHighlightsLoading}
            organicHighlightsReady={organicHighlightsReady}
            organicHighlightsGeneratedByAi={organicHighlights?.generatedByAi !== false}
            organicHighlightsError={organicHighlightsError}
          />
          <div
            role="separator"
            aria-label="Resize editor and slide preview"
            aria-orientation="vertical"
            tabIndex="0"
            onPointerDown={startResize}
            onPointerMove={resize}
            onPointerUp={stopResize}
            onPointerCancel={stopResize}
            onDoubleClick={() => setEditorWidth(340)}
            onKeyDown={(event) => {
              if (event.key === "ArrowLeft")
                setEditorWidth((width) => Math.max(260, width - 20));
              if (event.key === "ArrowRight")
                setEditorWidth((width) => Math.min(720, width + 20));
            }}
            className={`group relative hidden cursor-col-resize touch-none items-center justify-center outline-none xl:flex ${resizing ? "bg-[#003870]/5" : ""}`}
            title="Drag to resize · Double-click to reset"
          >
            <span
              className={`h-24 w-1 rounded-full transition ${resizing ? "bg-[#003870]" : "bg-slate-300 group-hover:bg-[#003870] group-focus:bg-[#003870]"}`}
            />
            <span className="absolute flex h-8 w-4 items-center justify-center rounded-full border border-slate-200 bg-white text-[8px] font-black text-slate-400 shadow-sm group-hover:text-[#003870]">
              ⋮
            </span>
          </div>
          <section className="min-w-0 rounded-3xl border border-slate-200 bg-slate-200/60 p-3 shadow-inner sm:p-6 xl:flex xl:max-h-[calc(100vh-2rem)] xl:flex-col xl:overflow-hidden">
            <div className="mb-4 flex shrink-0 items-center justify-between">
              <div>
                <h2 className="text-sm font-extrabold text-slate-800">
                  16:9 slide preview
                </h2>
                <p className="mt-1 text-[10px] font-semibold text-slate-500">
                  The exported PDF uses these exact landscape slides.
                </p>
              </div>
              <span className="rounded-full bg-white px-3 py-1.5 text-[10px] font-extrabold text-slate-500 shadow-sm">
                {pageCount} slides
              </span>
            </div>
            <div
              ref={previewRef}
              className="mx-auto w-full max-w-[1000px] xl:min-h-0 xl:flex-1 xl:overflow-y-auto xl:pr-2"
            >
              <ReportPreview
                client={client}
                month={month}
                settings={settings}
                paidData={paidData}
                paidMonthlyData={paidMonthlyData}
                paidRangeMonthlyData={paidRangeMonthlyData}
                paidRangeMonthlyLoading={paidRangeMonthlyLoading}
                paidRangeMonthlyError={paidRangeMonthlyError}
                socialData={socialData}
                organicHighlights={organicHighlightsReady ? organicHighlights.points : []}
                organicHighlightsPlatforms={organicHighlightsInput.platforms.map((entry) => entry.platform)}
                organicHighlightsLoading={organicHighlightsLoading}
                organicHighlightsError={organicHighlightsError}
                sourceErrors={sourceErrors}
                selectedMonths={selectedMonths}
                comparisonMode={comparisonMode}
                previewEdits={previewEdits}
                onPreviewTextChange={updatePreviewText}
                onPreviewColumnWidthsChange={updatePreviewColumnWidths}
              />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
