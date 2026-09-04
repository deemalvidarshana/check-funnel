import {
  formatGaChange,
  formatGaMoney,
  formatGaNumber,
  formatGaPercent,
} from "../../utils/googleAnalyticsFormatters";

const ECOMMERCE_METRICS = [
  {
    key: "sessions",
    label: "Sessions",
    type: "number",
    accent: "#2674ff",
    tint: "#eaf1ff",
    icon: "↗",
  },
  {
    key: "activeUsers",
    label: "Active users",
    type: "number",
    accent: "#16b979",
    tint: "#e4f8ef",
    icon: "◎",
  },
  {
    key: "productViews",
    label: "Product views",
    type: "number",
    accent: "#8c50f6",
    tint: "#f0eaff",
    icon: "◉",
  },
  {
    key: "addToCarts",
    label: "Add to carts",
    type: "number",
    accent: "#ff6a1a",
    tint: "#fff0e7",
    icon: "+",
  },
  {
    key: "checkoutStarts",
    label: "Checkout starts",
    type: "number",
    accent: "#2674ff",
    tint: "#eaf1ff",
    icon: "→",
  },
  {
    key: "purchases",
    label: "Purchases",
    type: "number",
    accent: "#16b979",
    tint: "#e4f8ef",
    icon: "✓",
  },
  {
    key: "purchaseRevenue",
    label: "Purchase revenue",
    type: "money",
    accent: "#8c50f6",
    tint: "#f0eaff",
    icon: "$",
  },
  {
    key: "ecommerceConversionRate",
    label: "Session → purchase",
    type: "percent",
    accent: "#2674ff",
    tint: "#eaf1ff",
    icon: "%",
  },
];

const LEAD_METRICS = [
  {
    key: "sessions",
    label: "Sessions",
    type: "number",
    accent: "#2674ff",
    tint: "#eaf1ff",
    icon: "↗",
  },
  {
    key: "activeUsers",
    label: "Active users",
    type: "number",
    accent: "#16b979",
    tint: "#e4f8ef",
    icon: "◎",
  },
  {
    key: "formSubmits",
    label: "Form submits",
    type: "number",
    accent: "#8c50f6",
    tint: "#f0eaff",
    icon: "✎",
  },
  {
    key: "leads",
    label: "Leads generated",
    type: "number",
    accent: "#ff6a1a",
    tint: "#fff0e7",
    icon: "+",
  },
  {
    key: "qualifiedLeads",
    label: "Qualified leads",
    type: "number",
    accent: "#2674ff",
    tint: "#eaf1ff",
    icon: "◇",
  },
  {
    key: "convertedLeads",
    label: "Converted leads",
    type: "number",
    accent: "#16b979",
    tint: "#e4f8ef",
    icon: "✓",
  },
  {
    key: "visitorToLeadRate",
    label: "Session → lead",
    type: "percent",
    accent: "#8c50f6",
    tint: "#f0eaff",
    icon: "%",
  },
  {
    key: "leadConversionRate",
    label: "Lead → customer rate",
    type: "percent",
    accent: "#2674ff",
    tint: "#eaf1ff",
    icon: "%",
  },
];

const INQUIRY_METRICS = [
  {
    key: "sessions",
    label: "Sessions",
    type: "number",
    accent: "#2674ff",
    tint: "#eaf1ff",
    icon: "↗",
  },
  {
    key: "activeUsers",
    label: "Active users",
    type: "number",
    accent: "#16b979",
    tint: "#e4f8ef",
    icon: "◎",
  },
  {
    key: "screenPageViews",
    label: "Page views",
    type: "number",
    accent: "#8c50f6",
    tint: "#f0eaff",
    icon: "◉",
  },
  {
    key: "engagementRate",
    label: "Engagement rate",
    type: "percent",
    accent: "#ff6a1a",
    tint: "#fff0e7",
    icon: "≈",
  },
  {
    key: "formStarts",
    label: "Form starts",
    type: "number",
    accent: "#2674ff",
    tint: "#eaf1ff",
    icon: "✎",
    group: "enquiry",
  },
  {
    key: "enquiries",
    label: "Enquiries submitted",
    type: "number",
    accent: "#16b979",
    tint: "#e4f8ef",
    icon: "✓",
    group: "enquiry",
  },
  {
    key: "visitorToEnquiryRate",
    label: "Session → enquiry",
    type: "percent",
    accent: "#8c50f6",
    tint: "#f0eaff",
    icon: "%",
    group: "enquiry",
  },
  {
    key: "formStartToEnquiryRate",
    label: "Form completion rate",
    type: "percent",
    accent: "#2674ff",
    tint: "#eaf1ff",
    icon: "✓",
    group: "enquiry",
  },
];

function metricValue(metric, value, currency) {
  if (metric.type === "money") return formatGaMoney(value, currency);
  if (metric.type === "percent") return formatGaPercent(value);
  if (metric.type === "decimal") {
    return formatGaNumber(value, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
  return formatGaNumber(value);
}

function JourneyMetricCards({ metrics, currency, definitions }) {
  return (
    <section className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {definitions.map((metric) => {
        const data = metrics?.[metric.key] || {
          current: 0,
          previous: 0,
          change: 0,
        };
        const change = Number(data.change || 0);
        const positive = metric.inverse ? change <= 0 : change >= 0;
        const progress = Math.min(100, Math.max(5, Math.abs(change) * 3));
        return (
          <article
            key={metric.key}
            className="flex min-w-0 flex-col rounded-2xl border border-[#c2c6d3]/30 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="flex items-center gap-4">
              <span
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-lg font-black"
                style={{ color: metric.accent, backgroundColor: metric.tint }}
              >
                {metric.icon}
              </span>
              <div className="min-w-0">
                <p className="truncate text-[13px] font-bold text-[#727782]">
                  {metric.label}
                </p>
                <p className="mt-0.5 whitespace-nowrap text-2xl font-black tracking-tight text-[#191c1d]">
                  {metricValue(metric, data.current, currency)}
                </p>
              </div>
            </div>
            <div className="mt-5 flex items-center justify-between gap-2 text-[11px] font-bold">
              <span className="truncate text-[#727782]">
                Previous: {metricValue(metric, data.previous, currency)}
              </span>
              <span
                className={
                  positive ? "shrink-0 text-green-600" : "shrink-0 text-red-500"
                }
              >
                {change >= 0 ? "↑" : "↓"} {formatGaChange(change)}
              </span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#f1f5f9]">
              <div
                className="h-full rounded-full bg-[#2563eb]"
                style={{ width: `${progress}%` }}
              />
            </div>
          </article>
        );
      })}
    </section>
  );
}

export default function GoogleAnalyticsMetricCards({
  metrics,
  currency,
  journeyType,
}) {
  const metricDefinitions =
    journeyType === "lead-generation"
      ? LEAD_METRICS
      : journeyType === "enquiry-generation"
        ? INQUIRY_METRICS
        : ECOMMERCE_METRICS;
  return (
    <JourneyMetricCards
      metrics={metrics}
      currency={currency}
      definitions={metricDefinitions}
    />
  );
}
