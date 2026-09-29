import { useRef } from "react";
import PreviewEditableText from "../PreviewEditableText";
import {
  campaignFields,
  formatCampaignObjective,
  summableCampaignFields,
} from "./campaignFields";
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
  if (field.key === "objective") return formatCampaignObjective(value);
  return field.type === "number" ? number(value) : value || "—";
}
export default function CampaignRankingReportSlide({
  paidData,
  settings,
  rows = [],
  allRows = [],
  pageIndex = 0,
  pageCount = 1,
  objective,
  fieldKeys,
  editKey = "campaign-table",
  textEdits = {},
  columnWidthEdits = {},
  onTextEdit = () => {},
  onColumnWidthsEdit = () => {},
}) {
  const fields = (fieldKeys || settings.paidCampaignFields || [])
    .map((key) => campaignFields.find((field) => field.key === key))
    .filter(Boolean);
  const showTotal =
    pageIndex === pageCount - 1 &&
    settings.paidCampaignObjectiveTotals === false;
  const defaultColumnWidths = fields.map((field) => {
      if (field.key === "name") return "1.8fr";
      if (field.key === "objective" || field.key === "resultType")
        return "1.45fr";
      return "1fr";
    }).map((value) => Number.parseFloat(value));
  const columnWidths =
    columnWidthEdits[editKey]?.length === fields.length
      ? columnWidthEdits[editKey]
      : defaultColumnWidths;
  const columnTemplate = columnWidths.map((width) => `${width}fr`).join(" ");
  const resizeRef = useRef(null);
  const edited = (key, fallback) =>
    Object.prototype.hasOwnProperty.call(textEdits, `${editKey}:${key}`)
      ? textEdits[`${editKey}:${key}`]
      : fallback;
  const commit = (key, value) => onTextEdit(`${editKey}:${key}`, value);
  const startColumnResize = (event, index) => {
    event.preventDefault();
    event.stopPropagation();
    const grid = event.currentTarget.closest("[data-campaign-header]");
    resizeRef.current = {
      index,
      startX: event.clientX,
      startWidths: [...columnWidths],
      gridWidth: grid?.getBoundingClientRect().width || 1,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const resizeColumn = (event) => {
    const resizeState = resizeRef.current;
    if (!resizeState) return;
    const { index, startX, startWidths, gridWidth } = resizeState;
    const totalWeight = startWidths.reduce((total, width) => total + width, 0);
    const delta = ((event.clientX - startX) / gridWidth) * totalWeight;
    const left = Math.max(0.45, startWidths[index] + delta);
    const right = Math.max(0.45, startWidths[index + 1] - delta);
    const appliedDelta = left - startWidths[index];
    const next = [...startWidths];
    next[index] = left;
    next[index + 1] = Math.max(0.45, startWidths[index + 1] - appliedDelta);
    if (right === 0.45 && next[index + 1] !== right) return;
    onColumnWidthsEdit(editKey, next);
  };
  const stopColumnResize = (event) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
    resizeRef.current = null;
  };
  const sum = (sourceRows, key) =>
    sourceRows.reduce((total, row) => total + Number(row[key] || 0), 0);
  const divide = (numerator, denominator, multiplier = 1) =>
    denominator ? (numerator / denominator) * multiplier : null;
  const aggregate = (field, sourceRows, label = "Total") => {
    const objectives = [
      ...new Set(sourceRows.map((row) => String(row.objective || "Other"))),
    ];
    const mixedObjectives = objectives.length > 1;
    if (field.key === "name") return label;
    if (field.key === "objective" && sourceRows.length) {
      return objectives.length === 1 ? objectives[0] : "—";
    }
    if (
      mixedObjectives &&
      ["results", "resultType", "costPerResult"].includes(field.key)
    )
      return "—";
    if (summableCampaignFields.has(field.key))
      return sum(sourceRows, field.key);
    if (field.key === "costPerResult")
      return divide(sum(sourceRows, "spend"), sum(sourceRows, "results"));
    if (field.key === "ctr")
      return divide(
        sum(sourceRows, "clicks"),
        sum(sourceRows, "impressions"),
        100,
      );
    if (field.key === "linkCtr")
      return divide(
        sum(sourceRows, "linkClicks"),
        sum(sourceRows, "impressions"),
        100,
      );
    if (field.key === "cpm")
      return divide(
        sum(sourceRows, "spend"),
        sum(sourceRows, "impressions"),
        1000,
      );
    if (field.key === "cpp")
      return divide(
        sum(sourceRows, "spend"),
        sum(sourceRows, "reach"),
        1000,
      );
    if (field.key === "frequency")
      return divide(
        sum(sourceRows, "impressions"),
        sum(sourceRows, "reach"),
      );
    if (field.key === "cpc")
      return divide(sum(sourceRows, "spend"), sum(sourceRows, "clicks"));
    if (field.key === "costPerLinkClick")
      return divide(
        sum(sourceRows, "spend"),
        sum(sourceRows, "linkClicks"),
      );
    if (field.key === "costPerLandingPageView")
      return divide(
        sum(sourceRows, "spend"),
        sum(sourceRows, "landingPageViews"),
      );
    if (field.key === "costPerLead")
      return divide(sum(sourceRows, "spend"), sum(sourceRows, "leads"));
    if (field.key === "costPerMessagingConversation")
      return divide(
        sum(sourceRows, "spend"),
        sum(sourceRows, "messagingConversations"),
      );
    if (field.key === "purchaseRoas")
      return divide(
        sum(sourceRows, "purchaseValue"),
        sum(sourceRows, "spend"),
      );
    if (field.key === "cpa")
      return divide(
        sum(sourceRows, "spend"),
        sum(sourceRows, "conversions"),
      );
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
          <PreviewEditableText
            value={edited("title", objective
            ? settings.paidCampaignObjectiveTotalsOnly
              ? `${formatCampaignObjective(objective)} Performance Summary`
              : `${formatCampaignObjective(objective)} Campaign Performance`
            : "Campaign Performance")}
            onCommit={(value) => commit("title", value)}
          />
        </h2>
        <p className="mt-1 text-sm font-semibold text-slate-500">
          <PreviewEditableText
            value={edited("subtitle", `${settings.paidCampaignObjectiveTotalsOnly
            ? "Calculated total using this objective's selected metrics"
            : "Campaign results using this objective's selected metrics"}
            ${pageCount > 1 ? ` · ${pageIndex + 1} of ${pageCount}` : ""}`.trim())}
            onCommit={(value) => commit("subtitle", value)}
          />
        </p>
      </div>
      {fields.length ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200">
          <div
            data-campaign-header
            className="grid bg-slate-100 text-[8.5px] font-extrabold uppercase leading-tight text-slate-500"
            style={{
              gridTemplateColumns: columnTemplate,
            }}
          >
            {fields.map((field, fieldIndex) => (
              <span
                key={field.key}
                className="relative border-l border-slate-200 px-2.5 py-3.5 first:border-l-0"
              >
                <PreviewEditableText
                  value={edited(`header:${field.key}`, field.label)}
                  onCommit={(value) => commit(`header:${field.key}`, value)}
                />
                {fieldIndex < fields.length - 1 && (
                  <span
                    role="separator"
                    aria-label={`Resize ${field.label} column`}
                    title="Drag to resize columns"
                    onPointerDown={(event) => startColumnResize(event, fieldIndex)}
                    onPointerMove={resizeColumn}
                    onPointerUp={stopColumnResize}
                    onPointerCancel={stopColumnResize}
                    className="absolute -right-1 top-0 z-10 h-full w-2 cursor-col-resize touch-none opacity-0 hover:bg-blue-400/40 hover:opacity-100"
                  />
                )}
              </span>
            ))}
          </div>
          {rows.map((row, index) => (
            <div
              key={row.id || index}
              className={`grid text-[10px] text-slate-700 ${row.__objectiveTotal ? "border-t-2 border-[#003870]/20 bg-[#003870]/5 font-extrabold" : "border-t border-slate-100 font-semibold"}`}
              style={{
                gridTemplateColumns: columnTemplate,
              }}
            >
              {fields.map((field) => {
                const originalValue = format(
                  row.__objectiveTotal
                    ? aggregate(
                        field,
                        row.__groupRows || [],
                        `${format(row.objective, { type: "text", key: "objective" })} total`,
                      )
                    : row[field.key],
                  field,
                  paidData?.account?.currency,
                );
                const rowKey = row.id || `${pageIndex}-${index}`;
                return (
                <span
                  key={field.key}
                  className={`min-w-0 border-l border-slate-100 px-2.5 py-3.5 first:border-l-0 ${field.key === "name" ? "line-clamp-2 font-extrabold leading-4" : "truncate"}`}
                >
                  <PreviewEditableText
                    value={edited(`row:${rowKey}:${field.key}`, originalValue)}
                    onCommit={(value) =>
                      commit(`row:${rowKey}:${field.key}`, value)
                    }
                  />
                </span>
                );
              })}
            </div>
          ))}
          {showTotal && (
            <div
              className="grid border-t-2 border-slate-300 bg-slate-100 text-[10px] font-extrabold text-slate-800"
              style={{
                gridTemplateColumns: columnTemplate,
              }}
            >
              {fields.map((field) => {
                const originalValue = format(
                  aggregate(field, allRows),
                  field,
                  paidData?.account?.currency,
                );
                return (
                <span
                  key={field.key}
                  className="truncate border-l border-slate-200 px-2.5 py-3.5 first:border-l-0"
                >
                  <PreviewEditableText
                    value={edited(`grand-total:${field.key}`, originalValue)}
                    onCommit={(value) =>
                      commit(`grand-total:${field.key}`, value)
                    }
                  />
                </span>
                );
              })}
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
