import { useMemo, useState } from "react";
import CampaignFieldBuilder from "./CampaignFieldBuilder";
import {
  campaignObjectiveGroups,
  defaultCampaignFieldsForObjective,
  formatCampaignObjective,
  paidAnalyticsMetricOptions,
} from "./campaignFields";
import { funnelMetricOptions } from "./PaidConversionFunnelSlide";
import ReportDropdown from "../ReportDropdown";
import { organicGraphModeOptions } from "../reportData";

function Group({ title, field, selected, onSettingsChange }) {
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
  paidData,
}) {
  const objectives = useMemo(
    () =>
      campaignObjectiveGroups(paidData?.campaigns || []).map(
        (group) => group.objective,
      ),
    [paidData?.campaigns],
  );
  const [preferredObjective, setActiveObjective] = useState(objectives[0] || "");
  const activeObjective = objectives.includes(preferredObjective)
    ? preferredObjective
    : objectives[0] || "";
  const section = (key, value) =>
    onSettingsChange((current) => ({
      ...current,
      sections: { ...current.sections, [key]: value },
    }));
  const block = (key, label, field, graphView = false) => (
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
        {graphView && (
          <label className="mt-3 block text-[10px] font-extrabold uppercase tracking-wide text-slate-500">
            Graph view
            <ReportDropdown
              value={settings.paidMonthlyGraphMode || "auto"}
              options={organicGraphModeOptions}
              onChange={(value) => onSettingsChange((current) => ({
                ...current,
                paidMonthlyGraphMode: value,
              }))}
            />
          </label>
        )}
        <Group
          title="Slide metrics"
          field={field}
          selected={settings[field] || []}
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
      {block(
        "paidMonthlyComparison",
        "Paid performance comparison",
        "paidMonthlyMetrics",
        true,
      )}
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
              {settings.paidCampaignObjectiveTotalsOnly
                ? "Objective performance summary"
                : "Campaign results by objective"}
            </span>
            <span className="text-[10px] text-slate-500">
              {settings.paidCampaignObjectiveTotalsOnly
                ? "Show calculated totals for each campaign objective"
                : "Compare campaigns and calculate totals for each objective"}
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
          <label className="mt-3 flex items-start gap-3 rounded-2xl bg-[#003870]/5 p-3">
            <input
              type="checkbox"
              checked={settings.paidCampaignObjectiveTotals !== false}
              onChange={(event) =>
                onSettingsChange((current) => ({
                  ...current,
                  paidCampaignObjectiveTotals: event.target.checked,
                  paidCampaignObjectiveTotalsOnly: event.target.checked
                    ? current.paidCampaignObjectiveTotalsOnly
                    : false,
                }))
              }
              className="mt-0.5 accent-[#003870]"
            />
            <span>
              <span className="block text-[11px] font-extrabold text-[#003870]">
                Show objective totals
              </span>
              <span className="mt-0.5 block text-[9px] font-semibold leading-4 text-slate-500">
                Add Sales, Engagement and other objective subtotals
              </span>
            </span>
          </label>
          <label className="mt-2 flex items-start gap-3 rounded-2xl bg-[#003870]/5 p-3">
            <input
              type="checkbox"
              checked={settings.paidCampaignObjectiveTotalsOnly === true}
              onChange={(event) =>
                onSettingsChange((current) => ({
                  ...current,
                  paidCampaignObjectiveTotals: event.target.checked
                    ? true
                    : current.paidCampaignObjectiveTotals,
                  paidCampaignObjectiveTotalsOnly: event.target.checked,
                }))
              }
              className="mt-0.5 accent-[#003870]"
            />
            <span>
              <span className="block text-[11px] font-extrabold text-[#003870]">
                Objective totals only
              </span>
              <span className="mt-0.5 block text-[9px] font-semibold leading-4 text-slate-500">
                Hide individual campaigns and show objective summaries only
              </span>
            </span>
          </label>
          {objectives.length ? (
            <>
              <label className="mt-3 block text-[10px] font-extrabold uppercase tracking-wide text-slate-500">
                Campaign objective
                <select
                  value={activeObjective}
                  onChange={(event) => setActiveObjective(event.target.value)}
                  className="mt-2 h-12 w-full rounded-full border border-slate-200 bg-slate-50 px-4 text-xs font-extrabold normal-case text-[#003870] outline-none focus:border-[#003870]/30 focus:bg-white"
                >
                  {objectives.map((objective) => (
                    <option key={objective} value={objective}>
                      {formatCampaignObjective(objective)}
                    </option>
                  ))}
                </select>
              </label>
              {activeObjective && (
                <CampaignFieldBuilder
                  label={`${formatCampaignObjective(activeObjective)} metrics`}
                  value={
                    settings.paidCampaignObjectiveFields?.[activeObjective] ||
                    defaultCampaignFieldsForObjective(activeObjective)
                  }
                  onChange={(fieldKeys) =>
                    onSettingsChange((current) => ({
                      ...current,
                      paidCampaignObjectiveFields: {
                        ...(current.paidCampaignObjectiveFields || {}),
                        [activeObjective]: fieldKeys,
                      },
                    }))
                  }
                />
              )}
              <p className="mt-2 text-[9px] font-semibold leading-4 text-slate-400">
                Each objective keeps its own columns and appears on a separate report table.
              </p>
            </>
          ) : (
            <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2.5 text-[10px] font-bold leading-4 text-amber-700">
              Refresh report data to load this client&apos;s campaign objectives.
            </p>
          )}
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
