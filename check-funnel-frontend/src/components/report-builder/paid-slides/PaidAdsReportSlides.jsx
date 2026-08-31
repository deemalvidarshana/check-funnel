import { compactNumber, formatMetric } from "../reportData";
import { paidAnalyticsMetricOptions } from "./campaignFields";

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
