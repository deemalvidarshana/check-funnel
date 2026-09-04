import {
  formatGaNumber,
  formatGaPercent,
} from "../../utils/googleAnalyticsFormatters";

export default function GoogleAnalyticsInquiryLandingPages({ rows = [] }) {
  if (rows.length === 0) {
    return (
      <section className="mt-6 rounded-3xl border border-[#c2c6d3]/30 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-extrabold text-[#191c1d]">
          Landing-page enquiry performance
        </h2>
        <p className="mt-1 text-[11px] font-semibold text-[#8a9099]">
          No landing-page data was returned for this month.
        </p>
      </section>
    );
  }

  return (
    <section className="mt-6 rounded-3xl border border-[#c2c6d3]/30 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-extrabold text-[#191c1d]">
            Landing-page enquiry performance
          </h2>
          <p className="mt-1 text-xs font-semibold text-[#727782]">
            Entry pages ranked by submitted enquiries, with exact page viewing
            and session-level enquiry attribution.
          </p>
        </div>
        <span className="rounded-full bg-sky-50 px-3 py-1.5 text-[9px] font-black uppercase tracking-wider text-sky-700">
          Landing pages
        </span>
      </div>
      <div className="mt-5 overflow-x-auto rounded-2xl border border-[#c2c6d3]/25">
        <table className="w-full min-w-[1060px] text-left">
          <thead className="bg-[#f8f9fa]">
            <tr className="text-[11px] font-extrabold text-[#5d6470]">
              <th className="border-b border-[#e5e7eb] px-4 py-3">
                Landing page
              </th>
              <th className="border-b border-[#e5e7eb] px-4 py-3 text-right">
                Page users
              </th>
              <th className="border-b border-[#e5e7eb] px-4 py-3 text-right">
                Entry sessions
              </th>
              <th className="border-b border-[#e5e7eb] px-4 py-3 text-right">
                Page views
              </th>
              <th className="border-b border-[#e5e7eb] px-4 py-3 text-right">
                Form starts
              </th>
              <th className="border-b border-[#e5e7eb] px-4 py-3 text-right">
                Enquiries
              </th>
              <th className="border-b border-[#e5e7eb] px-4 py-3 text-right">
                Entry → enquiry
              </th>
              <th className="border-b border-[#e5e7eb] px-4 py-3 text-right">
                Completion
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 12).map((row, index) => {
              const sessions = Number(row.sessions || 0);
              const pageUsers = Number(row.pageUsers || 0);
              const pageViews = Number(row.screenPageViews || 0);
              const formStarts = Number(row.formStarts || 0);
              const enquiries = Number(row.enquiries || 0);
              return (
                <tr
                  key={`${row.landingPagePlusQueryString}-${index}`}
                  className="text-xs transition hover:bg-[#f8f9fa]/80"
                >
                  <td className="max-w-[320px] border-b border-[#edf0f2] px-4 py-3 font-extrabold text-[#354052]">
                    <span
                      className="block truncate"
                      title={row.landingPagePlusQueryString}
                    >
                      {row.landingPagePlusQueryString || "(not set)"}
                    </span>
                  </td>
                  <td className="border-b border-[#edf0f2] px-4 py-3 text-right font-bold text-[#727782]">
                    {formatGaNumber(pageUsers)}
                  </td>
                  <td className="border-b border-[#edf0f2] px-4 py-3 text-right font-bold text-[#727782]">
                    {formatGaNumber(sessions)}
                  </td>
                  <td className="border-b border-[#edf0f2] px-4 py-3 text-right font-bold text-[#727782]">
                    {formatGaNumber(pageViews)}
                  </td>
                  <td className="border-b border-[#edf0f2] px-4 py-3 text-right font-bold text-[#727782]">
                    {formatGaNumber(formStarts)}
                  </td>
                  <td className="border-b border-[#edf0f2] px-4 py-3 text-right font-black text-sky-700">
                    {formatGaNumber(enquiries)}
                  </td>
                  <td className="border-b border-[#edf0f2] px-4 py-3 text-right font-black text-[#0288d1]">
                    {formatGaPercent(sessions ? enquiries / sessions : 0)}
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
      <div className="mt-4 grid gap-2 rounded-2xl bg-[#f7f9fc] px-4 py-3 text-[10px] font-semibold leading-5 text-[#727782] sm:grid-cols-2">
        <p>
          <span className="font-black text-[#354052]">Page users/views:</span>{" "}
          people and views recorded on that exact page path.
        </p>
        <p>
          <span className="font-black text-[#354052]">Entry sessions:</span>{" "}
          visits that started there; their enquiry may be submitted later on a
          product or contact page.
        </p>
      </div>
    </section>
  );
}
