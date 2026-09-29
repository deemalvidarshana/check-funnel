import { useEffect, useRef, useState } from "react";
import {
  compactNumber,
  facebookMetricOptions,
  formatMetric,
  getSocialChart,
  monthLabel,
  organicRangeLabel,
  totalSocialMetric,
  valueAtPath,
} from "./reportData";
import {
  InstagramComparisonSlide,
  InstagramTableSlide,
} from "./platform-slides/InstagramReportSlides";
import {
  TikTokComparisonSlide,
  TikTokTableSlide,
} from "./platform-slides/TikTokReportSlides";
import {
  PaidDailyTrendSlide,
  PaidMonthlyComparisonSlide,
  PaidOverviewSlide,
} from "./paid-slides/PaidAdsReportSlides";
import CampaignRankingReportSlide from "./paid-slides/CampaignRankingReportSlide";
import { buildCampaignObjectivePages } from "./paid-slides/campaignFields";
import PaidConversionFunnelSlide from "./paid-slides/PaidConversionFunnelSlide";
import {
  PlatformMultiMonthChart,
  PlatformRangeComparisonCharts,
} from "./platform-slides/PlatformSlideVisuals";
import EditableChartValue from "./EditableChartValue";
import OrganicHighlightsSlide from "./OrganicHighlightsSlide";

const SLIDE_WIDTH = 1000;
const SLIDE_HEIGHT = 562.5;

function SlideFrame({ children, pageKey }) {
  const frameRef = useRef(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return undefined;
    const update = () => setScale(Math.min(1, frame.clientWidth / SLIDE_WIDTH));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const frame = frameRef.current;
    const canvas = frame?.querySelector("[data-report-editable-canvas]");
    if (!canvas) return undefined;
    const selector = "h1,h2,h3,h4,h5,h6,p,span,td,th,li";
    const prepareEditableText = () => {
      canvas.querySelectorAll(selector).forEach((element) => {
        if (
          element.children.length ||
          !element.textContent?.trim() ||
          element.closest("[data-report-edit-disabled]") ||
          element.getAttribute("contenteditable") === "true"
        )
          return;
        element.contentEditable = "true";
        element.spellcheck = false;
        element.dataset.previewAutoEditable = "true";
        element.title = "Click to edit this report text";
        element.classList.add("preview-auto-editable");
      });
    };
    const rememberValue = (event) => {
      const element = event.target.closest?.("[data-preview-auto-editable]");
      if (element) element.dataset.previewOriginalValue = element.textContent;
    };
    const handleKeys = (event) => {
      const element = event.target.closest?.("[data-preview-auto-editable]");
      if (!element) return;
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        element.blur();
      }
      if (event.key === "Escape") {
        event.preventDefault();
        element.textContent = element.dataset.previewOriginalValue || "";
        element.blur();
      }
    };
    prepareEditableText();
    const observer = new MutationObserver(prepareEditableText);
    observer.observe(canvas, { childList: true, subtree: true });
    canvas.addEventListener("focusin", rememberValue);
    canvas.addEventListener("keydown", handleKeys);
    return () => {
      observer.disconnect();
      canvas.removeEventListener("focusin", rememberValue);
      canvas.removeEventListener("keydown", handleKeys);
    };
  }, []);

  return (
    <div
      ref={frameRef}
      data-report-frame
      data-report-page-key={pageKey}
      className="relative aspect-video w-full overflow-hidden scroll-mt-2"
    >
      <div
        data-report-editable-canvas
        className="absolute left-0 top-0 origin-top-left"
        style={{
          width: SLIDE_WIDTH,
          height: SLIDE_HEIGHT,
          transform: `scale(${scale})`,
        }}
      >
        {children}
      </div>
    </div>
  );
}

function LineChart({
  rows,
  metrics,
  valueFor = (row, key) => row[key],
  empty = "No chart data available",
}) {
  if (!rows?.length || !metrics?.length)
    return (
      <div className="flex h-52 items-center justify-center rounded-2xl bg-slate-50 text-xs font-bold text-slate-400">
        {empty}
      </div>
    );
  const values = rows.flatMap((row) =>
    metrics.map((metric) => Number(valueFor(row, metric.key) || 0)),
  );
  const max = Math.max(1, ...values);
  const plot = { left: 58, top: 18, width: 642, height: 190 };
  const point = (row, index, metric) =>
    `${plot.left + index * (plot.width / Math.max(rows.length - 1, 1))},${plot.top + plot.height - (Number(valueFor(row, metric.key) || 0) / max) * plot.height}`;
  const labelStep = Math.max(1, Math.ceil(rows.length / 6));
  return (
    <div>
      <svg
        viewBox="0 0 740 250"
        className="w-full"
        role="img"
        aria-label="Report performance graph"
      >
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
          <g key={ratio}>
            <line
              x1={plot.left}
              x2={plot.left + plot.width}
              y1={plot.top + plot.height * (1 - ratio)}
              y2={plot.top + plot.height * (1 - ratio)}
              stroke="#e2e8f0"
              strokeDasharray="3 4"
            />
            <text
              x="50"
              y={plot.top + plot.height * (1 - ratio) + 4}
              textAnchor="end"
              fontSize="9"
              fill="#64748b"
            >
              {compactNumber(max * ratio)}
            </text>
          </g>
        ))}
        {metrics.map((metric) => (
          <polyline
            key={metric.key}
            points={rows
              .map((row, index) => point(row, index, metric))
              .join(" ")}
            fill="none"
            stroke={metric.color}
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
        ))}
        {rows.map((row, index) =>
          index === 0 ||
          index === rows.length - 1 ||
          index % labelStep === 0 ? (
            <text
              key={row.date || row.week || index}
              x={
                plot.left + index * (plot.width / Math.max(rows.length - 1, 1))
              }
              y="232"
              textAnchor="middle"
              fontSize="9"
              fill="#64748b"
            >
              {row.date
                ? new Date(`${row.date}T00:00:00`).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                  })
                : String(row.week || index + 1).slice(0, 12)}
            </text>
          ) : null,
        )}
      </svg>
      <div className="flex flex-wrap justify-center gap-4">
        {metrics.map((metric) => (
          <span
            key={metric.key}
            className="flex items-center gap-1.5 text-[9px] font-bold text-slate-500"
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: metric.color }}
            />
            {metric.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function FacebookComparisonChart({
  socialData,
  settings,
  monthWise = false,
  rangeComparison = false,
}) {
  const [valueEdits, setValueEdits] = useState({});
  if (rangeComparison) {
    return (
      <PlatformRangeComparisonCharts
        data={socialData?.platforms?.facebook}
        options={facebookMetricOptions}
        selected={settings.facebookGraphMetrics || []}
        color={settings.accent || "#003870"}
      />
    );
  }
  const monthly = socialData?.platforms?.facebook?.comparisonRows?.length
    ? socialData.platforms.facebook.comparisonRows
    : socialData?.platforms?.facebook?.monthly || [];
  if (monthWise) {
    return (
      <PlatformMultiMonthChart
        platform="Facebook"
        rows={monthly}
        options={facebookMetricOptions}
        selected={settings.facebookGraphMetrics || []}
      />
    );
  }
  const current = monthly.at(-1);
  const previous = monthly.at(-2);
  const rows = facebookMetricOptions
    .filter((metric) =>
      (settings.facebookGraphMetrics || []).includes(metric.key),
    )
    .map((metric) => ({
      ...metric,
      color: settings.accent || "#003870",
      current:
        valueEdits[`${metric.key}:current`] ??
        facebookMetricValue(current, metric.key),
      previous:
        valueEdits[`${metric.key}:previous`] ??
        facebookMetricValue(previous, metric.key),
    }));
  if (!current || !rows.length)
    return (
      <div className="flex h-72 items-center justify-center rounded-2xl bg-slate-50 text-sm font-bold text-slate-400">
        Select at least one Facebook metric from the editor.
      </div>
    );
  return (
    <div className="mt-3">
      <div
        className="grid h-[310px] items-end gap-3 border-b border-slate-300 px-5"
        style={{ gridTemplateColumns: `repeat(${rows.length},minmax(0,1fr))` }}
      >
        {rows.map((metric) => {
          const max = Math.max(metric.current, metric.previous, 1);
          return (
            <div
              key={metric.key}
              className="flex h-full min-w-0 flex-col justify-end"
            >
              <div className="flex h-[250px] items-end justify-center gap-2">
                <div className="flex h-full w-8 flex-col justify-end">
                  <EditableChartValue
                    value={metric.current}
                    format={compactNumber}
                    onChange={(value) =>
                      setValueEdits((edits) => ({
                        ...edits,
                        [`${metric.key}:current`]: value,
                      }))
                    }
                    className="mb-2 whitespace-nowrap text-center text-[8px] font-extrabold text-slate-700"
                  />
                  <div
                    className="min-h-[3px] rounded-t-lg"
                    style={{
                      height: `${Math.max(2, (metric.current / max) * 88)}%`,
                      backgroundColor: metric.color,
                    }}
                  />
                </div>
                <div className="flex h-full w-8 flex-col justify-end">
                  <EditableChartValue
                    value={metric.previous}
                    format={compactNumber}
                    onChange={(value) =>
                      setValueEdits((edits) => ({
                        ...edits,
                        [`${metric.key}:previous`]: value,
                      }))
                    }
                    className="mb-2 whitespace-nowrap text-center text-[8px] font-extrabold text-slate-400"
                  />
                  <div
                    className="min-h-[3px] rounded-t-lg bg-slate-300"
                    style={{
                      height: `${Math.max(2, (metric.previous / max) * 88)}%`,
                    }}
                  />
                </div>
              </div>
              <p className="mt-3 min-h-6 text-center text-[8px] font-extrabold uppercase leading-3 tracking-wide text-slate-600">
                {metric.label}
              </p>
            </div>
          );
        })}
      </div>
      <div className="mt-5 flex items-center justify-center gap-7 text-[10px] font-bold text-slate-500">
        <span className="flex items-center gap-2">
          <span
            className="h-2.5 w-2.5 rounded-sm"
            style={{ backgroundColor: settings.accent || "#003870" }}
          />
          {rangeComparison ? "Selected range" : current.week || "Current month"}
        </span>
        <span className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-sm bg-slate-300" />
          {rangeComparison
            ? "Compare with"
            : previous?.week || "Previous month"}
        </span>
      </div>
    </div>
  );
}

function Page({
  children,
  accent,
  clientName,
  generatedAt,
  page,
  total,
  cover = false,
}) {
  return (
    <article
      data-report-page
      className="relative h-[562.5px] w-[1000px] overflow-hidden bg-white text-slate-800 shadow-xl print:shadow-none"
    >
      <div className="h-2" style={{ backgroundColor: accent }} />
      <div className={cover ? "h-[554.5px]" : "p-[5%]"}>{children}</div>
      <footer
        className={`absolute bottom-0 left-0 right-0 z-10 flex items-center justify-between px-[5%] py-3 text-[8px] font-semibold ${
          cover
            ? "border-t border-white/20 text-white/60"
            : "border-t border-slate-200 text-slate-400"
        }`}
      >
        <span>
          {clientName} · Generated{" "}
          {new Date(generatedAt).toLocaleDateString("en-GB")}
        </span>
        <span>
          Slide {page} of {total}
        </span>
      </footer>
    </article>
  );
}

function SectionTitle({ title, subtitle, accent }) {
  return (
    <div className="mb-5">
      <div
        className="mb-2 h-1 w-12 rounded-full"
        style={{ backgroundColor: accent }}
      />
      <h2 className="text-3xl font-black tracking-tight text-slate-900">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-1 text-sm font-semibold text-slate-500">{subtitle}</p>
      )}
    </div>
  );
}

function facebookMetricValue(row, key) {
  if (key === "total_views")
    return Number(row?.views?.organic || 0) + Number(row?.views?.ads || 0);
  return Number(valueAtPath(row, key) || 0);
}

function FacebookOrganicSlide({
  socialData,
  settings,
  sourceError,
}) {
  const facebook = socialData?.platforms?.facebook;
  const tableMode = settings.facebookTableMode || "weekly";
  const rangeRows = facebook?.comparisonRows || [];
  const rows =
    tableMode === "range"
      ? [
          rangeRows.at(-1)
            ? { ...rangeRows.at(-1), __reportRowLabel: organicRangeLabel(rangeRows.at(-1)) }
            : null,
          rangeRows.at(-2)
            ? { ...rangeRows.at(-2), __reportRowLabel: organicRangeLabel(rangeRows.at(-2)) }
            : null,
        ].filter(Boolean)
      : tableMode === "monthly"
        ? [...(facebook?.monthly || [])].reverse().slice(0, 6)
        : [...(facebook?.weekly || [])].reverse().slice(0, 6);
  const rowPadding = "py-3";
  const modeLabel =
    tableMode === "range"
      ? "selected and comparison range totals"
      : tableMode === "monthly"
        ? "last monthly performance"
        : "last weekly performance";
  const metrics = facebookMetricOptions.filter((metric) =>
    (settings.facebookTableMetrics || []).includes(metric.key),
  );
  if (!facebook?.available)
    return (
      <>
        <SectionTitle
          title="Facebook Organic Performance"
          subtitle={
            modeLabel
          }
          accent="#1877f2"
        />
        <div className="rounded-2xl bg-amber-50 p-6 text-sm font-bold text-amber-700">
          Facebook insights unavailable:{" "}
          {facebook?.reason || sourceError || "No configured Facebook source"}
        </div>
      </>
    );
  return (
    <>
      <SectionTitle
        title="Facebook Organic Performance"
        subtitle={`${socialData?.client?.name || "Selected client"} · ${modeLabel}`}
        accent="#1877f2"
      />
      {metrics.length ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200">
          <div
            className="grid bg-[#f3f4f5] text-[8px] font-extrabold uppercase tracking-wide text-slate-500"
            style={{
              gridTemplateColumns: `150px repeat(${metrics.length},minmax(0,1fr))`,
            }}
          >
            <span className="px-3 py-3">
              {tableMode === "range"
                ? "Range"
                : tableMode === "monthly"
                  ? "Month"
                  : "Week period"}
            </span>
            {metrics.map((metric) => (
              <span
                key={metric.key}
                className="flex items-center justify-center border-l border-slate-200 px-1 py-3 text-center leading-3"
              >
                {metric.label}
              </span>
            ))}
          </div>
          {rows.map((row, index) => (
            <div
              key={`${row.week}-${index}`}
              className={`grid border-t border-slate-100 text-[9px] font-bold ${index === 0 ? "border-l-4 border-l-[#1877f2] bg-blue-50/60" : "bg-white"}`}
              style={{
                gridTemplateColumns: `${index === 0 ? 146 : 150}px repeat(${metrics.length},minmax(0,1fr))`,
              }}
            >
              <span className={`px-3 ${rowPadding} text-slate-800`}>
                {row.__reportRowLabel || row.week}
                {index === 0 && tableMode !== "range"
                  ? ` (${tableMode === "monthly" ? "Latest" : "Current"})`
                  : ""}
              </span>
              {metrics.map((metric) => (
                <span
                  key={metric.key}
                  className={`border-l border-slate-100 px-1 ${rowPadding} text-center text-slate-700`}
                >
                  {facebookMetricValue(row, metric.key).toLocaleString()}
                </span>
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl bg-slate-50 p-8 text-center text-sm font-bold text-slate-400">
          Select at least one Facebook metric from the editor.
        </div>
      )}
    </>
  );
}

export default function ReportPreview({
  client,
  month,
  settings,
  paidData,
  paidMonthlyData,
  paidRangeMonthlyData,
  paidRangeMonthlyLoading = false,
  paidRangeMonthlyError = "",
  organicHighlights = [],
  organicHighlightsPlatforms = [],
  organicHighlightsLoading = false,
  organicHighlightsError = "",
  socialData,
  sourceErrors = {},
  selectedMonths = [],
  comparisonMode = "previous",
  previewEdits = { text: {}, columnWidths: {} },
  onPreviewTextChange = () => {},
  onPreviewColumnWidthsChange = () => {},
}) {
  const socialChart = getSocialChart(socialData);
  const pages = [{ key: "cover" }];
  if (settings.sections.executive) pages.push({ key: "executive" });
  if (settings.sections.paidTrend) pages.push({ key: "paidTrend" });
  if (settings.sections.instagramTable) pages.push({ key: "instagramTable" });
  if (settings.sections.instagramGraph) pages.push({ key: "instagramGraph" });
  if (settings.sections.tiktokTable) pages.push({ key: "tiktokTable" });
  if (settings.sections.tiktokGraph) pages.push({ key: "tiktokGraph" });
  if (settings.sections.organicHighlights) pages.push({ key: "organicHighlights" });
  if (settings.sections.paidOverview) pages.push({ key: "paidOverview" });
  if (settings.sections.paidDailyTrend) pages.push({ key: "paidDailyTrend" });
  if (settings.sections.paidMonthlyComparison)
    pages.push({ key: "paidMonthlyComparison" });
  if (settings.sections.paidCampaignTable) {
    const campaignPages = buildCampaignObjectivePages(
      paidData?.campaigns || [],
      settings,
    );
    campaignPages.forEach((campaignPage, pageIndex) => {
      pages.push({
        key: pageIndex ? `paidCampaignTable-${pageIndex}` : "paidCampaignTable",
        type: "paidCampaignTable",
        ...campaignPage,
      });
    });
  }
  if (settings.sections.paidConversionFunnel)
    pages.push({ key: "paidConversionFunnel" });
  const generatedAt = new Date().toISOString();
  const clientName = client?.name || "Selected client";
  return (
    <div data-report-preview className="space-y-6">
      {pages.map((page, index) => (
        <SlideFrame key={page.key} pageKey={page.key}>
          <Page
            accent={settings.accent}
            clientName={clientName}
            generatedAt={generatedAt}
            page={index + 1}
            total={pages.length}
            cover={page.key === "cover"}
          >
            {page.key === "cover" && (
              <div
                className="flex h-full flex-col justify-between px-20 pb-20 pt-16 text-white"
                style={{
                  background: `linear-gradient(135deg,${settings.accent},#014f99)`,
                }}
              >
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-[.25em] text-white/70">
                    Check Funnel · Unified Marketing Report
                  </p>
                  <h1 className="mt-14 max-w-[82%] text-6xl font-black leading-[1.02] tracking-tight">
                    {settings.title || "Marketing Performance Report"}
                  </h1>
                  <p className="mt-5 max-w-[70%] text-lg font-semibold leading-7 text-white/75">
                    {settings.subtitle}
                  </p>
                </div>
                <div className="flex items-end justify-between border-t border-white/20 pt-5">
                  <div>
                    <p className="text-[10px] font-bold uppercase text-white/60">
                      Prepared for
                    </p>
                    <p className="mt-1 text-2xl font-black">{clientName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold uppercase text-white/60">
                      Reporting period
                    </p>
                    <p className="mt-1 text-lg font-extrabold">
                      {monthLabel(month)}
                    </p>
                  </div>
                </div>
              </div>
            )}
            {page.key === "executive" && (
              <FacebookOrganicSlide
                socialData={socialData}
                settings={settings}
                sourceError={sourceErrors.facebook || sourceErrors.social}
              />
            )}
            {page.key === "paidTrend" && (
              <>
                <SectionTitle
                  title={
                    settings.facebookGraphMode === "range"
                      ? "Facebook performance comparison"
                      : comparisonMode === "months"
                      ? "Facebook performance by month"
                      : "Facebook performance month over month"
                  }
                  subtitle={
                    settings.facebookGraphMode === "range"
                      ? "Selected range vs Compare with"
                      : comparisonMode === "months"
                      ? "Selected organic metrics compared across the chosen months"
                      : "Selected organic metrics compared with the previous month"
                  }
                  accent={settings.accent}
                />
                <FacebookComparisonChart
                  socialData={socialData}
                  settings={settings}
                  monthWise={
                    settings.facebookGraphMode !== "range" &&
                    comparisonMode === "months"
                  }
                  rangeComparison={settings.facebookGraphMode === "range"}
                />
              </>
            )}
            {page.key === "instagramTable" && (
              <InstagramTableSlide
                socialData={socialData}
                settings={settings}
                sourceError={sourceErrors.instagram || sourceErrors.social}
              />
            )}
            {page.key === "instagramGraph" && (
              <InstagramComparisonSlide
                socialData={socialData}
                settings={settings}
                monthWise={
                  settings.instagramGraphMode !== "range" &&
                  comparisonMode === "months"
                }
                rangeComparison={settings.instagramGraphMode === "range"}
              />
            )}
            {page.key === "tiktokTable" && (
              <TikTokTableSlide
                socialData={socialData}
                settings={settings}
                sourceError={sourceErrors.tiktok || sourceErrors.social}
              />
            )}
            {page.key === "tiktokGraph" && (
              <TikTokComparisonSlide
                socialData={socialData}
                settings={settings}
                monthWise={
                  settings.tiktokGraphMode !== "range" &&
                  comparisonMode === "months"
                }
                rangeComparison={settings.tiktokGraphMode === "range"}
              />
            )}
            {page.key === "organicHighlights" && (
              <OrganicHighlightsSlide
                accent={settings.accent}
                points={organicHighlights}
                platforms={organicHighlightsPlatforms}
                loading={organicHighlightsLoading}
                error={organicHighlightsError}
              />
            )}
            {page.key === "paidOverview" && (
              <PaidOverviewSlide paidData={paidData} settings={settings} />
            )}
            {page.key === "paidDailyTrend" && (
              <PaidDailyTrendSlide paidData={paidData} settings={settings} />
            )}
            {page.key === "paidMonthlyComparison" && (
              <PaidMonthlyComparisonSlide
                monthlyData={paidMonthlyData}
                rangeMonthlyData={paidRangeMonthlyData}
                rangeMonthlyLoading={paidRangeMonthlyLoading}
                paidData={paidData}
                selectedMonths={selectedMonths}
                comparisonMode={comparisonMode}
                settings={settings}
                sourceError={
                  comparisonMode === "months"
                    ? sourceErrors.paidMonthly
                    : sourceErrors.paid || (settings.paidMonthlyGraphMode === "range" ? paidRangeMonthlyError : "")
                }
                currency={paidData?.account?.currency}
              />
            )}
            {page.type === "paidCampaignTable" && (
              <CampaignRankingReportSlide
                paidData={paidData}
                settings={settings}
                rows={page.rows}
                allRows={page.allRows}
                pageIndex={page.pageIndex}
                pageCount={page.pageCount}
                objective={page.objective}
                fieldKeys={page.fieldKeys}
                editKey={`${client?.id || clientName}:${paidData?.period?.since || month}:${paidData?.period?.until || month}:${page.objective || "campaigns"}:${page.pageIndex}`}
                textEdits={previewEdits.text}
                columnWidthEdits={previewEdits.columnWidths}
                onTextEdit={onPreviewTextChange}
                onColumnWidthsEdit={onPreviewColumnWidthsChange}
              />
            )}
            {page.key === "paidConversionFunnel" && (
              <PaidConversionFunnelSlide
                paidData={paidData}
                settings={settings}
              />
            )}
            {page.key === "campaigns" && (
              <>
                <SectionTitle
                  title="The campaigns driving paid performance"
                  subtitle="Ranked by spend with objective-specific results"
                  accent={settings.accent}
                />
                <div className="overflow-hidden border-y border-slate-200">
                  <div className="grid grid-cols-[1fr_120px_110px] bg-slate-100 px-5 py-3 text-[10px] font-extrabold uppercase text-slate-500">
                    <span>Campaign</span>
                    <span className="text-right">Spend</span>
                    <span className="text-right">Results</span>
                  </div>
                  {(paidData?.campaigns || [])
                    .slice()
                    .sort((a, b) => b.spend - a.spend)
                    .slice(0, 6)
                    .map((campaign, rowIndex) => (
                      <div
                        key={campaign.id || rowIndex}
                        className="grid grid-cols-[1fr_120px_110px] border-t border-slate-100 px-5 py-4 text-xs"
                      >
                        <span className="truncate font-bold">
                          {campaign.name}
                        </span>
                        <span className="text-right font-extrabold">
                          {formatMetric(
                            campaign.spend,
                            { money: true },
                            paidData.account?.currency,
                          )}
                        </span>
                        <span className="text-right font-extrabold">
                          {compactNumber(
                            campaign.results ?? campaign.conversions,
                          )}
                        </span>
                      </div>
                    ))}
                  {!paidData?.campaigns?.length && (
                    <p className="p-8 text-center text-sm font-bold text-slate-400">
                      No campaign rows available.
                    </p>
                  )}
                </div>
              </>
            )}
            {page.key === "social" && (
              <>
                <SectionTitle
                  title="Social media insights"
                  subtitle={
                    socialChart
                      ? `${socialChart.label} performance trend`
                      : "Social source unavailable"
                  }
                  accent={settings.accent}
                />
                {socialChart ? (
                  <>
                    <div className="grid grid-cols-3 gap-3">
                      {socialChart.metrics.slice(0, 3).map((metric) => (
                        <div
                          key={metric.key}
                          className="rounded-2xl border border-slate-200 p-4"
                        >
                          <p className="text-[8px] font-extrabold uppercase text-slate-400">
                            {metric.label}
                          </p>
                          <p
                            className="mt-2 text-xl font-black"
                            style={{ color: metric.color }}
                          >
                            {compactNumber(
                              totalSocialMetric(socialChart.rows, metric.key),
                            )}
                          </p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-5 rounded-2xl border border-slate-200 p-4">
                      <LineChart
                        rows={socialChart.rows}
                        metrics={socialChart.metrics}
                        valueFor={(row, key) => valueAtPath(row, key)}
                      />
                    </div>
                  </>
                ) : (
                  <div className="rounded-2xl bg-amber-50 p-5 text-xs font-bold text-amber-700">
                    Social insights unavailable:{" "}
                    {sourceErrors.social || "No configured platform source"}
                  </div>
                )}
              </>
            )}
          </Page>
        </SlideFrame>
      ))}
    </div>
  );
}
