import { formatGaNumber } from "../../utils/googleAnalyticsFormatters";

function JourneyPanel({
  title,
  description,
  badge,
  badgeClass,
  steps,
  accent,
  note,
  aligned = false,
}) {
  const max = Math.max(...steps.map((step) => Number(step.value || 0)), 1);
  return (
    <article
      className={`min-w-0 bg-white p-5 sm:p-6 ${aligned ? "rounded-3xl border border-[#c2c6d3]/30 shadow-sm" : "rounded-[28px] border border-[#c2c6d3]/20"}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2
            className={
              aligned
                ? "text-lg font-extrabold text-[#191c1d]"
                : "text-base font-black text-[#273548]"
            }
          >
            {title}
          </h2>
          <p
            className={`mt-1 font-semibold ${aligned ? "text-xs text-[#727782]" : "text-[11px] text-[#8a9099]"}`}
          >
            {description}
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1.5 text-[9px] font-black uppercase tracking-wider ${badgeClass}`}
        >
          {badge}
        </span>
      </div>
      <div
        className={
          aligned
            ? "mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3"
            : "mt-6 space-y-3"
        }
      >
        {steps.map((step, index) => {
          const previous = Number(steps[index - 1]?.value || 0);
          const rate =
            index === 0 || previous === 0
              ? null
              : (Number(step.value || 0) / previous) * 100;
          return (
            <div
              key={step.eventName}
              className={`grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 rounded-2xl px-4 py-3.5 ${aligned ? "border border-[#c2c6d3]/25 bg-white" : "bg-[#f8f9fa]"}`}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[9px] font-black text-white"
                    style={{ backgroundColor: accent }}
                  >
                    {index + 1}
                  </span>
                  <span className="truncate text-xs font-extrabold text-[#354052]">
                    {step.label}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-black text-[#273548]">
                  {formatGaNumber(step.value)}
                </p>
                {rate !== null && (
                  <p className="text-[9px] font-bold text-[#8a9099]">
                    {rate.toFixed(1)}% of prior
                  </p>
                )}
              </div>
              <div className="col-span-2 ml-8 h-1.5 overflow-hidden rounded-full bg-[#eef2f6]">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.max((Number(step.value || 0) / max) * 100, Number(step.value || 0) ? 2 : 0)}%`,
                    backgroundColor: accent,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <p
        className={`mt-4 text-[10px] font-semibold leading-5 ${aligned ? "rounded-xl bg-[#f8f9fa] px-4 py-3 text-[#727782]" : "text-[#8a9099]"}`}
      >
        {note}
      </p>
    </article>
  );
}

export default function GoogleAnalyticsJourneys({
  purchaseJourney = [],
  leadJourney = [],
  inquiryJourney = [],
  tracking = {},
  journeyType,
}) {
  const leadMode = journeyType === "lead-generation";
  const inquiryMode = journeyType === "enquiry-generation";
  return (
    <section className="mt-6 min-w-0">
      {leadMode ? (
        <JourneyPanel
          title="Lead generation journey"
          description="Enquiry progression from website session to acquired customer."
          badge="Lead gen"
          badgeClass="bg-amber-50 text-amber-700"
          steps={leadJourney}
          accent="#f29900"
          aligned
          note={
            tracking.leadTrackingGap
              ? "Form submits are present but generate_lead is missing. Add Google's recommended lead event for accurate acquisition reporting."
              : "Qualification, working and conversion stages populate only when the website, CRM or backend sends the matching GA4 lifecycle events."
          }
        />
      ) : inquiryMode ? (
        <JourneyPanel
          title="Enquiry journey"
          description="Progression from a website session to a submitted contact enquiry."
          badge="Enquiry"
          badgeClass="bg-sky-50 text-sky-700"
          steps={inquiryJourney}
          accent="#0288d1"
          aligned
          note={
            tracking.inquiryEventsDetected
              ? "Form starts use the GA4 form_start event; submitted enquiries use the Yamaha contact event."
              : "No form_start or contact events were detected for this month."
          }
        />
      ) : (
        <JourneyPanel
          title="Purchase journey"
          description="Directional ecommerce funnel from website session to completed purchase."
          badge="Ecommerce"
          badgeClass="bg-emerald-50 text-emerald-700"
          steps={purchaseJourney}
          accent="#0f9d58"
          aligned
          note={
            tracking.checkoutTrackingGap
              ? "Begin checkout is firing but purchase is zero. Check the checkout tags before sharing this funnel."
              : "The journey follows Google's recommended ecommerce events; counts are event based and may differ from a user-deduplicated GA4 Explore funnel."
          }
        />
      )}
    </section>
  );
}
