import { compactNumber } from "../reportData";
import { paidAnalyticsMetricOptions } from "./campaignFields";

const funnelKeys = [
  "landingPageViews",
  "addToCart",
  "initiateCheckout",
  "purchases",
];

const value = (paidData, key, period) =>
  Number(paidData?.totals?.[key]?.[period] || 0);

export const funnelMetricOptions = funnelKeys.map((key) => ({
  ...paidAnalyticsMetricOptions.find((metric) => metric.key === key),
  label:
    key === "initiateCheckout"
      ? "Checkouts Initiated"
      : paidAnalyticsMetricOptions.find((metric) => metric.key === key)?.label,
}));

export default function PaidConversionFunnelSlide({ paidData, settings }) {
  const selected = settings.paidFunnelMetrics || funnelKeys;
  const stages = selected
    .map((key) => funnelMetricOptions.find((metric) => metric.key === key))
    .filter(Boolean);
  const landingPageViews = value(paidData, "landingPageViews", "current");
  const purchases = value(paidData, "purchases", "current");
  const previousLanding = value(paidData, "landingPageViews", "previous");
  const previousPurchases = value(paidData, "purchases", "previous");
  const conversionRate = landingPageViews
    ? (purchases / landingPageViews) * 100
    : 0;
  const previousConversionRate = previousLanding
    ? (previousPurchases / previousLanding) * 100
    : 0;
  const rateChange = previousConversionRate
    ? ((conversionRate - previousConversionRate) / previousConversionRate) * 100
    : null;

  return (
    <>
      <div className="mb-5 flex items-end justify-between">
        <div>
          <div
            className="mb-2 h-1 w-12 rounded-full"
            style={{ backgroundColor: settings.accent }}
          />
          <h2 className="text-3xl font-black tracking-tight text-slate-900">
            Paid Conversion Funnel
          </h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            Landing page traffic through completed purchases
          </p>
        </div>
        <div className="text-right">
          <p className="text-[9px] font-extrabold uppercase text-slate-400">
            Purchase conversion rate
          </p>
          <p className="text-3xl font-black" style={{ color: settings.accent }}>
            {conversionRate.toFixed(2)}%
          </p>
          <p
            className={`text-[10px] font-extrabold ${rateChange === null ? "text-slate-400" : rateChange >= 0 ? "text-emerald-600" : "text-rose-500"}`}
          >
            {rateChange === null
              ? "Previous period unavailable"
              : `${rateChange >= 0 ? "↑" : "↓"} ${Math.abs(rateChange).toFixed(1)}% vs previous`}
          </p>
        </div>
      </div>

      {stages.length ? (
        <div className="grid grid-cols-4 gap-3">
          {stages.map((stage, index) => {
            const current = value(paidData, stage.key, "current");
            const previous = value(paidData, stage.key, "previous");
            const share = landingPageViews
              ? Math.min(100, (current / landingPageViews) * 100)
              : 0;
            const change = previous
              ? ((current - previous) / previous) * 100
              : null;
            return (
              <div key={stage.key} className="min-w-0">
                <div className="mb-3 min-h-20 border-l border-slate-200 pl-3 first:border-l-0">
                  <p className="text-[9px] font-extrabold uppercase text-slate-500">
                    {index + 1}. {stage.label}
                  </p>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-xl font-black text-slate-900">
                      {compactNumber(current)}
                    </span>
                    <span className="text-[10px] font-extrabold text-slate-400">
                      {share.toFixed(2)}%
                    </span>
                  </div>
                  <p
                    className={`mt-1 text-[9px] font-bold ${change === null ? "text-slate-400" : change >= 0 ? "text-emerald-600" : "text-rose-500"}`}
                  >
                    {change === null
                      ? `Previous ${compactNumber(previous)}`
                      : `${change >= 0 ? "↑" : "↓"} ${Math.abs(change).toFixed(1)}% · Previous ${compactNumber(previous)}`}
                  </p>
                </div>
                <div className="flex h-64 items-end rounded-xl bg-slate-50 px-3">
                  <div
                    className="w-full rounded-t-xl transition-all"
                    style={{
                      height: `${Math.max(3, share)}%`,
                      backgroundColor: settings.accent,
                      opacity: Math.max(0.42, 1 - index * 0.16),
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex h-72 items-center justify-center rounded-2xl bg-slate-50 text-sm font-bold text-slate-400">
          Add at least one funnel field from the editor.
        </div>
      )}
      <p className="mt-4 text-center text-[10px] font-bold text-slate-500">
        Conversion rate = Purchases ÷ Landing Page Views
      </p>
    </>
  );
}
