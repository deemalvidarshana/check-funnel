import { useMemo, useState } from "react";
import {
  formatGaMoney,
  formatGaNumber,
} from "../../utils/googleAnalyticsFormatters";
import GoogleAnalyticsComparisonModeDropdown from "./GoogleAnalyticsComparisonModeDropdown";

const ECOMMERCE_SERIES = [
  { key: "sessions", label: "Sessions", color: "#1a73e8", type: "number" },
  {
    key: "activeUsers",
    label: "Active users",
    color: "#7c4dff",
    type: "number",
  },
  {
    key: "productViews",
    label: "Product views",
    color: "#8c50f6",
    type: "number",
  },
  {
    key: "addToCarts",
    label: "Add to carts",
    color: "#ff6a1a",
    type: "number",
  },
  {
    key: "checkoutStarts",
    label: "Checkout starts",
    color: "#0288d1",
    type: "number",
  },
  { key: "purchases", label: "Purchases", color: "#16b979", type: "number" },
  {
    key: "purchaseRevenue",
    label: "Purchase revenue",
    color: "#0f9d58",
    type: "money",
  },
];

const LEAD_SERIES = [
  { key: "sessions", label: "Sessions", color: "#1a73e8", type: "number" },
  {
    key: "activeUsers",
    label: "Active users",
    color: "#7c4dff",
    type: "number",
  },
  {
    key: "formSubmits",
    label: "Form submits",
    color: "#d99000",
    type: "number",
  },
  { key: "leads", label: "Leads", color: "#f29900", type: "number" },
  {
    key: "qualifiedLeads",
    label: "Qualified",
    color: "#de8210",
    type: "number",
  },
  {
    key: "workingLeads",
    label: "Working leads",
    color: "#c96c00",
    type: "number",
  },
  {
    key: "convertedLeads",
    label: "Converted",
    color: "#a95800",
    type: "number",
  },
];

const INQUIRY_SERIES = [
  { key: "sessions", label: "Sessions", color: "#1a73e8", type: "number" },
  {
    key: "activeUsers",
    label: "Active users",
    color: "#7c4dff",
    type: "number",
  },
  {
    key: "screenPageViews",
    label: "Page views",
    color: "#0097a7",
    type: "number",
  },
  { key: "formStarts", label: "Form starts", color: "#0288d1", type: "number" },
  { key: "enquiries", label: "Enquiries", color: "#00acc1", type: "number" },
];

const VIEW_WIDTH = 1200;
const VIEW_HEIGHT = 340;
const PLOT_LEFT = 82;
const PLOT_RIGHT = 1172;
const PLOT_TOP = 30;
const PLOT_BOTTOM = 278;

function niceScaleMax(maxValue) {
  if (!Number.isFinite(maxValue) || maxValue <= 0) return 4;
  const roughStep = maxValue / 4;
  const magnitude = 10 ** Math.floor(Math.log10(roughStep));
  const normalized = roughStep / magnitude;
  const niceStep = [1, 1.25, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].find(
    (step) => step >= normalized,
  );
  return niceStep * magnitude * 4;
}

function buildPoints(rows, key, scaleMax) {
  return rows.map((row, index) => {
    const value = Number(row[key] || 0);
    return {
      x:
        rows.length <= 1
          ? (PLOT_LEFT + PLOT_RIGHT) / 2
          : PLOT_LEFT + (index / (rows.length - 1)) * (PLOT_RIGHT - PLOT_LEFT),
      y: PLOT_BOTTOM - (value / scaleMax) * (PLOT_BOTTOM - PLOT_TOP),
      value,
      row,
    };
  });
}

function formatValue(value, series, currency) {
  return series.type === "money"
    ? formatGaMoney(value, currency)
    : formatGaNumber(value);
}

function formatAxisValue(value, series, currency) {
  if (series.type === "money") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value);
  }
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function parseDate(date) {
  return date ? new Date(`${date}T00:00:00`) : null;
}

function formatDate(date, options = { month: "short", day: "numeric" }) {
  const parsed = parseDate(date);
  return parsed && !Number.isNaN(parsed.getTime())
    ? new Intl.DateTimeFormat("en-US", options).format(parsed)
    : date || "—";
}

function formatRange(period, rows) {
  const start = period?.startDate || rows[0]?.date;
  const end = period?.endDate || rows.at(-1)?.date;
  if (!start || !end) return "Selected period";
  return `${formatDate(start)} – ${formatDate(end, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })}`;
}

function linePoints(points) {
  return points.map((point) => `${point.x},${point.y}`).join(" ");
}

function tickIndexes(length) {
  if (length <= 1) return [0];
  return [
    ...new Set(
      [0, 0.25, 0.5, 0.75, 1].map((ratio) => Math.round((length - 1) * ratio)),
    ),
  ];
}

function RangeSelector({
  period,
  comparisonPeriod,
  rows,
  previousRows,
  loading,
  onApplyRange,
}) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("custom");
  const [draft, setDraft] = useState({
    since: period?.startDate || rows[0]?.date || "",
    until: period?.endDate || rows.at(-1)?.date || "",
    compareSince: comparisonPeriod?.startDate || previousRows[0]?.date || "",
    compareUntil: comparisonPeriod?.endDate || previousRows.at(-1)?.date || "",
  });
  const [error, setError] = useState("");
  const currentRange = formatRange(period, rows);
  const previousRange = formatRange(comparisonPeriod, previousRows);

  async function applyRange() {
    setError("");
    if (mode === "custom") {
      if (Object.values(draft).some((value) => !value)) {
        setError("Select all four dates.");
        return;
      }
      if (
        draft.since > draft.until ||
        draft.compareSince > draft.compareUntil
      ) {
        setError("Start dates must be before end dates.");
        return;
      }
    }
    try {
      await onApplyRange(mode === "custom" ? draft : {});
      setOpen(false);
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          "Unable to load this comparison.",
      );
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex h-10 max-w-full items-center justify-between gap-3 rounded-full bg-[#f3f6f9] px-4 text-[11px] font-extrabold text-[#59616c] transition hover:bg-[#e9edf2]"
        aria-expanded={open}
        aria-label="Customize comparison date ranges"
      >
        <span className="truncate">{`${currentRange} vs ${previousRange}`}</span>
        <svg
          viewBox="0 0 20 20"
          fill="none"
          className={`h-4 w-4 shrink-0 transition ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        >
          <path
            d="m6 8 4 4 4-4"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-[calc(100vw-2rem)] max-w-[430px] rounded-2xl border border-[#c2c6d3]/25 bg-white p-4 shadow-xl">
          <p className="text-sm font-extrabold text-[#273548]">
            Comparison date ranges
          </p>
          <p className="mt-1 text-[10px] font-semibold text-[#8a9099]">
            Compare any two GA4 reporting periods.
          </p>

          <div className="mt-3 grid grid-cols-2 rounded-xl bg-[#f3f5f7] p-1 text-xs font-bold">
            <button
              type="button"
              onClick={() => setMode("month")}
              className={`rounded-lg px-3 py-2 transition ${mode === "month" ? "bg-white text-[#003870] shadow-sm" : "text-[#727782] hover:text-[#003870]"}`}
            >
              Month vs previous
            </button>
            <button
              type="button"
              onClick={() => setMode("custom")}
              className={`rounded-lg px-3 py-2 transition ${mode === "custom" ? "bg-white text-[#003870] shadow-sm" : "text-[#727782] hover:text-[#003870]"}`}
            >
              Custom ranges
            </button>
          </div>

          {mode === "custom" && (
            <div className="mt-4 space-y-4">
              <div>
                <p className="mb-2 text-[10px] font-extrabold uppercase tracking-wider text-[#727782]">
                  Current range
                </p>
                <div className="grid grid-cols-1 gap-2 min-[380px]:grid-cols-2">
                  <input
                    type="date"
                    aria-label="Current range start date"
                    value={draft.since}
                    onChange={(event) =>
                      setDraft((value) => ({
                        ...value,
                        since: event.target.value,
                      }))
                    }
                    className="min-w-0 rounded-xl border border-[#dfe3e8] px-3 py-2 text-xs font-semibold text-[#273548] outline-none focus:border-[#1a73e8]"
                  />
                  <input
                    type="date"
                    aria-label="Current range end date"
                    value={draft.until}
                    onChange={(event) =>
                      setDraft((value) => ({
                        ...value,
                        until: event.target.value,
                      }))
                    }
                    className="min-w-0 rounded-xl border border-[#dfe3e8] px-3 py-2 text-xs font-semibold text-[#273548] outline-none focus:border-[#1a73e8]"
                  />
                </div>
              </div>
              <div>
                <p className="mb-2 text-[10px] font-extrabold uppercase tracking-wider text-[#727782]">
                  Comparison range
                </p>
                <div className="grid grid-cols-1 gap-2 min-[380px]:grid-cols-2">
                  <input
                    type="date"
                    aria-label="Comparison range start date"
                    value={draft.compareSince}
                    onChange={(event) =>
                      setDraft((value) => ({
                        ...value,
                        compareSince: event.target.value,
                      }))
                    }
                    className="min-w-0 rounded-xl border border-[#dfe3e8] px-3 py-2 text-xs font-semibold text-[#273548] outline-none focus:border-[#1a73e8]"
                  />
                  <input
                    type="date"
                    aria-label="Comparison range end date"
                    value={draft.compareUntil}
                    onChange={(event) =>
                      setDraft((value) => ({
                        ...value,
                        compareUntil: event.target.value,
                      }))
                    }
                    className="min-w-0 rounded-xl border border-[#dfe3e8] px-3 py-2 text-xs font-semibold text-[#273548] outline-none focus:border-[#1a73e8]"
                  />
                </div>
              </div>
            </div>
          )}

          {error && (
            <p className="mt-3 text-[11px] font-bold text-red-500">{error}</p>
          )}
          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-xl px-4 py-2 text-xs font-bold text-[#727782]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={applyRange}
              disabled={loading}
              className="rounded-xl bg-[#003870] px-5 py-2 text-xs font-bold text-white disabled:opacity-50"
            >
              {loading ? "Loading…" : "Apply"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function GoogleAnalyticsTrendChart({
  rows = [],
  previousRows = [],
  period,
  comparisonPeriod,
  currency = "USD",
  journeyType,
  loading = false,
  onApplyRange,
}) {
  const seriesOptions =
    journeyType === "lead-generation"
      ? LEAD_SERIES
      : journeyType === "enquiry-generation"
        ? INQUIRY_SERIES
        : ECOMMERCE_SERIES;
  const [selectedKey, setSelectedKey] = useState(() => seriesOptions[0].key);
  const [viewMode, setViewMode] = useState("comparison");
  const [hoverIndex, setHoverIndex] = useState(null);
  const selected =
    seriesOptions.find((series) => series.key === selectedKey) ||
    seriesOptions[0];
  const showComparison = viewMode === "comparison" && previousRows.length > 0;

  const chart = useMemo(() => {
    const visibleValues = rows.map((row) => Number(row[selectedKey] || 0));
    if (showComparison) {
      visibleValues.push(
        ...previousRows.map((row) => Number(row[selectedKey] || 0)),
      );
    }
    const scaleMax = niceScaleMax(Math.max(...visibleValues, 0));
    return {
      scaleMax,
      current: buildPoints(rows, selectedKey, scaleMax),
      previous: buildPoints(previousRows, selectedKey, scaleMax),
    };
  }, [previousRows, rows, selectedKey, showComparison]);

  const title =
    journeyType === "lead-generation"
      ? "Lead performance trend"
      : journeyType === "enquiry-generation"
        ? "Enquiry performance trend"
        : "Ecommerce performance trend";
  const description =
    journeyType === "lead-generation"
      ? "Daily lead-stage activity with an optional previous-period comparison."
      : journeyType === "enquiry-generation"
        ? "Daily traffic and enquiry activity compared on one consistent scale."
        : "Daily traffic, transaction and revenue activity with period comparison.";
  const currentRange = formatRange(period, rows);
  const previousRange = formatRange(comparisonPeriod, previousRows);
  const xTicks = tickIndexes(rows.length);
  const yTicks = [0, 1, 2, 3, 4].map(
    (index) => chart.scaleMax - (chart.scaleMax / 4) * index,
  );
  const currentLine = linePoints(chart.current);
  const previousLine = linePoints(chart.previous);
  const currentArea = chart.current.length
    ? `${PLOT_LEFT},${PLOT_BOTTOM} ${currentLine} ${PLOT_RIGHT},${PLOT_BOTTOM}`
    : "";
  const hoveredCurrent = hoverIndex === null ? null : chart.current[hoverIndex];
  const previousIndex =
    hoverIndex === null || rows.length <= 1
      ? hoverIndex
      : Math.round(
          (hoverIndex / (rows.length - 1)) * (previousRows.length - 1),
        );
  const hoveredPrevious =
    previousIndex === null ? null : chart.previous[previousIndex];
  const tooltipLeft = hoveredCurrent
    ? `${(hoveredCurrent.x / VIEW_WIDTH) * 100}%`
    : "0%";

  function handlePointerMove(event) {
    if (!rows.length) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const chartX = ((event.clientX - bounds.left) / bounds.width) * VIEW_WIDTH;
    const ratio = Math.max(
      0,
      Math.min(1, (chartX - PLOT_LEFT) / (PLOT_RIGHT - PLOT_LEFT)),
    );
    setHoverIndex(Math.round(ratio * (rows.length - 1)));
  }

  return (
    <section className="mt-6 rounded-3xl border border-[#c2c6d3]/30 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h2 className="text-lg font-extrabold text-[#191c1d]">{title}</h2>
          <p className="mt-1 text-xs font-semibold text-[#727782]">
            {description}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <GoogleAnalyticsComparisonModeDropdown
            value={viewMode}
            onChange={(value) => {
              setViewMode(value);
              setHoverIndex(null);
            }}
          />
          {viewMode === "comparison" ? (
            <RangeSelector
              key={`${period?.startDate}-${period?.endDate}-${comparisonPeriod?.startDate}-${comparisonPeriod?.endDate}`}
              period={period}
              comparisonPeriod={comparisonPeriod}
              rows={rows}
              previousRows={previousRows}
              loading={loading}
              onApplyRange={onApplyRange}
            />
          ) : (
            <div className="flex h-10 items-center rounded-full bg-[#f3f6f9] px-4 text-[11px] font-extrabold text-[#59616c]">
              {currentRange}
            </div>
          )}
        </div>
      </div>

      <div className="mt-5 flex max-w-full gap-2 overflow-x-auto pb-1">
        {seriesOptions.map((series) => (
          <button
            type="button"
            key={series.key}
            onClick={() => {
              setSelectedKey(series.key);
              setHoverIndex(null);
            }}
            className={`shrink-0 rounded-full px-4 py-2 text-[11px] font-extrabold transition ${selectedKey === series.key ? "bg-[#003870] text-white shadow-md" : "bg-[#f3f4f5] text-[#727782] hover:text-[#003870]"}`}
          >
            {series.label}
          </button>
        ))}
      </div>

      {rows.length === 0 ? (
        <div className="flex h-72 items-center justify-center text-sm font-bold text-[#8a9099]">
          No daily data was returned for this month.
        </div>
      ) : (
        <div className="mt-5 rounded-2xl border border-[#c2c6d3]/25 bg-[#fbfcfe] px-2 pb-3 pt-4 sm:px-4">
          <div className="mb-2 flex flex-wrap items-center gap-x-5 gap-y-2 px-2 text-[11px] font-bold text-[#626a75]">
            <span className="flex items-center gap-2">
              <span
                className="h-[3px] w-7 rounded-full"
                style={{ backgroundColor: selected.color }}
              />
              {currentRange}
            </span>
            {showComparison && (
              <span className="flex items-center gap-2">
                <span className="w-7 border-t-2 border-dashed border-[#9299a4]" />
                {previousRange}
              </span>
            )}
          </div>

          <div className="relative w-full">
            <svg
              viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
              className="h-[300px] w-full touch-none overflow-visible sm:h-[340px]"
              role="img"
              aria-label={`${selected.label} daily trend${showComparison ? " compared with the previous period" : ""}`}
              onMouseMove={handlePointerMove}
              onMouseLeave={() => setHoverIndex(null)}
            >
              <defs>
                <linearGradient
                  id={`gaTrendFill-${selected.key}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor={selected.color}
                    stopOpacity="0.2"
                  />
                  <stop
                    offset="100%"
                    stopColor={selected.color}
                    stopOpacity="0.01"
                  />
                </linearGradient>
              </defs>

              {yTicks.map((value, index) => {
                const y = PLOT_TOP + (index / 4) * (PLOT_BOTTOM - PLOT_TOP);
                return (
                  <g key={value}>
                    <line
                      x1={PLOT_LEFT}
                      x2={PLOT_RIGHT}
                      y1={y}
                      y2={y}
                      stroke="#dfe5ec"
                      strokeDasharray="5 7"
                    />
                    <text
                      x={PLOT_LEFT - 14}
                      y={y + 4}
                      textAnchor="end"
                      fill="#8b929d"
                      fontSize="12"
                      fontWeight="700"
                    >
                      {formatAxisValue(value, selected, currency)}
                    </text>
                  </g>
                );
              })}

              {showComparison && previousLine && (
                <polyline
                  points={previousLine}
                  fill="none"
                  stroke="#9299a4"
                  strokeWidth="3"
                  strokeDasharray="9 8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
              {currentArea && (
                <polygon
                  points={currentArea}
                  fill={`url(#gaTrendFill-${selected.key})`}
                />
              )}
              <polyline
                points={currentLine}
                fill="none"
                stroke={selected.color}
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {hoveredCurrent && (
                <g pointerEvents="none">
                  <line
                    x1={hoveredCurrent.x}
                    x2={hoveredCurrent.x}
                    y1={PLOT_TOP}
                    y2={PLOT_BOTTOM}
                    stroke="#aeb5bf"
                    strokeDasharray="4 5"
                  />
                  {showComparison && hoveredPrevious && (
                    <circle
                      cx={hoveredPrevious.x}
                      cy={hoveredPrevious.y}
                      r="5"
                      fill="white"
                      stroke="#9299a4"
                      strokeWidth="3"
                    />
                  )}
                  <circle
                    cx={hoveredCurrent.x}
                    cy={hoveredCurrent.y}
                    r="6"
                    fill="white"
                    stroke={selected.color}
                    strokeWidth="4"
                  />
                </g>
              )}

              {xTicks.map((index) => {
                const point = chart.current[index];
                return point ? (
                  <text
                    key={`${point.row.date}-${index}`}
                    x={point.x}
                    y="318"
                    textAnchor={
                      index === 0
                        ? "start"
                        : index === rows.length - 1
                          ? "end"
                          : "middle"
                    }
                    fill="#8b929d"
                    fontSize="12"
                    fontWeight="700"
                  >
                    {formatDate(point.row.date)}
                  </text>
                ) : null;
              })}
            </svg>

            {hoveredCurrent && (
              <div
                className="pointer-events-none absolute top-3 z-10 min-w-[190px] rounded-xl border border-[#dfe3ea] bg-white p-3 text-xs shadow-xl"
                style={{
                  left: tooltipLeft,
                  transform:
                    hoveredCurrent.x < 190
                      ? "translateX(0)"
                      : hoveredCurrent.x > 1010
                        ? "translateX(-100%)"
                        : "translateX(-50%)",
                }}
              >
                <p className="font-extrabold text-[#252a31]">
                  {selected.label}
                </p>
                <div className="mt-2 flex items-center justify-between gap-5">
                  <span className="text-[#737b86]">
                    {formatDate(hoveredCurrent.row.date)}
                  </span>
                  <span
                    className="font-extrabold"
                    style={{ color: selected.color }}
                  >
                    {formatValue(hoveredCurrent.value, selected, currency)}
                  </span>
                </div>
                {showComparison && hoveredPrevious && (
                  <div className="mt-1.5 flex items-center justify-between gap-5">
                    <span className="text-[#737b86]">
                      {formatDate(hoveredPrevious.row.date)}
                    </span>
                    <span className="font-extrabold text-[#6f7782]">
                      {formatValue(hoveredPrevious.value, selected, currency)}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
