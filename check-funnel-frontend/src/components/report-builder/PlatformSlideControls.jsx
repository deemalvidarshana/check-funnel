function MetricGroup({ title, options, selected, onToggle, onAll }) {
  return (
    <div className="mt-3">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-500">
          {title}
        </p>
        <button
          type="button"
          onClick={onAll}
          className="text-[9px] font-extrabold uppercase text-[#003870]"
        >
          {selected.length === options.length ? "Clear all" : "Select all"}
        </button>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {options.map((metric) => (
          <label
            key={metric.key}
            className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2.5 text-[10px] font-bold ${selected.includes(metric.key) ? "border-[#1877f2]/30 bg-[#1877f2]/5 text-[#1257a6]" : "border-slate-200 text-slate-500"}`}
          >
            <input
              type="checkbox"
              checked={selected.includes(metric.key)}
              onChange={() => onToggle(metric.key)}
              className="accent-[#1877f2]"
            />
            {metric.label}
          </label>
        ))}
      </div>
    </div>
  );
}

function IncludeToggle({ checked, onChange, label, description }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 p-3">
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
        <span className="mt-0.5 block text-[10px] leading-4 text-slate-500">
          {description}
        </span>
      </span>
    </label>
  );
}

function ContinueButton({ onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-3 flex h-9 w-full items-center justify-center rounded-xl bg-[#003870]/5 text-[10px] font-extrabold text-[#003870] transition hover:bg-[#003870] hover:text-white"
    >
      {label}
    </button>
  );
}

export default function PlatformSlideControls({
  platform,
  options,
  settings,
  onSettingsChange,
  onNavigateSlide,
  slideNumbers,
}) {
  const prefix = platform.toLowerCase();
  const tableField = `${prefix}TableMetrics`,
    graphField = `${prefix}GraphMetrics`;
  const tableSection = `${prefix}Table`,
    graphSection = `${prefix}Graph`;
  const table = settings[tableField] || [],
    graph = settings[graphField] || [];
  const patch = (value) =>
    onSettingsChange((current) => ({ ...current, ...value }));
  const section = (key, value) =>
    onSettingsChange((current) => ({
      ...current,
      sections: { ...current.sections, [key]: value },
    }));
  const toggle = (field, key) =>
    patch({
      [field]: (settings[field] || []).includes(key)
        ? settings[field].filter((item) => item !== key)
        : [...(settings[field] || []), key],
    });
  const all = (field) =>
    patch({
      [field]:
        (settings[field] || []).length === options.length
          ? []
          : options.map((metric) => metric.key),
    });
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-extrabold text-slate-900">
        {platform} organic slides
      </h2>
      <div className="mt-4">
        <IncludeToggle
          checked={settings.sections[tableSection]}
          onChange={(value) => section(tableSection, value)}
          label="Include table slide"
          description={`${platform} weekly/detail breakdown`}
        />
        <div
          className={
            settings.sections[tableSection]
              ? ""
              : "pointer-events-none opacity-40"
          }
        >
          <MetricGroup
            title="Table metrics"
            options={options}
            selected={table}
            onToggle={(key) => toggle(tableField, key)}
            onAll={() => all(tableField)}
          />
          <ContinueButton
            onClick={() => onNavigateSlide?.(tableSection)}
            label={`Continue to slide ${slideNumbers[tableSection]} →`}
          />
        </div>
      </div>
      <div className="my-5 border-t border-slate-200" />
      <div>
        <IncludeToggle
          checked={settings.sections[graphSection]}
          onChange={(value) => section(graphSection, value)}
          label="Include comparison graph slide"
          description="Current month compared with previous month"
        />
        <div
          className={
            settings.sections[graphSection]
              ? ""
              : "pointer-events-none opacity-40"
          }
        >
          <MetricGroup
            title="Graph metrics"
            options={options}
            selected={graph}
            onToggle={(key) => toggle(graphField, key)}
            onAll={() => all(graphField)}
          />
          <ContinueButton
            onClick={() => onNavigateSlide?.(graphSection)}
            label={`Continue to slide ${slideNumbers[graphSection]} →`}
          />
        </div>
      </div>
    </div>
  );
}
