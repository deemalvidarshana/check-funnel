import { useState, useEffect } from "react";

// ---------------- Icon Components ----------------
function MaximizeIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MinimizeIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 14h6v6M20 10h-6V4M14 10l7-7M10 14l-7 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ---------------- Sub-component for Table Content ----------------
// We extract this to ensure logic is 100% identical in both normal and maximized views.
function TableContent({ sortedData, platform, periodLabel, followersCount }) {
  const isInstagram = platform === 'instagram';
  const isTiktok = platform === 'tiktok';



  return (
    <table className="w-full min-w-[1000px] lg:min-w-[1200px] border-collapse text-left">
      <thead>
        {isTiktok ? (
           <tr className="bg-[#f3f4f5] text-[10px] font-bold uppercase tracking-widest text-[#727782]">
            <th className="px-6 py-4 whitespace-nowrap text-left">Upload Date</th>
            <th className="px-4 py-4 text-center border-l border-[#c2c6d3]/20">Total Views</th>
            <th className="px-4 py-4 text-center">Likes</th>
            <th className="px-4 py-4 text-center">Comments</th>
            <th className="px-4 py-4 text-center">Shares</th>
            <th className="px-4 py-4 text-center border-l border-[#c2c6d3]/20 text-[#003870]">ER %</th>
            <th className="px-6 py-4 text-center border-l border-[#c2c6d3]/20">Total Followers</th>
          </tr>
        ) : isInstagram ? (





          <tr className="bg-[#f3f4f5] text-[10px] font-bold uppercase tracking-widest text-[#727782]">
            <th className="px-6 py-4 whitespace-nowrap">{periodLabel}</th>
            <th className="px-4 py-4 text-center border-l border-[#c2c6d3]/20">No of Posts</th>
            <th className="px-4 py-4 text-center">No of Reels</th>
            <th className="px-4 py-4 text-center">No of Stories</th>
            <th className="px-4 py-4 text-center border-l border-[#c2c6d3]/20">Views (Organic)</th>
            <th className="px-4 py-4 text-center">Views (Ads)</th>
            <th className="px-4 py-4 text-center border-l border-[#c2c6d3]/20">Reach (Organic)</th>
            <th className="px-4 py-4 text-center">Reach (Ads)</th>
            <th className="px-4 py-4 text-center border-l border-[#c2c6d3]/20">Content Interactions</th>
            <th className="px-4 py-4 text-center border-l border-[#c2c6d3]/20">New Follows</th>
            <th className="px-4 py-4 text-center">Unfollows</th>
            <th className="px-4 py-4 text-center">Total Followers</th>
          </tr>
        ) : (
          <tr className="bg-[#f3f4f5] text-[10px] font-bold uppercase tracking-widest text-[#727782]">
            <th className="px-6 py-4 whitespace-nowrap">{periodLabel}</th>
            <th className="px-4 py-4 text-center border-l border-[#c2c6d3]/20">Static Posts</th>
            <th className="px-4 py-4 text-center">Reels</th>
            <th className="px-4 py-4 text-center">Stories</th>
            <th className="px-4 py-4 text-center border-l border-[#c2c6d3]/20">Views (Org.)</th>
            <th className="px-4 py-4 text-center">Views (Ads)</th>
            <th className="px-4 py-4 text-center">3s Views (Org.)</th>
            <th className="px-4 py-4 text-center">3s Views (Ads)</th>
            <th className="px-4 py-4 text-center border-l border-[#c2c6d3]/20">Interactions</th>
            <th className="px-4 py-4 text-center border-l border-[#c2c6d3]/20">New Follows</th>
            <th className="px-4 py-4 text-center">Unfollows</th>
            <th className="px-4 py-4 text-center">Total Followers</th>
          </tr>
        )}
      </thead>

      <tbody className="text-xs font-semibold text-[#424751]">
        {sortedData.map((row, index) => {
          const isCurrent = index === 0;


          return (
            <tr
              key={isTiktok ? row.id : row.week}
              className={
                !isTiktok && isCurrent
                  ? "border-l-4 border-[#003870] bg-[#003870]/5 font-bold"
                  : "border-b border-[#edeeef] hover:bg-[#f3f4f5]/50"
              }
            >
              {isTiktok ? (
                <>
                  <td className="px-6 py-5 whitespace-nowrap text-left border-r border-[#c2c6d3]/10">
                    {row.create_time ? new Date(row.create_time * 1000).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
                  </td>
                  <td className="px-4 py-5 text-center border-l border-[#c2c6d3]/10 font-bold">
                    {row.view_count?.toLocaleString() ?? 0}
                  </td>
                  <td className="px-4 py-5 text-center">{row.like_count?.toLocaleString() ?? 0}</td>
                  <td className="px-4 py-5 text-center">{row.comment_count?.toLocaleString() ?? 0}</td>
                  <td className="px-4 py-5 text-center">{row.share_count?.toLocaleString() ?? 0}</td>
                  <td className="px-4 py-5 text-center border-l border-[#c2c6d3]/10 font-bold text-[#003870]">
                    {row.view_count > 0 
                      ? (((row.like_count || 0) + (row.comment_count || 0) + (row.share_count || 0)) / row.view_count * 100).toFixed(2)
                      : '0.00'}%
                  </td>
                  <td className="px-6 py-5 text-center border-l border-[#c2c6d3]/10 font-bold text-[#191c1d]">
                    {followersCount?.toLocaleString() || 'N/A'}
                  </td>
                </>
              ) : isInstagram ? (




                <>
                  <td className="px-6 py-5 whitespace-nowrap font-bold text-[#191c1d]">
                    {row.week}
                    {isCurrent ? " (Current)" : ""}
                  </td>
                  <td className="px-4 py-5 text-center border-l border-[#c2c6d3]/10">{row.no_of_posts ?? 0}</td>
                  <td className="px-4 py-5 text-center">{row.no_of_reels ?? 0}</td>
                  <td className="px-4 py-5 text-center text-[#727782]">N/A</td>
                  <td className="px-4 py-5 text-center border-l border-[#c2c6d3]/10">{row.views?.organic?.toLocaleString() ?? 0}</td>
                  <td className="px-4 py-5 text-center">{row.views?.ads?.toLocaleString() ?? 0}</td>
                  <td className="px-4 py-5 text-center border-l border-[#c2c6d3]/10">{row.reach?.organic?.toLocaleString() ?? 0}</td>
                  <td className="px-4 py-5 text-center">{row.reach?.ads?.toLocaleString() ?? 0}</td>
                  <td className="px-4 py-5 text-center border-l border-[#c2c6d3]/10 font-bold text-[#003870]">{row.content_interactions?.total?.toLocaleString() ?? 0}</td>
                  <td className="px-4 py-5 text-center border-l border-[#c2c6d3]/10">{row.new_follows ?? 0}</td>
                  <td className="px-4 py-5 text-center">{row.unfollows ?? 0}</td>
                  <td className="px-4 py-5 text-center font-bold text-[#191c1d]">{row.total_followers?.toLocaleString() ?? 0}</td>
                </>
              ) : (
                <>
                  <td className="px-6 py-5 whitespace-nowrap font-bold text-[#191c1d]">
                    {row.week}
                    {isCurrent ? " (Current)" : ""}
                  </td>
                  <td className="px-4 py-5 text-center border-l border-[#c2c6d3]/10">{row.static_posts ?? 0}</td>
                  <td className="px-4 py-5 text-center">{row.no_of_reels ?? 0}</td>
                  <td className="px-4 py-5 text-center text-[#727782]">N/A</td>
                  <td className="px-4 py-5 text-center border-l border-[#c2c6d3]/10">{row.views?.organic?.toLocaleString() ?? 0}</td>
                  <td className="px-4 py-5 text-center">{row.views?.ads?.toLocaleString() ?? 0}</td>
                  <td className="px-4 py-5 text-center">{row.three_second_views?.organic?.toLocaleString() ?? 0}</td>
                  <td className="px-4 py-5 text-center">{row.three_second_views?.ads?.toLocaleString() ?? 0}</td>
                  <td className="px-4 py-5 text-center border-l border-[#c2c6d3]/10 font-bold text-[#003870]">{row.content_interactions?.interactions_total?.toLocaleString() ?? 0}</td>
                  <td className="px-4 py-5 text-center border-l border-[#c2c6d3]/10">{row.new_follows ?? 0}</td>
                  <td className="px-4 py-5 text-center">{row.unfollows ?? 0}</td>
                  <td className="px-4 py-5 text-center font-bold text-[#191c1d]">{row.total_followers?.toLocaleString() ?? 0}</td>
                </>
              )}

            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

// ---------------- Main Component ----------------
export default function ContentBreakdownTable({ clientName, data, platform = 'facebook', timeRange = '7', followersCount }) {
  const [isMaximized, setIsMaximized] = useState(false);

  const isTiktok = platform === 'tiktok';
  const isInstagram = platform === 'instagram';
  
  // For TikTok, we want to ensure newest videos are at the top (create_time descending)
  // For FB/IG, we keep the existing reverse chronological logic
  const sortedData = isTiktok 
    ? [...(data || [])].sort((a, b) => (b.create_time || 0) - (a.create_time || 0))
    : [...(data || [])].reverse();


  const periodLabel = timeRange === '30'
    ? (isInstagram ? 'Month Range' : 'Month Period')
    : (isInstagram ? (isTiktok ? 'Video' : 'Week Range') : 'Week Period');



  // Prevent body scroll when maximized
  useEffect(() => {
    if (isMaximized) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
  }, [isMaximized]);

  const handleDownloadExcel = () => {
    let headers = [];
    if (isTiktok) {
      headers = ["Upload Date", "Total Views", "Likes", "Comments", "Shares", "ER %", "Total Followers"];
    } else if (isInstagram) {
      headers = ["Week Period", "Posts", "Reels", "Stories", "Views (Organic)", "Views (Ads)", "Reach (Organic)", "Reach (Ads)", "Interactions", "New Follows", "Unfollows", "Total Followers"];
    } else {
      headers = ["Week Period", "Static Posts", "Reels", "Stories", "Views (Org.)", "Views (Ads)", "3s Views (Org.)", "3s Views (Ads)", "Interactions", "New Follows", "Unfollows", "Total Followers"];
    }

    const rows = sortedData.map(row => {

      if (isTiktok) {
        const er = row.view_count > 0 
          ? (((row.like_count || 0) + (row.comment_count || 0) + (row.share_count || 0)) / row.view_count * 100).toFixed(2)
          : '0.00';
          
        return [
          row.create_time ? `"${new Date(row.create_time * 1000).toLocaleDateString('en-GB')}"` : '"N/A"',
          row.view_count ?? 0,
          row.like_count ?? 0,
          row.comment_count ?? 0,
          row.share_count ?? 0,
          `"${er}%"`,
          followersCount ?? 0
        ];
      } else if (isInstagram) {
        return [
          `"${row.week}"`,
          row.no_of_posts ?? 0,
          row.no_of_reels ?? 0,
          "N/A",
          row.views?.organic ?? 0,
          row.views?.ads ?? 0,
          row.reach?.organic ?? 0,
          row.reach?.ads ?? 0,
          row.content_interactions?.total ?? 0,
          row.new_follows ?? 0,
          row.unfollows ?? 0,
          row.total_followers ?? 0
        ];
      } else {
        return [
          `"${row.week}"`,
          row.static_posts ?? 0,
          row.no_of_reels ?? 0,
          "N/A",
          row.views?.organic ?? 0,
          row.views?.ads ?? 0,
          row.three_second_views?.organic ?? 0,
          row.three_second_views?.ads ?? 0,
          row.content_interactions?.interactions_total ?? 0,
          row.new_follows ?? 0,
          row.unfollows ?? 0,
          row.total_followers ?? 0
        ];
      }
    });


    const csvContent = [
      headers.join(","),
      ...rows.map(r => r.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const filename = `${clientName}_${platform}_report_${new Date().toISOString().split('T')[0]}.csv`;
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <div className="overflow-hidden rounded-3xl border border-[#c2c6d3]/30 bg-white shadow-sm">
        <div className="border-b border-[#edeeef] p-6 flex items-center justify-between">
          <h3 className="text-xl font-bold text-[#191c1d]">
            {clientName} {isTiktok ? 'TikTok' : (isInstagram ? 'Instagram' : 'Facebook')} Breakdown
          </h3>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadExcel}
              className="p-2 text-[#727782] hover:text-[#003870] hover:bg-blue-50 rounded-full transition-all"
              title="Download Excel Report"
            >
              <DownloadIcon />
            </button>
            <button
              onClick={() => setIsMaximized(true)}
              className="p-2 text-[#727782] hover:text-[#003870] hover:bg-blue-50 rounded-full transition-all"
              title="Maximize View"
            >
              <MaximizeIcon />
            </button>
          </div>
        </div>

        <div className="relative group/table">
          <div className="overflow-x-auto no-scrollbar">
            <TableContent sortedData={sortedData} platform={platform} periodLabel={periodLabel} followersCount={followersCount} />
          </div>



          
          {/* Scroll indicators for mobile */}
          <div className="absolute top-0 right-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none opacity-0 group-hover/table:opacity-100 lg:hidden" />
          <div className="absolute top-0 left-0 bottom-0 w-8 bg-gradient-to-r from-white to-transparent pointer-events-none opacity-0 group-hover/table:opacity-100 lg:hidden" />
        </div>
      </div>

      {/* Maximized Modal Layout */}
      {isMaximized && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-10 animate-in fade-in duration-300">
          {/* Backdrop blur */}
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" 
            onClick={() => setIsMaximized(false)}
          />

          <div className="relative z-10 w-full max-w-[1400px] max-h-[90vh] bg-white rounded-[32px] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
            {/* Modal Header */}
            <div className="border-b border-[#edeeef] p-8 flex items-center justify-between bg-white">
              <div>
                <h3 className="text-3xl font-extrabold text-[#191c1d]">
                  {clientName}: Detailed Breakdown
                </h3>
                <p className="text-[#727782] font-medium mt-1">
                  Comprehensive {periodLabel} performance metrics for {isInstagram ? 'Instagram' : 'Facebook'}.
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={handleDownloadExcel}
                  className="p-3 bg-slate-100 text-[#191c1d] hover:bg-[#003870] hover:text-white rounded-full transition-all shadow-sm"
                  title="Download Excel Report"
                >
                  <DownloadIcon />
                </button>
                <button
                  onClick={() => setIsMaximized(false)}
                  className="p-3 bg-slate-100 text-[#191c1d] hover:bg-[#003870] hover:text-white rounded-full transition-all shadow-sm"
                  title="Exit Fullscreen"
                >
                  <MinimizeIcon />
                </button>
              </div>
            </div>

            {/* Modal Table Area */}
            <div className="flex-1 overflow-auto p-2">
              <div className="p-4">
                <TableContent sortedData={sortedData} platform={platform} periodLabel={periodLabel} followersCount={followersCount} />
              </div>
            </div>




            {/* Modal Footer (Optional status info) */}
            <div className="border-t border-[#edeeef] px-8 py-4 bg-[#f8f9fa] flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-[#727782]">
              <span>Platform: {platform}</span>
              <span>Metric Accuracy Verified</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}