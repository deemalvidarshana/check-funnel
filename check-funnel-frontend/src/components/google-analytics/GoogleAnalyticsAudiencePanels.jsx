import {
  formatGaMoney,
  formatGaNumber,
  formatGaPercent,
} from "../../utils/googleAnalyticsFormatters";

function Empty({ children }) {
  return (
    <div className="flex min-h-40 items-center justify-center text-center text-xs font-bold text-[#8a9099]">
      {children}
    </div>
  );
}

function Lifecycle({ rows, currency, journeyType }) {
  const leadMode = journeyType === "lead-generation";
  const inquiryMode = journeyType === "enquiry-generation";
  const total =
    rows.reduce((sum, row) => sum + Number(row.activeUsers || 0), 0) || 1;
  return (
    <article className="rounded-3xl border border-[#c2c6d3]/30 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-lg font-extrabold text-[#191c1d]">
        New vs. returning
      </h2>
      <p className="mt-1 text-xs font-semibold text-[#727782]">
        {leadMode
          ? "Audience mix and key-event contribution."
          : inquiryMode
            ? "New and returning visitors within the enquiry audience."
            : "Customer mix and purchase contribution."}
      </p>
      {rows.length === 0 ? (
        <Empty>No lifecycle data available.</Empty>
      ) : (
        <div className="mt-6 space-y-4">
          {rows.map((row, index) => {
            const share = (Number(row.activeUsers || 0) / total) * 100;
            const color = index % 2 === 0 ? "#1a73e8" : "#7c4dff";
            return (
              <div
                key={row.newVsReturning}
                className="rounded-2xl bg-[#f8f9fa] p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-black capitalize text-[#354052]">
                      {row.newVsReturning || "Unknown"} users
                    </p>
                    <p className="mt-1 text-[10px] font-bold text-[#8a9099]">
                      {leadMode
                        ? `${formatGaNumber(row.keyEvents)} key events`
                        : inquiryMode
                          ? `${formatGaNumber(row.activeUsers)} active users`
                          : `${formatGaNumber(row.transactions)} transactions · ${formatGaMoney(row.totalRevenue, currency)}`}
                    </p>
                  </div>
                  <span className="text-sm font-black" style={{ color }}>
                    {share.toFixed(1)}%
                  </span>
                </div>
                <div className="mt-3 h-2 rounded-full bg-white">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${share}%`, backgroundColor: color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </article>
  );
}

function Devices({ rows, currency, journeyType }) {
  const leadMode = journeyType === "lead-generation";
  const inquiryMode = journeyType === "enquiry-generation";
  return (
    <article className="rounded-3xl border border-[#c2c6d3]/30 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-lg font-extrabold text-[#191c1d]">
        Device performance
      </h2>
      <p className="mt-1 text-xs font-semibold text-[#727782]">
        {inquiryMode
          ? "Sessions, active users and engagement by device category."
          : `Traffic quality and ${leadMode ? "key events" : "revenue"} by device category.`}
      </p>
      {rows.length === 0 ? (
        <Empty>No device data available.</Empty>
      ) : (
        <div className="mt-5 space-y-3">
          {rows.map((row) => (
            <div
              key={row.deviceCategory}
              className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 rounded-2xl border border-[#edf0f3] px-4 py-3.5"
            >
              <div>
                <p className="text-xs font-black capitalize text-[#354052]">
                  {row.deviceCategory || "Unknown"}
                </p>
                <p className="mt-1 text-[10px] font-bold text-[#8a9099]">
                  {formatGaNumber(row.sessions)} sessions ·{" "}
                  {formatGaPercent(row.engagementRate)} engaged
                </p>
              </div>
              <p
                className={`self-center text-xs font-black ${leadMode ? "text-amber-700" : inquiryMode ? "text-sky-700" : "text-emerald-700"}`}
              >
                {leadMode
                  ? `${formatGaNumber(row.keyEvents)} events`
                  : inquiryMode
                    ? `${formatGaNumber(row.activeUsers)} users`
                    : formatGaMoney(row.totalRevenue, currency)}
              </p>
            </div>
          ))}
        </div>
      )}
    </article>
  );
}

function TopPages({ rows, journeyType }) {
  const inquiryMode = journeyType === "enquiry-generation";
  const max = Math.max(
    ...rows.map((row) => Number(row.screenPageViews || 0)),
    1,
  );
  return (
    <article className="rounded-3xl border border-[#c2c6d3]/30 bg-white p-5 shadow-sm sm:p-6 xl:col-span-2 2xl:col-span-1">
      <h2 className="text-lg font-extrabold text-[#191c1d]">
        {journeyType === "lead-generation"
          ? "Top content pages"
          : inquiryMode
            ? "Most-viewed pages"
            : "Top viewed pages"}
      </h2>
      <p className="mt-1 text-xs font-semibold text-[#727782]">
        {journeyType === "lead-generation"
          ? "Most-viewed pages supporting discovery and enquiry intent."
          : inquiryMode
            ? "Page views only; this list does not attribute form starts or enquiries."
            : "Pages receiving the most views in the selected month."}
      </p>
      {rows.length === 0 ? (
        <Empty>No page-view data available.</Empty>
      ) : (
        <div className="mt-5 space-y-4">
          {rows.slice(0, 8).map((row, index) => (
            <div key={`${row.pageTitle}-${index}`}>
              <div className="mb-2 flex items-center justify-between gap-3">
                <span
                  className="min-w-0 truncate text-[11px] font-extrabold text-[#354052]"
                  title={row.pageTitle}
                >
                  {index + 1}. {row.pageTitle || "Untitled page"}
                </span>
                <span className="shrink-0 text-[10px] font-black text-[#003870]">
                  {formatGaNumber(row.screenPageViews)} views
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-[#f0f2f4]">
                <div
                  className="h-full rounded-full bg-[#1a73e8]"
                  style={{
                    width: `${(Number(row.screenPageViews || 0) / max) * 100}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </article>
  );
}

export default function GoogleAnalyticsAudiencePanels({
  lifecycle = [],
  devices = [],
  topPages = [],
  currency,
  journeyType,
}) {
  return (
    <section className="mt-6 grid min-w-0 gap-6 xl:grid-cols-2 2xl:grid-cols-3">
      <Lifecycle
        rows={lifecycle}
        currency={currency}
        journeyType={journeyType}
      />
      <Devices rows={devices} currency={currency} journeyType={journeyType} />
      <TopPages rows={topPages} journeyType={journeyType} />
    </section>
  );
}
