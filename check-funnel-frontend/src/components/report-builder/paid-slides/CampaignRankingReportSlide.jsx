import { campaignFields, summableCampaignFields } from "./campaignFields";
const number = (value) =>
  new Intl.NumberFormat("en", { maximumFractionDigits: 0 }).format(
    Number(value || 0),
  );
function format(value, field, currency) {
  if (value === null || value === undefined || value === "—") return "—";
  const numericValue = Number(value);
  if (
    field.type !== "text" &&
    field.type !== "status" &&
    !Number.isFinite(numericValue)
  )
    return "—";
  if (field.type === "money")
    return new Intl.NumberFormat("en", {
      style: "currency",
      currency: currency || "USD",
      minimumFractionDigits: ["spend", "budget", "purchaseValue"].includes(
        field.key,
      )
        ? 0
        : 2,
      maximumFractionDigits: ["spend", "budget", "purchaseValue"].includes(
        field.key,
      )
        ? 0
        : 2,
    }).format(numericValue);
  if (field.type === "percent") return `${numericValue.toFixed(2)}%`;
  if (field.type === "decimal") return numericValue.toFixed(2);
  if (field.key === "objective")
    return String(value)
      .replace(/^OUTCOME_/, "")
      .replaceAll("_", " ")
      .toLowerCase()
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  return field.type === "number" ? number(value) : value || "—";
}
export default function CampaignRankingReportSlide({
  paidData,
  settings,
  rows = [],
  allRows = [],
  pageIndex = 0,
  pageCount = 1,
}) {
  const fields = (settings.paidCampaignFields || [])
    .map((key) => campaignFields.find((field) => field.key === key))
    .filter(Boolean);
  const showTotal = pageIndex === pageCount - 1;
  const columnTemplate = fields
    .map((field) => {
      if (field.key === "name") return "1.8fr";
      if (field.key === "objective" || field.key === "resultType")
        return "1.45fr";
      return "1fr";
    })
    .join(" ");
  const sum = (key) =>
    allRows.reduce((total, row) => total + Number(row[key] || 0), 0);
  const divide = (numerator, denominator, multiplier = 1) =>
    denominator ? (numerator / denominator) * multiplier : null;
  const total = (field) => {
    if (field.key === "name") return "Total";
    if (summableCampaignFields.has(field.key)) return sum(field.key);
    if (field.key === "costPerResult")
      return divide(sum("spend"), sum("results"));
    if (field.key === "ctr")
      return divide(sum("clicks"), sum("impressions"), 100);
    if (field.key === "linkCtr")
      return divide(sum("linkClicks"), sum("impressions"), 100);
    if (field.key === "cpm")
      return divide(sum("spend"), sum("impressions"), 1000);
    if (field.key === "cpp") return divide(sum("spend"), sum("reach"), 1000);
    if (field.key === "frequency")
      return divide(sum("impressions"), sum("reach"));
    if (field.key === "cpc") return divide(sum("spend"), sum("clicks"));
    if (field.key === "costPerLinkClick")
      return divide(sum("spend"), sum("linkClicks"));
    if (field.key === "costPerLandingPageView")
      return divide(sum("spend"), sum("landingPageViews"));
    if (field.key === "costPerLead") return divide(sum("spend"), sum("leads"));
    if (field.key === "purchaseRoas")
      return divide(sum("purchaseValue"), sum("spend"));
    if (field.key === "cpa") return divide(sum("spend"), sum("conversions"));
    return "—";
  };
  return (
    <>
      <div className="mb-5">
        <div
          className="mb-2 h-1 w-12 rounded-full"
          style={{ backgroundColor: settings.accent }}
        />
        <h2 className="text-3xl font-black tracking-tight text-slate-900">
          Campaign Ranking
        </h2>
        <p className="mt-1 text-sm font-semibold text-slate-500">
          Custom campaign fields ranked by amount spent
          {pageCount > 1 ? ` · ${pageIndex + 1} of ${pageCount}` : ""}
        </p>
      </div>
      {fields.length ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200">
          <div
            className="grid bg-slate-100 text-[8.5px] font-extrabold uppercase leading-tight text-slate-500"
            style={{
              gridTemplateColumns: columnTemplate,
            }}
          >
            {fields.map((field) => (
              <span
                key={field.key}
                className="border-l border-slate-200 px-2.5 py-3.5 first:border-l-0"
              >
                {field.label}
              </span>
            ))}
          </div>
          {rows.map((row, index) => (
            <div
              key={row.id || index}
              className="grid border-t border-slate-100 text-[10px] font-semibold text-slate-700"
              style={{
                gridTemplateColumns: columnTemplate,
              }}
            >
              {fields.map((field) => (
                <span
                  key={field.key}
                  className={`min-w-0 border-l border-slate-100 px-2.5 py-3.5 first:border-l-0 ${field.key === "name" ? "line-clamp-2 font-extrabold leading-4" : "truncate"}`}
                >
                  {format(row[field.key], field, paidData?.account?.currency)}
                </span>
              ))}
            </div>
          ))}
          {showTotal && (
            <div
              className="grid border-t-2 border-slate-300 bg-slate-100 text-[10px] font-extrabold text-slate-800"
              style={{
                gridTemplateColumns: columnTemplate,
              }}
            >
              {fields.map((field) => (
                <span
                  key={field.key}
                  className="truncate border-l border-slate-200 px-2.5 py-3.5 first:border-l-0"
                >
                  {format(total(field), field, paidData?.account?.currency)}
                </span>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="flex h-72 items-center justify-center rounded-2xl bg-slate-50 text-sm font-bold text-slate-400">
          Add campaign fields from the editor.
        </div>
      )}
    </>
  );
}
