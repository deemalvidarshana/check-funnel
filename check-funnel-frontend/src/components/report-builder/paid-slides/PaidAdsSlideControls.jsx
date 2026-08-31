import CampaignFieldBuilder from "./CampaignFieldBuilder";
import { paidAnalyticsMetricOptions } from "./campaignFields";
import { funnelMetricOptions } from "./PaidConversionFunnelSlide";

function Group({ title, field, selected, settings, onSettingsChange }) {
  return (
    <CampaignFieldBuilder
      value={selected}
      options={paidAnalyticsMetricOptions}
      label={title}
      onChange={(next) =>
        onSettingsChange((current) => ({ ...current, [field]: next }))
      }
    />
  );
}
export default function PaidAdsSlideControls({
  settings,
  onSettingsChange,
  onNavigateSlide,
  slideNumbers,
}) {
  const section = (key, value) =>
    onSettingsChange((current) => ({
      ...current,
      sections: { ...current.sections, [key]: value },
    }));
  const block = (key, label, field) => (
    <div>
      <label className="flex gap-3 rounded-2xl border border-slate-200 p-3">
        <input
          type="checkbox"
          checked={settings.sections[key]}
          onChange={(event) => section(key, event.target.checked)}
          className="mt-1 accent-[#003870]"
        />
        <span>
          <span className="block text-xs font-extrabold text-slate-700">
            {label}
          </span>
          <span className="text-[10px] text-slate-500">
            Include this paid analytics slide
          </span>
        </span>
      </label>
      <div
        className={
          settings.sections[key] ? "" : "pointer-events-none opacity-40"
        }
      >
        <Group
          title="Slide metrics"
          field={field}
          selected={settings[field] || []}
          settings={settings}
          onSettingsChange={onSettingsChange}
        />
        <button
          type="button"
          onClick={() => onNavigateSlide(key)}
          className="mt-3 h-9 w-full rounded-xl bg-[#003870]/5 text-[10px] font-extrabold text-[#003870]"
        >
          Continue to slide {slideNumbers[key]} →
        </button>
      </div>
    </div>
  );
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-extrabold text-slate-900">
        Paid Ads Analysis slides
      </h2>
      <div className="mt-4">
        {block(
          "paidOverview",
          "Paid performance overview",
          "paidOverviewMetrics",
        )}
      </div>
      <div className="my-5 border-t border-slate-200" />
      {block("paidDailyTrend", "Paid daily trend", "paidTrendMetrics")}
      <div className="my-5 border-t border-slate-200" />
      <div>
        <label className="flex gap-3 rounded-2xl border border-slate-200 p-3">
          <input
            type="checkbox"
            checked={settings.sections.paidCampaignTable}
            onChange={(event) =>
              section("paidCampaignTable", event.target.checked)
            }
            className="mt-1 accent-[#003870]"
          />
          <span>
            <span className="block text-xs font-extrabold text-slate-700">
              Campaign ranking table
            </span>
            <span className="text-[10px] text-slate-500">
              Build a table using campaign fields in your chosen order
            </span>
          </span>
        </label>
        <div
          className={
            settings.sections.paidCampaignTable
              ? ""
              : "pointer-events-none opacity-40"
          }
        >
          <CampaignFieldBuilder
            value={settings.paidCampaignFields || []}
            onChange={(paidCampaignFields) =>
              onSettingsChange((current) => ({
                ...current,
                paidCampaignFields,
              }))
            }
          />
          <button
            type="button"
            onClick={() => onNavigateSlide("paidCampaignTable")}
            className="mt-3 h-9 w-full rounded-xl bg-[#003870]/5 text-[10px] font-extrabold text-[#003870]"
          >
            Continue to slide {slideNumbers.paidCampaignTable} →
          </button>
        </div>
      </div>
      <div className="my-5 border-t border-slate-200" />
      <div>
        <label className="flex gap-3 rounded-2xl border border-slate-200 p-3">
          <input
            type="checkbox"
            checked={settings.sections.paidConversionFunnel}
            onChange={(event) =>
              section("paidConversionFunnel", event.target.checked)
            }
            className="mt-1 accent-[#003870]"
          />
          <span>
            <span className="block text-xs font-extrabold text-slate-700">
              Paid conversion funnel
            </span>
            <span className="text-[10px] text-slate-500">
              Landing page views through completed purchases
            </span>
          </span>
        </label>
        <div
          className={
            settings.sections.paidConversionFunnel
              ? ""
              : "pointer-events-none opacity-40"
          }
        >
          <CampaignFieldBuilder
            value={settings.paidFunnelMetrics || []}
            options={funnelMetricOptions}
            label="Funnel fields"
            onChange={(paidFunnelMetrics) =>
              onSettingsChange((current) => ({
                ...current,
                paidFunnelMetrics,
              }))
            }
          />
          <button
            type="button"
            onClick={() => onNavigateSlide("paidConversionFunnel")}
            className="mt-3 h-9 w-full rounded-xl bg-[#003870]/5 text-[10px] font-extrabold text-[#003870]"
          >
            Continue to slide {slideNumbers.paidConversionFunnel} →
          </button>
        </div>
      </div>
    </div>
  );
}
