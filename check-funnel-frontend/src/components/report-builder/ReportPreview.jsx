import { useEffect, useRef, useState } from "react";
import {
  compactNumber,
  facebookMetricOptions,
  formatMetric,
  getSocialChart,
  monthLabel,
  paidMetricOptions,
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
  PaidOverviewSlide,
} from "./paid-slides/PaidAdsReportSlides";
import CampaignRankingReportSlide from "./paid-slides/CampaignRankingReportSlide";
import PaidConversionFunnelSlide from "./paid-slides/PaidConversionFunnelSlide";

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

  return (
    <div
      ref={frameRef}
      data-report-frame
      data-report-page-key={pageKey}
      className="relative aspect-video w-full overflow-hidden scroll-mt-2"
    >
      <div
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

function FacebookComparisonChart({ socialData, settings }) {
  const monthly = socialData?.platforms?.facebook?.comparisonRows?.length
    ? socialData.platforms.facebook.comparisonRows
    : socialData?.platforms?.facebook?.monthly || [];
  const current = monthly.at(-1);
  const previous = monthly.at(-2);
  const rows = facebookMetricOptions
    .filter((metric) =>
      (settings.facebookGraphMetrics || []).includes(metric.key),
    )
    .map((metric) => ({
      ...metric,
      color: settings.accent || "#003870",
      current: facebookMetricValue(current, metric.key),
      previous: facebookMetricValue(previous, metric.key),
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
                  <span className="mb-2 whitespace-nowrap text-center text-[8px] font-extrabold text-slate-700">
                    {compactNumber(metric.current)}
                  </span>
                  <div
                    className="min-h-[3px] rounded-t-lg"
                    style={{
                      height: `${Math.max(2, (metric.current / max) * 88)}%`,
                      backgroundColor: metric.color,
                    }}
                  />
                </div>
                <div className="flex h-full w-8 flex-col justify-end">
                  <span className="mb-2 whitespace-nowrap text-center text-[8px] font-extrabold text-slate-400">
                    {compactNumber(metric.previous)}
                  </span>
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
          {current.week || "Current month"}
        </span>
        <span className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-sm bg-slate-300" />
          {previous?.week || "Previous month"}
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

function FacebookOrganicSlide({ socialData, settings, sourceError }) {
  const facebook = socialData?.platforms?.facebook;
  const rows = [...(facebook?.weekly || [])].reverse().slice(0, 6);
  const metrics = facebookMetricOptions.filter((metric) =>
    (settings.facebookTableMetrics || []).includes(metric.key),
  );
  if (!facebook?.available)
    return (
      <>
        <SectionTitle
          title="Facebook Organic Performance"
          subtitle="Weekly organic performance breakdown"
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
        subtitle={`${socialData?.client?.name || "Selected client"} · latest weekly breakdown`}
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
            <span className="px-3 py-3">Week period</span>
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
              <span className="px-3 py-3 text-slate-800">
                {row.week}
                {index === 0 ? " (Current)" : ""}
              </span>
              {metrics.map((metric) => (
                <span
                  key={metric.key}
                  className="border-l border-slate-100 px-1 py-3 text-center text-slate-700"
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
  socialData,
  sourceErrors = {},
}) {
  const paidMetrics = paidMetricOptions.filter((metric) =>
    settings.paidMetrics.includes(metric.key),
  );
  const socialChart = getSocialChart(socialData);
  const pages = [{ key: "cover" }];
  if (settings.sections.executive) pages.push({ key: "executive" });
  if (settings.sections.paidTrend) pages.push({ key: "paidTrend" });
  if (settings.sections.instagramTable) pages.push({ key: "instagramTable" });
  if (settings.sections.instagramGraph) pages.push({ key: "instagramGraph" });
  if (settings.sections.tiktokTable) pages.push({ key: "tiktokTable" });
  if (settings.sections.tiktokGraph) pages.push({ key: "tiktokGraph" });
  if (settings.sections.paidOverview) pages.push({ key: "paidOverview" });
  if (settings.sections.paidDailyTrend) pages.push({ key: "paidDailyTrend" });
  if (settings.sections.paidCampaignTable) {
    const campaignRows = (paidData?.campaigns || []).filter(
      (campaign) => Number(campaign.spend || 0) > 0,
    );
    const objectiveSpend = campaignRows.reduce((totals, campaign) => {
      const objective = String(campaign.objective || "Other");
      totals[objective] =
        (totals[objective] || 0) + Number(campaign.spend || 0);
      return totals;
    }, {});
    const allRows = campaignRows.slice().sort((a, b) => {
      const objectiveA = String(a.objective || "Other");
      const objectiveB = String(b.objective || "Other");
      return (
        objectiveSpend[objectiveB] - objectiveSpend[objectiveA] ||
        objectiveA.localeCompare(objectiveB) ||
        Number(b.spend || 0) - Number(a.spend || 0)
      );
    });
    const pageCount = Math.max(1, Math.ceil(allRows.length / 6));
    for (let pageIndex = 0; pageIndex < pageCount; pageIndex += 1) {
      pages.push({
        key: pageIndex ? `paidCampaignTable-${pageIndex}` : "paidCampaignTable",
        type: "paidCampaignTable",
        rows: allRows.slice(pageIndex * 6, pageIndex * 6 + 6),
        allRows,
        pageIndex,
        pageCount,
      });
    }
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
                sourceError={sourceErrors.social}
              />
            )}
            {page.key === "paidTrend" && (
              <>
                <SectionTitle
                  title="Facebook performance month over month"
                  subtitle="Selected organic metrics compared with the previous month"
                  accent={settings.accent}
                />
                <FacebookComparisonChart
                  socialData={socialData}
                  settings={settings}
                />
              </>
            )}
            {page.key === "instagramTable" && (
              <InstagramTableSlide
                socialData={socialData}
                settings={settings}
                sourceError={sourceErrors.social}
              />
            )}
            {page.key === "instagramGraph" && (
              <InstagramComparisonSlide
                socialData={socialData}
                settings={settings}
              />
            )}
            {page.key === "tiktokTable" && (
              <TikTokTableSlide
                socialData={socialData}
                settings={settings}
                sourceError={sourceErrors.social}
              />
            )}
            {page.key === "tiktokGraph" && (
              <TikTokComparisonSlide
                socialData={socialData}
                settings={settings}
              />
            )}
            {page.key === "paidOverview" && (
              <PaidOverviewSlide paidData={paidData} settings={settings} />
            )}
            {page.key === "paidDailyTrend" && (
              <PaidDailyTrendSlide paidData={paidData} settings={settings} />
            )}
            {page.type === "paidCampaignTable" && (
              <CampaignRankingReportSlide
                paidData={paidData}
                settings={settings}
                rows={page.rows}
                allRows={page.allRows}
                pageIndex={page.pageIndex}
                pageCount={page.pageCount}
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
