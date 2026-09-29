import { useState } from "react";
import { compactNumber, organicRangeLabel, valueAtPath } from "../reportData";
import EditableChartValue from "../EditableChartValue";

function metricValue(row, key) {
  if (key === "total_views")
    return Number(row?.views?.organic || 0) + Number(row?.views?.ads || 0);
  if (key === "video_count" && row?.create_time) return 1;
  return Number(valueAtPath(row, key) || 0);
}

function Title({ platform, subtitle, color }) {
  return (
    <div className="mb-5">
      <div
        className="mb-2 h-1 w-12 rounded-full"
        style={{ backgroundColor: color }}
      />
      <h2 className="text-3xl font-black tracking-tight text-slate-900">
        {platform} Organic Performance
      </h2>
      <p className="mt-1 text-sm font-semibold text-slate-500">{subtitle}</p>
    </div>
  );
}

const rangeMetricColors = [
  "#0b4a82",
  "#0fbaa8",
  "#7c3aed",
  "#f97316",
  "#e11d48",
  "#0891b2",
  "#65a30d",
  "#d97706",
  "#4f46e5",
  "#be185d",
  "#475569",
];

function RangeLinePanel({ title, series, metrics, seriesKey, valueEdits, onValueChange, metricMaximums, metricColors, valueReader, formatValue, caption }) {
  const rows = series?.rows || [];
  // Keep the chart area useful when metrics are removed, without growing past the slide.
  const metricRowHeight = Math.max(27, 264 / Math.max(metrics.length, 1));
  const plotBottom = metricRowHeight - 3;
  const xAt = (index) =>
    rows.length === 1
      ? 160
      : 20 + (index * 280) / (rows.length - 1);

  return (
    <div className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50 p-2">
      <div className="mb-2">
        <h3 className="text-lg font-black text-slate-900">{title}</h3>
        <p className="text-[9px] font-bold text-slate-500">
          {organicRangeLabel(series?.range)}
        </p>
        {rows.length === 1 && (
          <p className="text-[9px] font-semibold text-slate-500">
            One month in this range; select multiple months to see a trend.
          </p>
        )}
      </div>
      <div className="flex items-end border-b border-slate-200 pb-1">
        <span className="w-[100px] shrink-0 text-[8px] font-bold text-slate-500">
          Metric · max
        </span>
        <svg viewBox="0 0 320 16" className="h-4 min-w-0 flex-1" aria-hidden="true">
          {rows.map((row, index) => (
            <text
              key={row.since || row.week || index}
              x={xAt(index)}
              y="12"
              textAnchor="middle"
              fontSize={rows.length > 8 ? "6" : "8"}
              fontWeight="800"
              fill="#475569"
            >
              {row.week || organicRangeLabel(row)}
            </text>
          ))}
        </svg>
      </div>
      <div>
        {metrics.map((metric) => {
          const color = metricColors[metric.key];
          const values = rows.map(
            (row) =>
              valueEdits[
                `${seriesKey}:${metric.key}:${row.since || row.week}`
              ] ?? valueReader(row, metric.key),
          );
          const maximum = metricMaximums[metric.key] || 1;
          const yAt = (value) =>
            plotBottom -
            (Math.max(0, Number(value) || 0) / maximum) * (plotBottom - 14);
          const points = values
            .map((value, index) => `${xAt(index)},${yAt(value)}`)
            .join(" ");
          return (
            <div
              key={metric.key}
              className="flex items-center border-b border-slate-200/60 last:border-0"
              style={{ height: metricRowHeight }}
            >
              <div className="flex w-[100px] shrink-0 items-center gap-1 pr-1">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: color }} />
                <div className="min-w-0 leading-none">
                  <div className="truncate text-[8px] font-extrabold text-slate-700" title={metric.label}>
                    {metric.label}
                  </div>
                  <div className="mt-0.5 text-[7px] font-bold text-slate-400">
                    max {formatValue(maximum, metric)}
                  </div>
                </div>
              </div>
              <svg
                viewBox={`0 0 320 ${metricRowHeight}`}
                className="min-w-0 flex-1 overflow-visible"
                style={{ height: metricRowHeight }}
                aria-label={`${metric.label} monthly values`}
              >
                <line x1="20" x2="300" y1={plotBottom} y2={plotBottom} stroke="#dbe3ec" />
                {rows.length > 1 && (
                  <polyline
                    points={points}
                    fill="none"
                    stroke={color}
                    strokeWidth="2"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                )}
                {rows.map((row, rowIndex) => {
                  const x = xAt(rowIndex);
                  return (
                    <g key={row.since || row.week || rowIndex}>
                      <circle cx={x} cy={yAt(values[rowIndex])} r="2.5" fill={color} />
                      <foreignObject x={x - 22} y={Math.max(0, yAt(values[rowIndex]) - 13)} width="44" height="12">
                        <EditableChartValue
                          value={values[rowIndex]}
                          format={(value) => formatValue(value, metric)}
                          onChange={(value) => onValueChange(metric.key, row, value)}
                          className="block whitespace-nowrap text-center text-[7px] font-extrabold text-slate-700"
                        />
                      </foreignObject>
                    </g>
                  );
                })}
              </svg>
            </div>
          );
        })}
      </div>
      <p className="mt-1 text-[7px] font-semibold text-slate-500">
        {caption}
      </p>
    </div>
  );
}

export function PlatformRangeComparisonCharts({
  data,
  options,
  selected,
  valueReader = metricValue,
  formatValue = compactNumber,
  caption = "Each metric has its own 0–max scale, shared across both ranges. Labels show actual values.",
}) {
  const [valueEdits, setValueEdits] = useState({});
  const metrics = options.filter((metric) => selected.includes(metric.key));
  const metricColors = Object.fromEntries(
    options.map((metric, index) => [
      metric.key,
      metric.color || rangeMetricColors[index % rangeMetricColors.length],
    ]),
  );
  const series = data?.comparisonSeries || [];
  const hasBuckets = series.length >= 2 && series.slice(0, 2).every(
    (entry) => entry.rows?.length > 0,
  );
  const metricMaximums = Object.fromEntries(
    metrics.map((metric) => [
      metric.key,
      Math.max(
        1,
        ...series.slice(0, 2).flatMap((entry, seriesIndex) =>
          (entry.rows || []).map((row) =>
            valueEdits[
              `${seriesIndex === 0 ? "selected" : "compare"}:${metric.key}:${row.since || row.week}`
            ] ?? valueReader(row, metric.key),
          ),
        ),
      ),
    ]),
  );
  if (!hasBuckets || !metrics.length)
    return (
      <div className="flex h-72 items-center justify-center rounded-2xl bg-slate-50 text-sm font-bold text-slate-400">
        {metrics.length
          ? "Selected and comparison range data is unavailable."
          : "Select at least one graph metric."}
      </div>
    );
  return (
    <div className="grid grid-cols-2 gap-4">
      <RangeLinePanel
        title="Selected range"
        series={series[0]}
        metrics={metrics}
        seriesKey="selected"
        valueEdits={valueEdits}
        metricMaximums={metricMaximums}
        metricColors={metricColors}
        valueReader={valueReader}
        formatValue={formatValue}
        caption={caption}
        onValueChange={(key, row, value) =>
          setValueEdits((current) => ({
            ...current,
            [`selected:${key}:${row.since || row.week}`]: value,
          }))
        }
      />
      <RangeLinePanel
        title="Compare with"
        series={series[1]}
        metrics={metrics}
        seriesKey="compare"
        valueEdits={valueEdits}
        metricMaximums={metricMaximums}
        metricColors={metricColors}
        valueReader={valueReader}
        formatValue={formatValue}
        caption={caption}
        onValueChange={(key, row, value) =>
          setValueEdits((current) => ({
            ...current,
            [`compare:${key}:${row.since || row.week}`]: value,
          }))
        }
      />
    </div>
  );
}

export function PlatformTableSlide({
  platform,
  color,
  data,
  options,
  selected,
  sourceError,
  periodLabel = "Period",
  rowLabel = (row) => row.week,
  rowsTransform = (rows) => [...rows].reverse().slice(0, 6),
  tableMode = "weekly",
}) {
  const metrics = options.filter((metric) => selected.includes(metric.key));
  const rangeRows = data?.comparisonRows || [];
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
        ? [...(data?.monthly || [])].reverse().slice(0, 6)
        : rowsTransform(data?.weekly || []);
  const modeLabel =
    tableMode === "range"
      ? "Selected and comparison range totals"
      : tableMode === "monthly"
        ? "Last monthly performance breakdown"
        : "Last weekly performance breakdown";
  if (!data?.available)
    return (
      <>
        <Title
          platform={platform}
          subtitle={
            modeLabel
          }
          color={color}
        />
        <div className="rounded-2xl bg-amber-50 p-6 text-sm font-bold text-amber-700">
          {platform} insights unavailable:{" "}
          {data?.reason || sourceError || "No configured source"}
        </div>
      </>
    );
  const rowPadding = "py-3";
  return (
    <>
      <Title
        platform={platform}
        subtitle={
          modeLabel
        }
        color={color}
      />
      {metrics.length ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200">
          <div
            className="grid bg-[#f3f4f5] text-[8px] font-extrabold uppercase text-slate-500"
            style={{
              gridTemplateColumns: `150px repeat(${metrics.length},minmax(0,1fr))`,
            }}
          >
            <span className="px-3 py-3">
              {tableMode === "range"
                ? "Range"
                : tableMode === "monthly"
                  ? "Month"
                  : periodLabel}
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
              key={`${rowLabel(row)}-${index}`}
              className={`grid border-t border-slate-100 text-[9px] font-bold ${index === 0 ? "border-l-4 bg-slate-50" : "bg-white"}`}
              style={{
                gridTemplateColumns: `${index === 0 ? 146 : 150}px repeat(${metrics.length},minmax(0,1fr))`,
                borderLeftColor: index === 0 ? color : undefined,
              }}
            >
              <span className={`px-3 ${rowPadding} text-slate-800`}>
                {row.__reportRowLabel || rowLabel(row)}
                {index === 0 && tableMode !== "range"
                  ? ` (${tableMode === "monthly" ? "Latest" : "Current"})`
                  : ""}
              </span>
              {metrics.map((metric) => (
                <span
                  key={metric.key}
                  className={`border-l border-slate-100 px-1 ${rowPadding} text-center text-slate-700`}
                >
                  {metricValue(
                    row,
                    metric.weeklyKey || metric.key,
                  ).toLocaleString()}
                </span>
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl bg-slate-50 p-8 text-center text-sm font-bold text-slate-400">
          Select at least one {platform} table metric.
        </div>
      )}
    </>
  );
}

export function PlatformComparisonSlide({
  platform,
  color,
  data,
  options,
  selected,
  monthWise = false,
  rangeComparison = false,
}) {
  const [valueEdits, setValueEdits] = useState({});
  const monthly = data?.comparisonRows?.length
      ? data.comparisonRows
      : data?.monthly || [],
    current = monthly.at(-1),
    previous = monthly.at(-2);
  if (rangeComparison) {
    return (
      <>
        <Title
          platform={platform}
          subtitle="Selected range and comparison range shown separately"
          color={color}
        />
        <PlatformRangeComparisonCharts
          data={data}
          options={options}
          selected={selected}
          color={color}
        />
      </>
    );
  }
  if (monthWise) {
    return (
      <>
        <Title
          platform={platform}
          subtitle="Selected metrics compared across the chosen months"
          color={color}
        />
        <PlatformMultiMonthChart
          platform={platform}
          rows={monthly}
          options={options}
          selected={selected}
        />
      </>
    );
  }
  const metrics = options
    .filter((metric) => selected.includes(metric.key))
    .map((metric) => ({
      ...metric,
      color,
      current:
        valueEdits[`${metric.key}:current`] ?? metricValue(current, metric.key),
      previous:
        valueEdits[`${metric.key}:previous`] ?? metricValue(previous, metric.key),
    }));
  const hasData = metrics.some(
    (metric) => metric.current > 0 || metric.previous > 0,
  );
  return (
    <>
      <Title
        platform={platform}
        subtitle={
          rangeComparison
            ? "Selected range vs Compare with"
            : "Selected metrics compared with the previous month"
        }
        color={color}
      />
      {current && metrics.length && hasData ? (
        <div>
            <div
              className="grid h-[310px] items-end gap-3 border-b border-slate-300 px-5"
              style={{
                gridTemplateColumns: `repeat(${metrics.length},minmax(0,1fr))`,
              }}
            >
              {metrics.map((metric) => {
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
                          className="mb-2 text-center text-[8px] font-extrabold"
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
                          className="mb-2 text-center text-[8px] font-extrabold text-slate-400"
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
            <div className="mt-5 flex justify-center gap-7 text-[10px] font-bold text-slate-500">
              <span>
                {rangeComparison
                  ? "Selected range"
                  : current.week || "Current month"}
              </span>
              <span className="text-slate-400">
                {rangeComparison
                  ? "Compare with"
                  : previous?.week || "Previous month"}
              </span>
            </div>
        </div>
      ) : (
        <div className="flex h-72 items-center justify-center rounded-2xl bg-slate-50 text-sm font-bold text-slate-400">
          {metrics.length
            ? `No ${platform} activity is available for comparison.`
            : `Select at least one ${platform} graph metric.`}
        </div>
      )}
    </>
  );
}

const monthColors = [
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

export function PlatformMultiMonthChart({
  platform,
  rows = [],
  options,
  selected,
}) {
  const [valueEdits, setValueEdits] = useState({});
  const metrics = options.filter((metric) => selected.includes(metric.key));
  const metricCount = Math.max(1, metrics.length);
  const monthCount = Math.max(1, rows.length);
  const groupWidth = Math.max(50, Math.floor(820 / metricCount));
  const barWidth = Math.max(
    4,
    Math.min(20, Math.floor((groupWidth - monthCount + 1) / monthCount)),
  );
  const dense = monthCount > 6 || metrics.length > 7;
  const hasData = rows.some((row) =>
    metrics.some((metric) => metricValue(row, metric.key) > 0),
  );

  if (!rows.length || !metrics.length || !hasData) {
    return (
      <div className="flex h-72 items-center justify-center rounded-2xl bg-slate-50 text-sm font-bold text-slate-400">
        {metrics.length
          ? `No ${platform} activity is available for the selected months.`
          : `Select at least one ${platform} graph metric.`}
      </div>
    );
  }

  return (
    <>
      <div className="mb-3 flex flex-wrap items-center gap-x-2.5 gap-y-1">
        {rows.map((row, index) => (
          <span
            key={`${row.since || row.week}-${index}`}
            className="flex items-center gap-1.5 text-[8px] font-extrabold text-slate-500"
          >
            <span
              className="h-2.5 w-2.5 rounded-sm"
              style={{ backgroundColor: monthColors[index] }}
            />
            {row.week}
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
          className={`relative z-10 grid h-full ${dense ? "gap-1" : "gap-2"}`}
          style={{ gridTemplateColumns: `repeat(${metrics.length},minmax(0,1fr))` }}
        >
          {metrics.map((metric) => {
            const values = rows.map(
              (row, index) =>
                valueEdits[`${metric.key}:${row.since || row.week || index}`] ??
                metricValue(row, metric.key),
            );
            const maximum = Math.max(1, ...values);
            return (
              <div key={metric.key} className="flex min-w-0 flex-col">
                <div className="flex h-[245px] items-end justify-center gap-px">
                  {rows.map((row, index) => {
                    const value = values[index];
                    const height = value
                      ? Math.max(2, (value / maximum) * 84)
                      : 0;
                    return (
                      <div
                        key={`${row.since || row.week}-${index}`}
                        className="flex h-full shrink-0 flex-col items-center justify-end"
                        style={{ width: `${barWidth}px` }}
                      >
                        <EditableChartValue
                          value={value}
                          format={compactNumber}
                          onChange={(nextValue) => {
                            const key = `${metric.key}:${row.since || row.week || index}`;
                            setValueEdits((edits) => ({
                              ...edits,
                              [key]: nextValue,
                            }));
                          }}
                          className={`${dense ? "text-[4px]" : "text-[6px]"} mb-1 whitespace-nowrap font-extrabold text-slate-600`}
                        />
                        <span
                          className="w-full rounded-t-sm"
                          style={{
                            height: `${height}%`,
                            backgroundColor: monthColors[index],
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
                <p className={`${dense ? "text-[6px]" : "text-[8px]"} mt-2 min-h-6 text-center font-extrabold uppercase leading-3 text-slate-600`}>
                  {metric.label}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
