import { useState } from "react";
import {
  formatGaMoney,
  formatGaNumber,
  formatGaPercent,
} from "../../utils/googleAnalyticsFormatters";

function EmptyRows({ children }) {
  return (
    <div className="flex min-h-44 items-center justify-center px-5 text-center text-xs font-bold leading-5 text-[#8a9099]">
      {children}
    </div>
  );
}

function BreakdownToggle({ sourceMode, setSourceMode, colorClass }) {
  return (
    <div className="flex shrink-0 rounded-full bg-[#f3f4f5] p-1">
      <button
        type="button"
        onClick={() => setSourceMode(false)}
        className={`rounded-full px-3 py-1.5 text-[9px] font-black uppercase tracking-wider transition ${sourceMode ? "text-[#727782]" : `bg-white shadow-sm ${colorClass}`}`}
      >
        Channel
      </button>
      <button
        type="button"
        onClick={() => setSourceMode(true)}
        className={`rounded-full px-3 py-1.5 text-[9px] font-black uppercase tracking-wider transition ${sourceMode ? `bg-white shadow-sm ${colorClass}` : "text-[#727782]"}`}
      >
        Source / medium
      </button>
    </div>
  );
}

function PanelHeader({
  title,
  description,
  sourceMode,
  setSourceMode,
  colorClass,
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h2 className="text-lg font-extrabold text-[#191c1d]">{title}</h2>
        <p className="mt-1 text-xs font-semibold text-[#727782]">
          {description}
        </p>
      </div>
      <BreakdownToggle
        sourceMode={sourceMode}
        setSourceMode={setSourceMode}
        colorClass={colorClass}
      />
    </div>
  );
}

function EcommerceChannels({ channelRows, sourceRows, currency }) {
  const [sourceMode, setSourceMode] = useState(false);
  const rows = sourceMode ? sourceRows : channelRows;
  const dimensionKey = sourceMode
    ? "sessionSourceMedium"
    : "sessionDefaultChannelGroup";

  return (
    <article className="min-w-0 rounded-3xl border border-[#c2c6d3]/30 bg-white p-5 shadow-sm sm:p-6">
      <PanelHeader
        title="Ecommerce performance by channel"
        description="Acquisition sources ranked by purchase activity and revenue."
        sourceMode={sourceMode}
        setSourceMode={setSourceMode}
        colorClass="text-emerald-700"
      />
      {rows.length === 0 ? (
        <EmptyRows>
          No ecommerce channel activity was recorded for this period.
        </EmptyRows>
      ) : (
        <div className="mt-5 overflow-x-auto rounded-2xl border border-[#c2c6d3]/25">
          <table className="w-full min-w-[900px] text-left">
            <thead className="bg-[#f8f9fa]">
              <tr className="text-[11px] font-extrabold text-[#5d6470]">
                <th className="border-b border-[#e5e7eb] px-4 py-3">
                  {sourceMode ? "Source / medium" : "Channel"}
                </th>
                <th className="border-b border-[#e5e7eb] px-4 py-3 text-right">
                  Sessions
                </th>
                <th className="border-b border-[#e5e7eb] px-4 py-3 text-right">
                  Engagement
                </th>
                <th className="border-b border-[#e5e7eb] px-4 py-3 text-right">
                  Add to carts
                </th>
                <th className="border-b border-[#e5e7eb] px-4 py-3 text-right">
                  Purchases
                </th>
                <th className="border-b border-[#e5e7eb] px-4 py-3 text-right">
                  Revenue
                </th>
                <th className="border-b border-[#e5e7eb] px-4 py-3 text-right">
                  Session → purchase
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => {
                const sessions = Number(row.sessions || 0);
                const purchases = Number(
                  row.purchases || row.transactions || 0,
                );
                return (
                  <tr
                    key={`${row[dimensionKey]}-${index}`}
                    className="text-xs transition hover:bg-[#f8f9fa]/80"
                  >
                    <td className="border-b border-[#edf0f2] px-4 py-3 font-extrabold text-[#354052]">
                      {row[dimensionKey] || "Unassigned"}
                    </td>
                    <td className="border-b border-[#edf0f2] px-4 py-3 text-right font-bold text-[#727782]">
                      {formatGaNumber(sessions)}
                    </td>
                    <td className="border-b border-[#edf0f2] px-4 py-3 text-right font-bold text-[#727782]">
                      {formatGaPercent(row.engagementRate)}
                    </td>
                    <td className="border-b border-[#edf0f2] px-4 py-3 text-right font-bold text-[#727782]">
                      {formatGaNumber(row.addToCarts)}
                    </td>
                    <td className="border-b border-[#edf0f2] px-4 py-3 text-right font-black text-emerald-700">
                      {formatGaNumber(purchases)}
                    </td>
                    <td className="border-b border-[#edf0f2] px-4 py-3 text-right font-black text-emerald-700">
                      {formatGaMoney(row.totalRevenue, currency)}
                    </td>
                    <td className="border-b border-[#edf0f2] px-4 py-3 text-right font-black text-[#16845b]">
                      {formatGaPercent(sessions ? purchases / sessions : 0)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </article>
  );
}

function LeadChannels({ channelRows, sourceRows }) {
  const [sourceMode, setSourceMode] = useState(false);
  const rows = sourceMode ? sourceRows : channelRows;
  const dimensionKey = sourceMode
    ? "sessionSourceMedium"
    : "sessionDefaultChannelGroup";

  return (
    <article className="min-w-0 rounded-3xl border border-[#c2c6d3]/30 bg-white p-5 shadow-sm sm:p-6">
      <PanelHeader
        title="Lead performance by channel"
        description="Sources that acquire leads and progress them toward conversion."
        sourceMode={sourceMode}
        setSourceMode={setSourceMode}
        colorClass="text-amber-700"
      />
      {rows.length === 0 ? (
        <EmptyRows>
          No standard lead events were detected for this period.
        </EmptyRows>
      ) : (
        <div className="mt-5 overflow-x-auto rounded-2xl border border-[#c2c6d3]/25">
          <table className="w-full min-w-[860px] text-left">
            <thead className="bg-[#f8f9fa]">
              <tr className="text-[11px] font-extrabold text-[#5d6470]">
                <th className="border-b border-[#e5e7eb] px-4 py-3">
                  {sourceMode ? "Source / medium" : "Channel"}
                </th>
                <th className="border-b border-[#e5e7eb] px-4 py-3 text-right">
                  Sessions
                </th>
                <th className="border-b border-[#e5e7eb] px-4 py-3 text-right">
                  Form submits
                </th>
                <th className="border-b border-[#e5e7eb] px-4 py-3 text-right">
                  Leads
                </th>
                <th className="border-b border-[#e5e7eb] px-4 py-3 text-right">
                  Qualified
                </th>
                <th className="border-b border-[#e5e7eb] px-4 py-3 text-right">
                  Converted
                </th>
                <th className="border-b border-[#e5e7eb] px-4 py-3 text-right">
                  Lead → customer
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => {
                const leads = Number(row.leads || row.formSubmits || 0);
                const converted = Number(row.convertedLeads || 0);
                return (
                  <tr
                    key={`${row[dimensionKey]}-${index}`}
                    className="text-xs transition hover:bg-[#f8f9fa]/80"
                  >
                    <td className="border-b border-[#edf0f2] px-4 py-3 font-extrabold text-[#354052]">
                      {row[dimensionKey] || "Unassigned"}
                    </td>
                    <td className="border-b border-[#edf0f2] px-4 py-3 text-right font-bold text-[#727782]">
                      {formatGaNumber(row.sessions)}
                    </td>
                    <td className="border-b border-[#edf0f2] px-4 py-3 text-right font-bold text-[#727782]">
                      {formatGaNumber(row.formSubmits)}
                    </td>
                    <td className="border-b border-[#edf0f2] px-4 py-3 text-right font-black text-amber-700">
                      {formatGaNumber(row.leads)}
                    </td>
                    <td className="border-b border-[#edf0f2] px-4 py-3 text-right font-bold text-[#727782]">
                      {formatGaNumber(row.qualifiedLeads)}
                    </td>
                    <td className="border-b border-[#edf0f2] px-4 py-3 text-right font-black text-amber-700">
                      {formatGaNumber(converted)}
                    </td>
                    <td className="border-b border-[#edf0f2] px-4 py-3 text-right font-black text-[#a95800]">
                      {formatGaPercent(leads ? converted / leads : 0)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </article>
  );
}

function InquiryChannels({ channelRows, sourceRows }) {
  const [sourceMode, setSourceMode] = useState(false);
  const rows = sourceMode ? sourceRows : channelRows;
  const dimensionKey = sourceMode
    ? "sessionSourceMedium"
    : "sessionDefaultChannelGroup";

  return (
    <article className="min-w-0 rounded-3xl border border-[#c2c6d3]/30 bg-white p-5 shadow-sm sm:p-6">
      <PanelHeader
        title="Enquiries by channel"
        description="Channels that bring visitors who start and submit enquiry forms."
        sourceMode={sourceMode}
        setSourceMode={setSourceMode}
        colorClass="text-sky-700"
      />
      {rows.length === 0 ? (
        <EmptyRows>
          No form-start or contact events were detected for this period.
        </EmptyRows>
      ) : (
        <div className="mt-5 overflow-x-auto rounded-2xl border border-[#c2c6d3]/25">
          <table className="w-full min-w-[620px] text-left">
            <thead className="bg-[#f8f9fa]">
              <tr className="text-[11px] font-extrabold text-[#5d6470]">
                <th className="border-b border-[#e5e7eb] px-4 py-3">
                  {sourceMode ? "Source / medium" : "Channel"}
                </th>
                <th className="border-b border-[#e5e7eb] px-4 py-3 text-right">
                  Sessions
                </th>
                <th className="border-b border-[#e5e7eb] px-4 py-3 text-right">
                  Form starts
                </th>
                <th className="border-b border-[#e5e7eb] px-4 py-3 text-right">
                  Enquiries
                </th>
                <th className="border-b border-[#e5e7eb] px-4 py-3 text-right">
                  Completion
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => {
                const formStarts = Number(row.formStarts || 0);
                const enquiries = Number(row.enquiries || 0);
                return (
                  <tr
                    key={`${row[dimensionKey]}-${index}`}
                    className="text-xs transition hover:bg-[#f8f9fa]/80"
                  >
                    <td className="border-b border-[#edf0f2] px-4 py-3 font-extrabold text-[#354052]">
                      {row[dimensionKey] || "Unassigned"}
                    </td>
                    <td className="border-b border-[#edf0f2] px-4 py-3 text-right font-bold text-[#727782]">
                      {formatGaNumber(row.sessions)}
                    </td>
                    <td className="border-b border-[#edf0f2] px-4 py-3 text-right font-bold text-[#727782]">
                      {formatGaNumber(formStarts)}
                    </td>
                    <td className="border-b border-[#edf0f2] px-4 py-3 text-right font-black text-sky-700">
                      {formatGaNumber(enquiries)}
                    </td>
                    <td className="border-b border-[#edf0f2] px-4 py-3 text-right font-black text-[#00838f]">
                      {formatGaPercent(formStarts ? enquiries / formStarts : 0)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </article>
  );
}

export default function GoogleAnalyticsChannelPanels({
  channels = [],
  ecommerceSources = [],
  leadChannels = [],
  leadSources = [],
  inquiryChannels = [],
  inquirySources = [],
  currency,
  journeyType,
}) {
  return (
    <section className="mt-6 min-w-0">
      {journeyType === "lead-generation" ? (
        <LeadChannels channelRows={leadChannels} sourceRows={leadSources} />
      ) : journeyType === "enquiry-generation" ? (
        <InquiryChannels
          channelRows={inquiryChannels}
          sourceRows={inquirySources}
        />
      ) : (
        <EcommerceChannels
          channelRows={channels}
          sourceRows={ecommerceSources}
          currency={currency}
        />
      )}
    </section>
  );
}
