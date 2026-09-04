import {
  formatGaMoney,
  formatGaNumber,
  formatGaPercent,
} from "../../utils/googleAnalyticsFormatters";

export default function GoogleAnalyticsProductPerformance({
  rows = [],
  currency,
}) {
  const meaningfulRows = rows.filter(
    (row) => row.itemName || row.itemId || Number(row.itemsViewed || 0),
  );

  return (
    <section className="mt-6 rounded-3xl border border-[#c2c6d3]/30 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-extrabold text-[#191c1d]">
            Product journey performance
          </h2>
          <p className="mt-1 text-xs font-semibold text-[#727782]">
            Item-level discovery, cart, checkout, purchase and revenue
            performance.
          </p>
        </div>
        <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-[9px] font-black uppercase tracking-wider text-emerald-700">
          Products
        </span>
      </div>

      {meaningfulRows.length === 0 ? (
        <div className="flex min-h-44 items-center justify-center px-5 text-center text-xs font-bold leading-5 text-[#8a9099]">
          No item-level ecommerce data was detected. Send the GA4 items array
          with view_item, add_to_cart, begin_checkout and purchase events.
        </div>
      ) : (
        <div className="mt-5 overflow-x-auto rounded-2xl border border-[#c2c6d3]/25">
          <table className="w-full min-w-[980px] text-left">
            <thead className="bg-[#f8f9fa]">
              <tr className="text-[11px] font-extrabold text-[#5d6470]">
                <th className="border-b border-[#e5e7eb] px-4 py-3">Product</th>
                <th className="border-b border-[#e5e7eb] px-4 py-3 text-right">
                  Viewed
                </th>
                <th className="border-b border-[#e5e7eb] px-4 py-3 text-right">
                  Added to cart
                </th>
                <th className="border-b border-[#e5e7eb] px-4 py-3 text-right">
                  Checked out
                </th>
                <th className="border-b border-[#e5e7eb] px-4 py-3 text-right">
                  Purchased
                </th>
                <th className="border-b border-[#e5e7eb] px-4 py-3 text-right">
                  View → cart
                </th>
                <th className="border-b border-[#e5e7eb] px-4 py-3 text-right">
                  View → purchase
                </th>
                <th className="border-b border-[#e5e7eb] px-4 py-3 text-right">
                  Item revenue
                </th>
              </tr>
            </thead>
            <tbody>
              {meaningfulRows.slice(0, 15).map((row, index) => {
                const viewed = Number(row.itemsViewed || 0);
                const carted = Number(row.itemsAddedToCart || 0);
                const purchased = Number(row.itemsPurchased || 0);
                return (
                  <tr
                    key={`${row.itemId}-${row.itemName}-${index}`}
                    className="text-xs transition hover:bg-[#f8f9fa]/80"
                  >
                    <td className="max-w-[300px] border-b border-[#edf0f2] px-4 py-3">
                      <p
                        className="truncate font-extrabold text-[#354052]"
                        title={row.itemName}
                      >
                        {row.itemName || "Unnamed product"}
                      </p>
                      {row.itemId && (
                        <p className="mt-1 truncate text-[9px] font-bold text-[#9aa0a9]">
                          {row.itemId}
                        </p>
                      )}
                    </td>
                    <td className="border-b border-[#edf0f2] px-4 py-3 text-right font-bold text-[#727782]">
                      {formatGaNumber(viewed)}
                    </td>
                    <td className="border-b border-[#edf0f2] px-4 py-3 text-right font-bold text-[#727782]">
                      {formatGaNumber(carted)}
                    </td>
                    <td className="border-b border-[#edf0f2] px-4 py-3 text-right font-bold text-[#727782]">
                      {formatGaNumber(row.itemsCheckedOut)}
                    </td>
                    <td className="border-b border-[#edf0f2] px-4 py-3 text-right font-black text-emerald-700">
                      {formatGaNumber(purchased)}
                    </td>
                    <td className="border-b border-[#edf0f2] px-4 py-3 text-right font-black text-[#16845b]">
                      {formatGaPercent(viewed ? carted / viewed : 0)}
                    </td>
                    <td className="border-b border-[#edf0f2] px-4 py-3 text-right font-black text-[#16845b]">
                      {formatGaPercent(viewed ? purchased / viewed : 0)}
                    </td>
                    <td className="border-b border-[#edf0f2] px-4 py-3 text-right font-black text-emerald-700">
                      {formatGaMoney(row.itemRevenue, currency)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
