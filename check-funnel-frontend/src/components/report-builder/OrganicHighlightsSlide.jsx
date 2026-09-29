const platformNames = { facebook: "Facebook", instagram: "Instagram", tiktok: "TikTok", overall: "Overall" };

export default function OrganicHighlightsSlide({
  accent = "#003870",
  points = [],
  platforms = [],
  loading = false,
  error = "",
}) {
  return (
    <>
      <div className="mb-7">
        <div className="mb-2 h-1 w-12 rounded-full" style={{ backgroundColor: accent }} />
        <h2 className="text-3xl font-black tracking-tight text-slate-900">Organic performance highlights</h2>
        <p className="mt-1 text-sm font-semibold text-slate-500">
          Positive results from the selected report data
        </p>
      </div>
      {points.length ? (
        <div className="space-y-1">
          {points.slice(0, 5).map((point, index) => (
            <div key={`${point.platform}-${index}`} className="grid min-h-[58px] grid-cols-[38px_96px_minmax(0,1fr)] items-start gap-3 border-b border-slate-200 py-3 last:border-0">
              <span className="text-sm font-black" style={{ color: accent }}>{String(index + 1).padStart(2, "0")}</span>
              <span className="pt-0.5 text-[10px] font-extrabold uppercase tracking-wide text-slate-500">
                {platformNames[point.platform] || point.platform}
              </span>
              <p className="text-[13px] font-semibold leading-5 text-slate-800">{point.text}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex h-[290px] items-center justify-center border-y border-slate-200 text-center text-sm font-semibold text-slate-500">
          {loading
            ? "Generating source-backed highlights..."
            : error || (platforms.length
              ? "Use Generate highlights in the control panel to create this slide."
              : "No connected organic metrics are available for this report range.")}
        </div>
      )}
      {points.length > 0 && (
        <p className="mt-5 text-[9px] font-semibold text-slate-400">
          Based on the connected {platforms.map((platform) => platformNames[platform] || platform).join(", ")} metrics in this report.
        </p>
      )}
    </>
  );
}
