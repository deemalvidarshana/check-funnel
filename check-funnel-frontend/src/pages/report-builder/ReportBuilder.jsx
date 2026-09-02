import { useCallback, useEffect, useRef, useState } from "react";
import {
  getClientById,
  getClientInsightsReportData,
  getClients,
} from "../../api/client";
import { getPaidAdsInsights } from "../../api/paidAds";
import { getTiktokInsights } from "../../api/tiktok";
import ReportControls from "../../components/report-builder/ReportControls";
import ReportPreview from "../../components/report-builder/ReportPreview";
import { defaultReportSettings } from "../../components/report-builder/reportData";
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
  const [socialData, setSocialData] = useState(null);
  const [settings, setSettings] = useState(defaultReportSettings);
  const [sourceErrors, setSourceErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [pageError, setPageError] = useState("");
  const [editorWidth, setEditorWidth] = useState(340);
  const [resizing, setResizing] = useState(false);
  const [comparisonDraft, setComparisonDraft] = useState(() =>
    defaultComparisonRanges(currentMonth()),
  );
  const [appliedComparison, setAppliedComparison] = useState(null);
  const previewRef = useRef(null);
  const resizeRef = useRef(null);

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

  const loadSources = useCallback(async () => {
    if (!clientId) return;
    const effectiveComparison =
      appliedComparison || defaultComparisonRanges(month);
    setLoading(true);
    setPageError("");
    setSourceErrors({});
    const [clientResult, paidResult, socialResult, tiktokResult] =
      await Promise.allSettled([
        getClientById(clientId),
        getPaidAdsInsights(
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
        ),
        getClientInsightsReportData(clientId, undefined, effectiveComparison),
        getTiktokInsights(clientId),
      ]);
    if (clientResult.status === "fulfilled") setClient(clientResult.value);
    else
      setPageError(
        clientResult.reason?.response?.data?.message ||
          "Unable to load this client.",
      );
    if (paidResult.status === "fulfilled") setPaidData(paidResult.value);
    else setPaidData(null);
    if (socialResult.status === "fulfilled") {
      const report = socialResult.value;
      const dedicatedVideos =
        tiktokResult.status === "fulfilled"
          ? tiktokResult.value?.videos || []
          : [];
      setSocialData({
        ...report,
        platforms: {
          ...report.platforms,
          tiktok: {
            ...report.platforms?.tiktok,
            ...(dedicatedVideos.length ? { videos: dedicatedVideos } : {}),
          },
        },
      });
    } else setSocialData(null);
    setSourceErrors({
      ...(paidResult.status === "rejected"
        ? {
            paid:
              paidResult.reason?.response?.data?.message ||
              paidResult.reason?.message ||
              "Paid Ads source failed",
          }
        : {}),
      ...(socialResult.status === "rejected"
        ? {
            social:
              socialResult.reason?.response?.data?.message ||
              socialResult.reason?.message ||
              "Social source failed",
          }
        : {}),
    });
    setLoading(false);
  }, [clientId, month, appliedComparison]);

  useEffect(() => {
    setComparisonDraft(defaultComparisonRanges(month));
    setAppliedComparison(null);
  }, [month]);

  useEffect(() => {
    loadSources();
  }, [loadSources]);

  const download = async (format = "pdf") => {
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
    ...(settings.sections.paidOverview ? ["paidOverview"] : []),
    ...(settings.sections.paidDailyTrend ? ["paidDailyTrend"] : []),
    ...(settings.sections.paidCampaignTable
      ? Array.from(
          {
            length: Math.max(
              1,
              Math.ceil(
                (paidData?.campaigns || []).filter(
                  (campaign) => Number(campaign.spend || 0) > 0,
                ).length / 6,
              ),
            ),
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
              className={`mr-2 inline-block h-2 w-2 rounded-full ${loading ? "animate-pulse bg-amber-400" : "bg-emerald-500"}`}
            />
            {loading ? "Refreshing data sources" : "Live preview ready"}
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
            clients={clients}
            clientId={clientId}
            month={month}
            settings={settings}
            loading={loading}
            onClientChange={setClientId}
            onMonthChange={setMonth}
            onSettingsChange={setSettings}
            onRefresh={loadSources}
            onDownload={download}
            downloading={downloading}
            onNavigateSlide={navigateToSlide}
            slideNumbers={slideNumbers}
            comparisonDraft={comparisonDraft}
            comparisonCustom={Boolean(appliedComparison)}
            onComparisonDraftChange={setComparisonDraft}
            onApplyComparison={() =>
              setAppliedComparison({ ...comparisonDraft })
            }
            onUsePreviousPeriod={() => setAppliedComparison(null)}
            comparisonLoading={loading}
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
                socialData={socialData}
                sourceErrors={sourceErrors}
              />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
