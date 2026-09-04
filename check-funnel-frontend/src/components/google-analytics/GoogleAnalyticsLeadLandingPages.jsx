import {
  formatGaNumber,
  formatGaPercent,
} from "../../utils/googleAnalyticsFormatters";

export default function GoogleAnalyticsLeadLandingPages({ rows = [] }) {
  return (
    <section className="mt-6 rounded-3xl border border-[#c2c6d3]/30 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-extrabold text-[#191c1d]">
            Landing-page lead performance
          </h2>
          <p className="mt-1 text-xs font-semibold text-[#727782]">
            Entry pages ranked by acquired leads and downstream lead quality.
          </p>
        </div>
        <span className="rounded-full bg-amber-50 px-3 py-1.5 text-[9px] font-black uppercase tracking-wider text-amber-700">
          Landing pages
        </span>
      </div>

      {rows.length === 0 ? (
        <div className="flex min-h-44 items-center justify-center text-center text-xs font-bold text-[#8a9099]">
          No landing-page lead events were detected for this period.
        </div>
      ) : (
        <div className="mt-5 overflow-x-auto rounded-2xl border border-[#c2c6d3]/25">
          <table className="w-full min-w-[1180px] text-left">
            <thead className="bg-[#f8f9fa]">
              <tr className="text-[11px] font-extrabold text-[#5d6470]">
                {[
                  "Landing page",
                  "Page users",
                  "Entry sessions",
                  "Page views",
                  "Form submits",
                  "Leads",
                  "Qualified",
                  "Converted",
                  "Entry → lead",
                  "Lead → customer",
                ].map((label, index) => (
                  <th
                    key={label}
                    className={`border-b border-[#e5e7eb] px-4 py-3 ${index ? "text-right" : ""}`}
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 12).map((row, index) => {
                const sessions = Number(row.sessions || 0);
                const leads = Number(row.leads || row.formSubmits || 0);
                const converted = Number(row.convertedLeads || 0);
                const values = [
                  row.pageUsers,
                  sessions,
                  row.screenPageViews,
                  row.formSubmits,
                  row.leads,
                  row.qualifiedLeads,
                  converted,
                ];
                return (
                  <tr
                    key={`${row.landingPagePlusQueryString}-${index}`}
                    className="text-xs transition hover:bg-[#f8f9fa]/80"
                  >
                    <td className="max-w-[300px] border-b border-[#edf0f2] px-4 py-3 font-extrabold text-[#354052]">
                      <span
                        className="block truncate"
                        title={row.landingPagePlusQueryString}
                      >
                        {row.landingPagePlusQueryString || "(not set)"}
                      </span>
                    </td>
                    {values.map((value, valueIndex) => (
                      <td
                        key={valueIndex}
                        className={`border-b border-[#edf0f2] px-4 py-3 text-right ${valueIndex >= 4 ? "font-black text-amber-700" : "font-bold text-[#727782]"}`}
                      >
                        {formatGaNumber(value)}
                      </td>
                    ))}
                    <td className="border-b border-[#edf0f2] px-4 py-3 text-right font-black text-[#c96c00]">
                      {formatGaPercent(sessions ? leads / sessions : 0)}
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
      <p className="mt-4 rounded-2xl bg-[#f7f9fc] px-4 py-3 text-[10px] font-semibold leading-5 text-[#727782]">
        Entry attribution connects the session’s first page to later lead
        events; lifecycle stages require the matching GA4 events from the CRM or
        backend.
      </p>
    </section>
  );
}
