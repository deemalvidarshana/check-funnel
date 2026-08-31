import { compactNumber, valueAtPath } from "../reportData";

export function metricValue(row, key) {
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
}) {
  const metrics = options.filter((metric) => selected.includes(metric.key));
  if (!data?.available)
    return (
      <>
        <Title
          platform={platform}
          subtitle="Organic performance breakdown"
          color={color}
        />
        <div className="rounded-2xl bg-amber-50 p-6 text-sm font-bold text-amber-700">
          {platform} insights unavailable:{" "}
          {data?.reason || sourceError || "No configured source"}
        </div>
      </>
    );
  const rows = rowsTransform(data.weekly || []);
  return (
    <>
      <Title
        platform={platform}
        subtitle="Latest performance breakdown"
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
            <span className="px-3 py-3">{periodLabel}</span>
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
              <span className="px-3 py-3 text-slate-800">
                {rowLabel(row)}
                {index === 0 ? " (Current)" : ""}
              </span>
              {metrics.map((metric) => (
                <span
                  key={metric.key}
                  className="border-l border-slate-100 px-1 py-3 text-center text-slate-700"
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
}) {
  const monthly = data?.comparisonRows?.length
      ? data.comparisonRows
      : data?.monthly || [],
    current = monthly.at(-1),
    previous = monthly.at(-2);
  const metrics = options
    .filter((metric) => selected.includes(metric.key))
    .map((metric) => ({
      ...metric,
      color,
      current: metricValue(current, metric.key),
      previous: metricValue(previous, metric.key),
    }));
  const hasData = metrics.some(
    (metric) => metric.current > 0 || metric.previous > 0,
  );
  return (
    <>
      <Title
        platform={platform}
        subtitle="Selected metrics compared with the previous month"
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
                        <span className="mb-2 text-center text-[8px] font-extrabold">
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
                        <span className="mb-2 text-center text-[8px] font-extrabold text-slate-400">
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
            <div className="mt-5 flex justify-center gap-7 text-[10px] font-bold text-slate-500">
              <span>{current.week || "Current month"}</span>
              <span className="text-slate-400">
                {previous?.week || "Previous month"}
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
