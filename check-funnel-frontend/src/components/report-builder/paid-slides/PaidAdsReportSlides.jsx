import { useState } from "react";
import { compactNumber, formatMetric } from "../reportData";
import EditableChartValue from "../EditableChartValue";
import { paidAnalyticsMetricOptions } from "./campaignFields";
import { PlatformRangeComparisonCharts } from "../platform-slides/PlatformSlideVisuals";

function Title({ title, subtitle, accent }) {
  return (
    <div className="mb-5">
      <div
        className="mb-2 h-1 w-12 rounded-full"
        style={{ backgroundColor: accent }}
      />
      <h2 className="text-3xl font-black tracking-tight text-slate-900">
        {title}
      </h2>
      <p className="mt-1 text-sm font-semibold text-slate-500">{subtitle}</p>
    </div>
  );
}

function derivedValue(source, key, period) {
  const read = (metricKey) =>
    period
      ? Number(source?.[metricKey]?.[period] || 0)
      : Number(source?.[metricKey] || 0);
  const divide = (numerator, denominator, multiplier = 1) =>
    denominator ? (numerator / denominator) * multiplier : 0;
  if (key === "frequency") return divide(read("impressions"), read("reach"));
  if (key === "ctr") return divide(read("clicks"), read("impressions"), 100);
  if (key === "cpm") return divide(read("spend"), read("impressions"), 1000);
  if (key === "cpc") return divide(read("spend"), read("clicks"));
  if (key === "costPerResult")
    return divide(read("spend"), read("results") || read("conversions"));
  return period ? source?.[key]?.[period] : source?.[key];
}

export function PaidOverviewSlide({ paidData, settings }) {
  const metrics = (settings.paidOverviewMetrics || [])
    .map((key) =>
      paidAnalyticsMetricOptions.find((metric) => metric.key === key),
    )
    .filter(Boolean);
  return (
    <>
      <Title
        title="Paid Advertising Performance"
        subtitle={`${paidData?.account?.name || "Meta Ads"} · current period overview`}
        accent="#2563eb"
      />
      {paidData && metrics.length ? (
        <div className="grid grid-cols-6 gap-3">
          {metrics.slice(0, 6).map((metric, index) => {
            const total = {
              current: derivedValue(paidData.totals, metric.key, "current"),
              previous: derivedValue(paidData.totals, metric.key, "previous"),
            };
            const previous = Number(total.previous || 0);
            const change = previous
              ? ((Number(total.current || 0) - previous) / previous) * 100
              : Number.NaN;
            return (
              <div
                key={metric.key}
                className={`relative col-span-2 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4 ${metrics.length === 5 && index === 3 ? "col-start-2" : ""}`}
              >
                <span
                  className="absolute left-0 top-0 h-full w-1.5"
                  style={{ backgroundColor: metric.color }}
                />
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[9px] font-extrabold uppercase tracking-wide text-slate-400">
                      {metric.label}
                    </p>
                    <p
                      className="mt-2 text-2xl font-black"
                      style={{ color: metric.color }}
                    >
                      {formatMetric(
                        total.current,
                        metric,
                        paidData.account?.currency,
                      )}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-1 text-[9px] font-extrabold ${change >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-500"}`}
                  >
                    {Number.isFinite(change)
                      ? `${change >= 0 ? "↑" : "↓"} ${Math.abs(change).toFixed(1)}%`
                      : "—"}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-2.5 text-[9px] font-bold text-slate-400">
                  <span>Previous period</span>
                  <span>
                    {formatMetric(
                      total.previous,
                      metric,
                      paidData.account?.currency,
                    )}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex h-72 items-center justify-center rounded-2xl bg-slate-50 text-sm font-bold text-slate-400">
          Select at least one paid overview metric.
        </div>
      )}
    </>
  );
}

function MiniMetricChart({ rows, previousRows, metric, currency }) {
  const value = (row) => Number(derivedValue(row, metric.key) || 0);
  const max = Math.max(1, ...rows.map(value), ...previousRows.map(value));
  const plot = { left: 42, top: 12, width: 250, height: 92 };
  const pointsFor = (data) =>
    data
      .map(
        (row, index) =>
          `${plot.left + index * (plot.width / Math.max(data.length - 1, 1))},${plot.top + plot.height - (value(row) / max) * plot.height}`,
      )
      .join(" ");
  const date = (row) =>
    row?.date
      ? new Date(`${row.date}T00:00:00`).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
        })
      : "";
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-2 text-[9px] font-extrabold uppercase text-slate-600">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: metric.color }}
          />
          {metric.label}
        </p>
        <p className="text-[8px] font-bold text-slate-400">
          Peak {formatMetric(max, metric, currency)}
        </p>
      </div>
      <svg viewBox="0 0 305 125" className="mt-1 w-full">
        <line
          x1={plot.left}
          x2={plot.left + plot.width}
          y1={plot.top}
          y2={plot.top}
          stroke="#e2e8f0"
          strokeDasharray="3 4"
        />
        <line
          x1={plot.left}
          x2={plot.left + plot.width}
          y1={plot.top + plot.height}
          y2={plot.top + plot.height}
          stroke="#cbd5e1"
        />
        <text
          x="36"
          y={plot.top + 4}
          textAnchor="end"
          fontSize="7"
          fill="#64748b"
        >
          {formatMetric(max, metric, currency)}
        </text>
        <text
          x="36"
          y={plot.top + plot.height + 3}
          textAnchor="end"
          fontSize="7"
          fill="#64748b"
        >
          {formatMetric(0, metric, currency)}
        </text>
        {previousRows.length > 0 && (
          <polyline
            points={pointsFor(previousRows)}
            fill="none"
            stroke={metric.color}
            strokeWidth="2"
            strokeDasharray="5 4"
            strokeOpacity=".45"
            strokeLinejoin="round"
          />
        )}
        <polyline
          points={pointsFor(rows)}
          fill="none"
          stroke={metric.color}
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <text x={plot.left} y="121" fontSize="7" fill="#64748b">
          {date(rows[0])}
        </text>
        <text
          x={plot.left + plot.width}
          y="121"
          textAnchor="end"
          fontSize="7"
          fill="#64748b"
        >
          {date(rows.at(-1))}
        </text>
      </svg>
    </div>
  );
}

export function PaidDailyTrendSlide({ paidData, settings }) {
  const metrics = (settings.paidTrendMetrics || [])
    .map((key) =>
      paidAnalyticsMetricOptions.find((metric) => metric.key === key),
    )
    .filter(Boolean);
  const rows = paidData?.daily || [];
  const previousRows = paidData?.previousDaily || [];
  return (
    <>
      <Title
        title="Paid Media Daily Momentum"
        subtitle="Selected period (solid) compared with the previous period (dashed)"
        accent="#2563eb"
      />
      {rows.length && metrics.length ? (
        <div className="grid grid-cols-6 gap-3">
          {metrics.map((metric, index) => (
            <div
              key={metric.key}
              className={`col-span-2 ${metrics.length === 5 && index === 3 ? "col-start-2" : ""}`}
            >
              <MiniMetricChart
                rows={rows}
                previousRows={previousRows}
                metric={metric}
                currency={paidData.account?.currency}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex h-72 items-center justify-center rounded-2xl bg-slate-50 text-sm font-bold text-slate-400">
          Select at least one paid trend metric.
        </div>
      )}
    </>
  );
}

const monthlyColors = [
  "#2563eb",
  "#06b6d4",
  "#8b5cf6",
  "#f97316",
  "#10b981",
  "#ec4899",
  "#f59e0b",
  "#14b8a6",
  "#6366f1",
  "#84cc16",
];

function compactMonthlyValue(value, metric, currency) {
  const number = Number(value || 0);
  if (metric.percent) return `${number.toFixed(1)}%`;
  if (metric.money) {
    if (number >= 1_000_000)
      return `${currency || "USD"} ${(number / 1_000_000).toFixed(1)}M`;
    if (number >= 1_000)
      return `${currency || "USD"} ${(number / 1_000).toFixed(1)}K`;
    return formatMetric(number, metric, currency);
  }
  return compactNumber(number);
}

function denseMonthlyValue(value, metric) {
  const number = Number(value || 0);
  if (metric.percent) return `${number.toFixed(1)}%`;
  if (number >= 1_000_000) return `${(number / 1_000_000).toFixed(1)}M`;
  if (number >= 1_000) return `${(number / 1_000).toFixed(1)}K`;
  return compactNumber(number);
}

function PaidTwoPeriodComparisonChart({ rows, metrics, currency, accent }) {
  const [valueEdits, setValueEdits] = useState({});
  const previous = rows[0];
  const current = rows.at(-1);
  const metricCount = Math.max(metrics.length, 1);
  const compact = metricCount > 6;
  const barWidth = compact
    ? Math.max(3, Math.min(32, Math.floor((860 / metricCount - 8) / 2)))
    : Math.min(200, Math.floor(320 / metricCount));
  return (
    <div className="mt-3">
      <div
        className={`grid h-[310px] items-end border-b border-slate-300 ${compact ? "gap-1 px-2" : "gap-3 px-5"}`}
        style={{
          gridTemplateColumns: `repeat(${metrics.length},minmax(0,1fr))`,
        }}
      >
        {metrics.map((metric) => {
          const currentValue =
            valueEdits[`${metric.key}:current`] ??
            Number(derivedValue(current?.metrics, metric.key) || 0);
          const previousValue =
            valueEdits[`${metric.key}:previous`] ??
            Number(derivedValue(previous?.metrics, metric.key) || 0);
          const maximum = Math.max(currentValue, previousValue, 1);
          return (
            <div
              key={metric.key}
              className="flex h-full min-w-0 flex-col justify-end"
            >
              <div className={`flex h-[250px] items-end justify-center ${compact ? "gap-1" : "gap-2"}`}>
                <div className="flex h-full shrink-0 flex-col justify-end" style={{ width: barWidth }}>
                  <EditableChartValue
                    value={currentValue}
                    format={(value) => compactMonthlyValue(value, metric, currency)}
                    onChange={(value) =>
                      setValueEdits((edits) => ({
                        ...edits,
                        [`${metric.key}:current`]: value,
                      }))
                    }
                    className={`${compact ? `mb-1 ${metricCount > 16 ? "text-[5px]" : "text-[7px]"}` : "mb-2 text-[8px]"} whitespace-nowrap text-center font-extrabold text-slate-700`}
                  />
                  <div
                    className="min-h-[3px] rounded-t-lg"
                    style={{
                      height: `${Math.max(2, (currentValue / maximum) * 88)}%`,
                      backgroundColor: accent,
                    }}
                  />
                </div>
                <div className="flex h-full shrink-0 flex-col justify-end" style={{ width: barWidth }}>
                  <EditableChartValue
                    value={previousValue}
                    format={(value) => compactMonthlyValue(value, metric, currency)}
                    onChange={(value) =>
                      setValueEdits((edits) => ({
                        ...edits,
                        [`${metric.key}:previous`]: value,
                      }))
                    }
                    className={`${compact ? `mb-1 ${metricCount > 16 ? "text-[5px]" : "text-[7px]"}` : "mb-2 text-[8px]"} whitespace-nowrap text-center font-extrabold text-slate-400`}
                  />
                  <div
                    className="min-h-[3px] rounded-t-lg bg-slate-300"
                    style={{
                      height: `${Math.max(2, (previousValue / maximum) * 88)}%`,
                    }}
                  />
                </div>
              </div>
              <p className={`${compact ? `mt-2 min-h-6 leading-[9px] ${metricCount > 16 ? "text-[5px]" : metricCount > 10 ? "text-[7px]" : "text-[8px]"}` : "mt-3 min-h-6 text-[8px] leading-3"} break-words text-center font-extrabold uppercase tracking-wide text-slate-600`} title={metric.label}>
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
            style={{ backgroundColor: accent }}
          />
          {current?.label || "Selected period"}
        </span>
        <span className="flex items-center gap-2 text-slate-400">
          <span className="h-2.5 w-2.5 rounded-sm bg-slate-300" />
          {previous?.label || "Previous period"}
        </span>
      </div>
    </div>
  );
}

export function PaidMonthlyComparisonSlide({
  monthlyData,
  rangeMonthlyData,
  rangeMonthlyLoading = false,
  paidData,
  comparisonMode = "previous",
  settings,
  sourceError,
  currency = "LKR",
}) {
  const [valueEdits, setValueEdits] = useState({});
  const periodRows = paidData?.totals
    ? [
        {
          month: `previous-${paidData.comparisonPeriod?.since || "period"}`,
          label: paidData.comparisonPeriod?.label || "Previous period",
          metrics: Object.fromEntries(
            Object.entries(paidData.totals).map(([key, value]) => [
              key,
              Number(value?.previous || 0),
            ]),
          ),
        },
        {
          month: `current-${paidData.period?.since || "period"}`,
          label: paidData.period?.label || "Selected period",
          metrics: Object.fromEntries(
            Object.entries(paidData.totals).map(([key, value]) => [
              key,
              Number(value?.current || 0),
            ]),
          ),
        },
      ]
    : [];
  const monthWise = comparisonMode === "months";
  const rangeView = !monthWise && settings.paidMonthlyGraphMode === "range";
  const rows = monthWise ? monthlyData?.months || [] : periodRows;
  const metrics = (settings.paidMonthlyMetrics || [])
    .map((key) =>
      paidAnalyticsMetricOptions.find((metric) => metric.key === key),
    )
    .filter(Boolean);
  const monthCount = Math.max(1, rows.length);
  const barWidth = metrics.length > 6
    ? Math.max(2, Math.min(24, Math.floor((850 / metrics.length - 3) / monthCount)))
    : Math.max(7, Math.min(24, Math.floor((120 - Math.max(0, monthCount - 1)) / monthCount)));
  const dense = monthCount > 6;
  return (
    <>
      <Title
        title={
          monthWise
            ? "Paid Ads Month-wise Comparison"
            : "Paid Ads Performance Comparison"
        }
        subtitle={
          monthWise
            ? "Selected campaign metrics compared across the chosen months"
            : rangeView
              ? "Selected range vs Compare with · monthly metric trends"
            : comparisonMode === "custom"
              ? "Selected campaign metrics compared across the custom ranges"
              : "Selected campaign metrics compared with the previous period"
        }
        accent={settings.accent || "#2563eb"}
      />
      {sourceError ? (
        <div className="flex h-72 items-center justify-center rounded-2xl bg-rose-50 px-8 text-center text-sm font-bold text-rose-600">
          {sourceError}
        </div>
      ) : rangeView ? (
        rangeMonthlyLoading ? (
          <div className="flex h-72 items-center justify-center rounded-2xl bg-slate-50 text-sm font-bold text-slate-400">
            Loading paid range comparison...
          </div>
        ) : (
          <PlatformRangeComparisonCharts
            data={rangeMonthlyData}
            options={metrics}
            selected={metrics.map((metric) => metric.key)}
            valueReader={(row, key) => Number(derivedValue(row, key) || 0)}
            formatValue={denseMonthlyValue}
            caption={`Each metric has its own 0–max scale across both ranges. Spend and costs are in ${currency}.`}
          />
        )
      ) : rows.length && metrics.length ? monthWise ? (
        <>
          <div className="mb-3 flex flex-wrap items-center gap-x-2.5 gap-y-1">
            {rows.map((row, index) => (
              <span
                key={row.month}
                className="flex items-center gap-1.5 text-[8px] font-extrabold text-slate-500"
              >
                <span
                  className="h-2.5 w-2.5 rounded-sm"
                  style={{ backgroundColor: monthlyColors[index] }}
                />
                {row.label}
              </span>
            ))}
          </div>
          <div className="relative h-[320px] rounded-2xl border border-slate-200 bg-slate-50 px-8 pb-8 pt-5">
            <div className="pointer-events-none absolute bottom-14 left-8 right-8 top-5">
              <span className="absolute -left-6 -top-1 text-[7px] font-bold text-slate-400">100%</span>
              <span className="absolute -left-5 top-1/2 -translate-y-1/2 text-[7px] font-bold text-slate-400">50%</span>
              <span className="absolute -left-4 bottom-0 text-[7px] font-bold text-slate-400">0%</span>
              <span className="absolute inset-x-0 top-0 border-t border-dashed border-slate-200" />
              <span className="absolute inset-x-0 top-1/2 border-t border-dashed border-slate-200" />
              <span className="absolute inset-x-0 bottom-0 border-t border-slate-300" />
            </div>
            <div
              className={`relative z-10 grid h-full ${metrics.length > 6 ? "gap-1" : dense ? "gap-2" : "gap-3"}`}
              style={{
                gridTemplateColumns: `repeat(${metrics.length},minmax(0,1fr))`,
              }}
            >
              {metrics.map((metric) => {
                const values = rows.map(
                  (row, index) =>
                    valueEdits[`${metric.key}:${row.month || index}`] ??
                    Number(derivedValue(row.metrics, metric.key) || 0),
                );
                const maximum = Math.max(1, ...values);
                return (
                  <div key={metric.key} className="flex min-w-0 flex-col" title={metric.label}>
                    <div className="flex h-[245px] items-end justify-center gap-px">
                      {rows.map((row, index) => {
                        const value = values[index];
                        const height = value
                          ? Math.max(2, (value / maximum) * 84)
                          : 0;
                        return (
                          <div
                            key={row.month}
                            className="flex h-full shrink-0 flex-col items-center justify-end"
                            style={{ width: `${barWidth}px` }}
                          >
                            <EditableChartValue
                              value={value}
                              format={(nextValue) =>
                                dense
                                  ? denseMonthlyValue(nextValue, metric)
                                  : compactMonthlyValue(nextValue, metric, currency)
                              }
                              onChange={(nextValue) => {
                                const key = `${metric.key}:${row.month || index}`;
                                setValueEdits((edits) => ({
                                  ...edits,
                                  [key]: nextValue,
                                }));
                              }}
                              className={`${dense || metrics.length > 14 ? "text-[5px]" : "text-[6px]"} mb-1 whitespace-nowrap font-extrabold text-slate-600`}
                            />
                            <span
                              className="w-full rounded-t-sm"
                              style={{
                                height: `${height}%`,
                                backgroundColor: monthlyColors[index],
                              }}
                            />
                          </div>
                        );
                      })}
                    </div>
                    <p className={`mt-2 min-h-6 break-words text-center font-extrabold uppercase text-slate-600 ${metrics.length > 16 ? "text-[5px] leading-[9px]" : metrics.length > 10 ? "text-[7px] leading-[9px]" : "text-[8px] leading-3"}`}>
                      {metric.label}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      ) : (
        <PaidTwoPeriodComparisonChart
          rows={rows}
          metrics={metrics}
          currency={currency}
          accent={settings.accent || "#003870"}
        />
      ) : (
        <div className="flex h-72 items-center justify-center rounded-2xl bg-slate-50 text-sm font-bold text-slate-400">
          {monthWise
            ? "Select months and at least one comparison metric from the editor."
            : "Select at least one comparison metric from the editor."}
        </div>
      )}
    </>
  );
}
