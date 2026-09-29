import { useMemo, useState } from "react";
import {
  facebookMetricOptions,
  instagramMetricOptions,
  organicGraphModeOptions,
  organicTableModeOptions,
  tiktokMetricOptions,
} from "./reportData";
import PlatformSlideControls from "./PlatformSlideControls";
import PaidAdsSlideControls from "./paid-slides/PaidAdsSlideControls";
import ReportDropdown from "./ReportDropdown";
import ReportingMonthPicker from "./ReportingMonthPicker";

function shiftMonth(month, offset) {
  const [year, monthNumber] = month.split("-").map(Number);
  const date = new Date(Date.UTC(year, monthNumber - 1 + offset, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function readableMonth(month) {
  const [year, monthNumber] = month.split("-").map(Number);
  return new Date(Date.UTC(year, monthNumber - 1, 1)).toLocaleDateString(
    "en-GB",
    { month: "short", year: "numeric", timeZone: "UTC" },
  );
}

function Toggle({ checked, onChange, label, description }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 p-3 transition hover:bg-slate-50">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 h-4 w-4 accent-[#003870]"
      />
      <span>
        <span className="block text-xs font-extrabold text-slate-700">
          {label}
        </span>
        {description && (
          <span className="mt-0.5 block text-[10px] leading-4 text-slate-500">
            {description}
          </span>
        )}
      </span>
    </label>
  );
}

function ContinueButton({ onClick, label = "Continue to this slide →" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-3 flex h-10 w-full items-center justify-center rounded-full bg-[#003870]/5 text-[10px] font-extrabold text-[#003870] transition hover:bg-[#003870] hover:text-white"
    >
      {label}
    </button>
  );
}

function ComparisonControls({
  draft,
  mode,
  loading,
  onChange,
  onApply,
  onDefault,
  anchorMonth,
  selectedMonths,
  onMonthsChange,
  monthlyLoading,
}) {
  const [error, setError] = useState("");
  const [draftMonths, setDraftMonths] = useState(selectedMonths);
  const monthOptions = useMemo(
    () => Array.from({ length: 24 }, (_, index) => shiftMonth(anchorMonth, -index)),
    [anchorMonth],
  );
  const availableDraftMonths = draftMonths.filter((value) =>
    monthOptions.includes(value),
  );

  const toggleMonth = (value) => {
    setError("");
    setDraftMonths((current) => {
      const available = current.filter((month) => monthOptions.includes(month));
      if (available.includes(value))
        return available.filter((month) => month !== value);
      if (available.length >= 10) {
        setError("You can compare up to 10 months.");
        return available;
      }
      return [...available, value];
    });
  };

  const applyMonths = () => {
    if (!availableDraftMonths.length) {
      setError("Select at least one month.");
      return;
    }
    setError("");
    onMonthsChange([...availableDraftMonths].sort());
  };
  const apply = () => {
    const values = Object.values(draft || {});
    const valid = (value) => {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) return false;
      const [y, m, d] = value.split("-").map(Number);
      const date = new Date(y, m - 1, d);
      return (
        date.getFullYear() === y &&
        date.getMonth() === m - 1 &&
        date.getDate() === d
      );
    };
    if (values.length !== 4 || values.some((value) => !valid(value))) {
      setError("Select four valid calendar dates.");
      return;
    }
    if (
      draft.currentSince > draft.currentUntil ||
      draft.compareSince > draft.compareUntil
    ) {
      setError("Each From date must be before its To date.");
      return;
    }
    setError("");
    onApply();
  };
  const field = (key, label) => (
    <label className="block text-[9px] font-extrabold uppercase tracking-wide text-slate-500">
      {label}
      <input
        type="date"
        value={draft[key]}
        onChange={(event) =>
          onChange((current) => ({ ...current, [key]: event.target.value }))
        }
        className="mt-2 h-11 w-full rounded-full border border-[#c2c6d3]/30 bg-[#f3f4f5]/60 px-4 text-[10px] font-bold text-[#003870] outline-none transition focus:border-[#003870]/30 focus:bg-white focus:ring-2 focus:ring-[#003870]/10"
      />
    </label>
  );
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-extrabold text-slate-900">
        Comparison range
      </h2>
      <div className="mt-4 grid grid-cols-3 gap-1 rounded-full bg-[#f3f4f5]/70 p-1">
        <button
          type="button"
          onClick={() => {
            setError("");
            onDefault();
          }}
          className={`h-10 rounded-full text-[9px] font-extrabold transition ${mode === "previous" ? "bg-[#003870] text-white shadow-sm" : "text-slate-500 hover:bg-white"}`}
        >
          Previous period
        </button>
        <button
          type="button"
          onClick={apply}
          className={`h-10 rounded-full text-[9px] font-extrabold transition ${mode === "custom" ? "bg-[#003870] text-white shadow-sm" : "text-slate-500 hover:bg-white"}`}
        >
          Custom ranges
        </button>
        <button
          type="button"
          onClick={applyMonths}
          className={`h-10 rounded-full text-[9px] font-extrabold transition ${mode === "months" ? "bg-[#003870] text-white shadow-sm" : "text-slate-500 hover:bg-white"}`}
        >
          Month wise
        </button>
      </div>
      {mode === "months" ? (
        <div className="mt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-extrabold text-slate-700">Compare months</p>
              <p className="mt-0.5 text-[9px] font-semibold text-slate-400">Choose 1–10 months</p>
            </div>
            <button
              type="button"
              onClick={() => setDraftMonths(monthOptions.slice(0, 4))}
              className="text-[9px] font-extrabold text-[#003870]"
            >
              Last 4
            </button>
          </div>
          <div className="mt-3 grid max-h-64 grid-cols-2 gap-1 overflow-y-auto pr-1">
            {monthOptions.map((value) => {
              const checked = draftMonths.includes(value);
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => toggleMonth(value)}
                  className={`flex items-center gap-2 rounded-xl px-2.5 py-2 text-left text-[10px] font-bold transition ${checked ? "bg-[#2563eb]/10 text-[#003870]" : "text-slate-500 hover:bg-slate-50"}`}
                >
                  <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${checked ? "border-[#2563eb] bg-[#2563eb] text-white" : "border-slate-300"}`}>
                    {checked ? "✓" : ""}
                  </span>
                  {readableMonth(value)}
                </button>
              );
            })}
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-3">
            <span className="text-[9px] font-bold text-slate-400">{availableDraftMonths.length} selected</span>
            <button
              type="button"
              onClick={applyMonths}
              disabled={!availableDraftMonths.length || monthlyLoading}
              className="rounded-full bg-[#003870] px-5 py-2 text-[10px] font-extrabold text-white disabled:opacity-50"
            >
              {monthlyLoading ? "Loading..." : "Apply months"}
            </button>
          </div>
        </div>
      ) : <>
      <div className="mt-4">
        <p className="mb-2 text-[10px] font-extrabold text-slate-700">
          Selected range
        </p>
        <div className="grid grid-cols-2 gap-2">
          {field("currentSince", "From")}
          {field("currentUntil", "To")}
        </div>
      </div>
      <div className="mt-3">
        <p className="mb-2 text-[10px] font-extrabold text-slate-700">
          Compare with
        </p>
        <div className="grid grid-cols-2 gap-2">
          {field("compareSince", "From")}
          {field("compareUntil", "To")}
        </div>
      </div>
      {error && (
        <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-[10px] font-bold text-red-600">
          {error}
        </p>
      )}
      {mode === "custom" && !loading && !error && (
        <p className="mt-3 text-center text-[10px] font-bold text-emerald-600">
          Custom comparison applied
        </p>
      )}
      <button
        type="button"
        onClick={apply}
        disabled={loading}
        className="mt-5 h-11 w-full rounded-full bg-[#003870] text-[10px] font-extrabold text-white shadow-sm transition hover:bg-[#00529a] disabled:opacity-60"
      >
        {loading ? "Applying comparison..." : "Apply comparison"}
      </button>
      </>}
    </div>
  );
}

export default function ReportControls({
  clients,
  clientId,
  month,
  settings,
  loading,
  onClientChange,
  onMonthChange,
  onSettingsChange,
  onRefresh,
  onDownload,
  downloading,
  onNavigateSlide,
  slideNumbers,
  comparisonDraft,
  comparisonMode,
  onComparisonDraftChange,
  onApplyComparison,
  onUsePreviousPeriod,
  comparisonLoading,
  selectedMonths,
  onMonthsChange,
  monthlyLoading,
  paidData,
  onGenerateOrganicHighlights,
  organicHighlightsAvailable,
  organicHighlightsLoading,
  organicHighlightsReady,
  organicHighlightsGeneratedByAi,
  organicHighlightsError,
}) {
  const [downloadOpen, setDownloadOpen] = useState(false);
  const facebookTableMetrics =
    settings.facebookTableMetrics || settings.facebookMetrics || [];
  const facebookGraphMetrics =
    settings.facebookGraphMetrics || settings.facebookMetrics || [];
  const set = (patch) =>
    onSettingsChange((current) => ({ ...current, ...patch }));
  const setSection = (key, checked) =>
    onSettingsChange((current) => ({
      ...current,
      sections: { ...current.sections, [key]: checked },
    }));
  const toggleFacebookMetric = (field, key) =>
    onSettingsChange((current) => {
      const selected = current[field] || current.facebookMetrics || [];
      return {
        ...current,
        [field]: selected.includes(key)
          ? selected.filter((item) => item !== key)
          : [...selected, key],
      };
    });
  const setAllFacebookMetrics = (field) => {
    const selected =
      field === "facebookTableMetrics"
        ? facebookTableMetrics
        : facebookGraphMetrics;
    set({
      [field]:
        selected.length === facebookMetricOptions.length
          ? []
          : facebookMetricOptions.map((metric) => metric.key),
    });
  };
  return (
    <aside className="space-y-4 lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto lg:pr-1">
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-extrabold text-slate-900">Report source</h2>
        <div className="mt-4 space-y-3">
          <div className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
            Client
            <ReportDropdown
              value={clientId}
              placeholder="Select a client"
              options={clients.map((client) => ({
                value: String(client.id),
                label: client.name,
              }))}
              onChange={onClientChange}
            />
          </div>
          <div className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
            Reporting month
            <ReportingMonthPicker value={month} onChange={onMonthChange} />
          </div>
          <button
            type="button"
            onClick={onRefresh}
            disabled={!clientId || loading}
            className="h-12 w-full rounded-full bg-[#003870] text-xs font-extrabold text-white shadow-sm transition hover:bg-[#00529a] disabled:opacity-50"
          >
            {loading ? "Loading sources..." : "Refresh report data"}
          </button>
        </div>
      </div>
      <ComparisonControls
        key={`${month}-${selectedMonths.join(",")}`}
        draft={comparisonDraft}
        mode={comparisonMode}
        loading={comparisonLoading}
        onChange={onComparisonDraftChange}
        onApply={onApplyComparison}
        onDefault={onUsePreviousPeriod}
        anchorMonth={month}
        selectedMonths={selectedMonths}
        onMonthsChange={onMonthsChange}
        monthlyLoading={monthlyLoading}
      />
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-extrabold text-slate-900">
          Report details
        </h2>
        <div className="mt-4 space-y-3">
          <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
            Title
            <input
              value={settings.title}
              onChange={(event) => set({ title: event.target.value })}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-semibold"
            />
          </label>
          <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
            Subtitle
            <textarea
              value={settings.subtitle}
              onChange={(event) => set({ subtitle: event.target.value })}
              rows="3"
              className="mt-1 w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-semibold"
            />
          </label>
          <label className="flex items-center justify-between text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
            Accent colour
            <input
              type="color"
              value={settings.accent}
              onChange={(event) => set({ accent: event.target.value })}
              className="h-9 w-14 cursor-pointer rounded-lg border border-slate-200 bg-white p-1"
            />
          </label>
          <ContinueButton
            onClick={() => onNavigateSlide?.("cover")}
            label={`Continue to slide ${slideNumbers.cover} →`}
          />
        </div>
      </div>
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-extrabold text-slate-900">
          Facebook organic slides
        </h2>
        <div className="mt-4">
          <Toggle
            checked={settings.sections.executive}
            onChange={(value) => setSection("executive", value)}
            label="Include table slide"
            description="Weekly Facebook breakdown on slide 2"
          />
          <div
            className={`mt-3 ${settings.sections.executive ? "" : "pointer-events-none opacity-40"}`}
          >
            <label className="mb-3 block text-[10px] font-extrabold uppercase tracking-wide text-slate-500">
              Table view
              <ReportDropdown
                value={settings.facebookTableMode || "weekly"}
                options={organicTableModeOptions}
                onChange={(value) => set({ facebookTableMode: value })}
              />
            </label>
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-500">
                Table metrics
              </p>
              <button
                type="button"
                onClick={() => setAllFacebookMetrics("facebookTableMetrics")}
                className="text-[9px] font-extrabold uppercase text-[#003870]"
              >
                {facebookTableMetrics.length === facebookMetricOptions.length
                  ? "Clear all"
                  : "Select all"}
              </button>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {facebookMetricOptions.map((metric) => (
                <label
                  key={metric.key}
                  className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2.5 text-[10px] font-bold ${facebookTableMetrics.includes(metric.key) ? "border-[#1877f2]/30 bg-[#1877f2]/5 text-[#1257a6]" : "border-slate-200 text-slate-500"}`}
                >
                  <input
                    type="checkbox"
                    checked={facebookTableMetrics.includes(metric.key)}
                    onChange={() =>
                      toggleFacebookMetric("facebookTableMetrics", metric.key)
                    }
                    className="accent-[#1877f2]"
                  />
                  {metric.label}
                </label>
              ))}
            </div>
            <ContinueButton
              onClick={() => onNavigateSlide?.("executive")}
              label={`Continue to slide ${slideNumbers.executive} →`}
            />
          </div>
        </div>
        <div className="my-5 border-t border-slate-200" />
        <div>
          <Toggle
            checked={settings.sections.paidTrend}
            onChange={(value) => setSection("paidTrend", value)}
            label="Include comparison graph slide"
            description="Current month compared with previous month"
          />
          <div
            className={`mt-3 ${settings.sections.paidTrend ? "" : "pointer-events-none opacity-40"}`}
          >
            <label className="mb-3 block text-[10px] font-extrabold uppercase tracking-wide text-slate-500">
              Graph view
              <ReportDropdown
                value={settings.facebookGraphMode || "auto"}
                options={organicGraphModeOptions}
                onChange={(value) => set({ facebookGraphMode: value })}
              />
            </label>
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-500">
                Graph metrics
              </p>
              <button
                type="button"
                onClick={() => setAllFacebookMetrics("facebookGraphMetrics")}
                className="text-[9px] font-extrabold uppercase text-[#003870]"
              >
                {facebookGraphMetrics.length === facebookMetricOptions.length
                  ? "Clear all"
                  : "Select all"}
              </button>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {facebookMetricOptions.map((metric) => (
                <label
                  key={metric.key}
                  className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2.5 text-[10px] font-bold ${facebookGraphMetrics.includes(metric.key) ? "border-[#1877f2]/30 bg-[#1877f2]/5 text-[#1257a6]" : "border-slate-200 text-slate-500"}`}
                >
                  <input
                    type="checkbox"
                    checked={facebookGraphMetrics.includes(metric.key)}
                    onChange={() =>
                      toggleFacebookMetric("facebookGraphMetrics", metric.key)
                    }
                    className="accent-[#1877f2]"
                  />
                  {metric.label}
                </label>
              ))}
            </div>
            <ContinueButton
              onClick={() => onNavigateSlide?.("paidTrend")}
              label={`Continue to slide ${slideNumbers.paidTrend} →`}
            />
          </div>
        </div>
      </div>
      <PlatformSlideControls
        platform="Instagram"
        options={instagramMetricOptions}
        settings={settings}
        onSettingsChange={onSettingsChange}
        onNavigateSlide={onNavigateSlide}
        slideNumbers={slideNumbers}
      />
      <PlatformSlideControls
        platform="TikTok"
        options={tiktokMetricOptions}
        settings={settings}
        onSettingsChange={onSettingsChange}
        onNavigateSlide={onNavigateSlide}
        slideNumbers={slideNumbers}
      />
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-extrabold text-slate-900">Organic performance highlights</h2>
        <div className="mt-4">
          <Toggle
            checked={settings.sections.organicHighlights}
            onChange={(value) => setSection("organicHighlights", value)}
            label="Include AI highlights slide"
            description="Positive points from this client's Facebook, Instagram and TikTok metrics"
          />
          <div className={`mt-4 ${settings.sections.organicHighlights ? "" : "pointer-events-none opacity-40"}`}>
            <label className="block text-[10px] font-extrabold uppercase tracking-wide text-slate-500">
              Instruction for AI
              <textarea
                value={settings.organicHighlightsInstruction || ""}
                onChange={(event) => set({ organicHighlightsInstruction: event.target.value })}
                maxLength={600}
                rows={3}
                placeholder="For example: Focus on organic reach and audience engagement."
                className="mt-2 w-full resize-y rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-semibold normal-case leading-5 text-slate-800"
              />
            </label>
            <p className="mt-2 text-[10px] leading-4 text-slate-500">
              The instruction guides wording. Highlights use only the connected report metrics.
            </p>
            <button
              type="button"
              onClick={onGenerateOrganicHighlights}
              disabled={!organicHighlightsAvailable || organicHighlightsLoading}
              className="mt-4 h-11 w-full rounded-full bg-[#003870] text-xs font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {organicHighlightsLoading ? "Generating highlights..." : organicHighlightsReady ? "Regenerate highlights" : "Generate highlights"}
            </button>
            {organicHighlightsError && <p className="mt-2 text-[10px] font-bold text-rose-600">{organicHighlightsError}</p>}
            {!organicHighlightsError && organicHighlightsReady && (
              <p className="mt-2 text-[10px] font-bold text-emerald-700">
                {organicHighlightsGeneratedByAi
                  ? "AI highlights ready for the slide and export."
                  : "AI returned no usable points, so verified source-metric highlights are shown."}
              </p>
            )}
            <ContinueButton
              onClick={() => onNavigateSlide?.("organicHighlights")}
              label={`Continue to slide ${slideNumbers.organicHighlights} →`}
            />
          </div>
        </div>
      </div>
      <PaidAdsSlideControls
        paidData={paidData}
        settings={settings}
        onSettingsChange={onSettingsChange}
        onNavigateSlide={onNavigateSlide}
        slideNumbers={slideNumbers}
      />
      <div className="relative">
        <button
          type="button"
          onClick={() => setDownloadOpen((current) => !current)}
          disabled={downloading || loading || !clientId}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,#003870,#014f99)] text-sm font-extrabold text-white shadow-lg disabled:opacity-50"
        >
          {downloading ? "Creating report..." : "Download report"}
          {!downloading && <span>⌄</span>}
        </button>
        {downloadOpen && !downloading && (
          <div className="absolute bottom-full left-0 right-0 z-[90] mb-2 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl">
            <button
              type="button"
              onClick={() => {
                setDownloadOpen(false);
                onDownload("pdf");
              }}
              className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-xs font-extrabold text-[#003870] hover:bg-slate-50"
            >
              <span>Download PDF</span>
              <span className="text-[9px] text-slate-400">.pdf</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setDownloadOpen(false);
                onDownload("pptx");
              }}
              className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-xs font-extrabold text-[#003870] hover:bg-slate-50"
            >
              <span>Download PowerPoint</span>
              <span className="text-[9px] text-slate-400">.pptx</span>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
