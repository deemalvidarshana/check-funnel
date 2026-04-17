import { useState, useEffect } from "react";

function ChevronLeft() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function OverviewMetricsCard({ platform = 'facebook', allData = [] }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // When new data arrives, reset to the most recent week (last item)
  useEffect(() => {
    if (allData.length > 0) {
      setCurrentIndex(allData.length - 1);
    }
  }, [allData]);

  const data = allData[currentIndex] || {};
  let metrics = [];
  const isFB = platform === 'facebook';
  const isIG = platform === 'instagram';

  if (platform === 'tiktok') {
    metrics = [
      { label: "Total Videos", value: data.video_count?.toLocaleString() || "0" },
      { label: "Followers", value: data.follower_count?.toLocaleString() || "0" },
      { label: "Following", value: data.following_count?.toLocaleString() || "0" },
      { label: "Profile Likes", value: data.likes_count?.toLocaleString() || "0" },
    ];
  } else if (isFB && data?.week) {
    const totalEng = data.content_interactions?.interactions_total || 0;
    const totalFollowers = data.total_followers || 0;
    const totalViews = (data.views?.organic || 0) + (data.views?.ads || 0);

    const erFollowers = totalFollowers > 0 ? ((totalEng * 100) / totalFollowers).toFixed(2) : "0.00";
    const erViews = totalViews > 0 ? ((totalEng * 100) / totalViews).toFixed(2) : "0.00";

    metrics = [
      { label: "Total Followers", value: totalFollowers?.toLocaleString() || "0" },
      { label: "Total Engagements", value: totalEng?.toLocaleString() || "0" },
      { label: "E R by Followers", value: `${erFollowers}%` },
      { label: "E R by Views", value: `${erViews}%` },
    ];
  } else if (isIG && data?.week) {
    const totalInt = data.content_interactions?.total || 0;
    const totalFollowers = data.total_followers || 0;
    const totalReach = (data.reach?.organic || 0) + (data.reach?.ads || 0);

    const erFollowers = totalFollowers > 0 ? ((totalInt * 100) / totalFollowers).toFixed(2) : "0.00";
    const erReach = totalReach > 0 ? ((totalInt * 100) / totalReach).toFixed(2) : "0.00";

    metrics = [
      { label: "Total Followers", value: totalFollowers?.toLocaleString() || "0" },
      { label: "Content Interactions", value: totalInt?.toLocaleString() || "0" },
      { label: "ER by Followers", value: `${erFollowers}%` },
      { label: "ER by Reach", value: `${erReach}%` },
    ];
  } else if (isFB || isIG) {
    // Show N/A instead of hardcoded placeholders while loading or if data is missing
    metrics = [
      { label: "Total Followers", value: "N/A" },
      { label: isFB ? "Total Engagements" : "Content Interactions", value: "N/A" },
      { label: "ER by Followers", value: "N/A" },
      { label: isFB ? "ER by Views" : "ER by Reach", value: "N/A" },
    ];
  } else {
    metrics = [
      { label: "Total Followers", value: "N/A" },
      { label: "Total Interactions", value: "N/A" },
      { label: "ER by Followers", value: "N/A" },
      { label: "ER by Reach", value: "N/A" },
    ];
  }

  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };

  const handleNext = () => {
    if (currentIndex < allData.length - 1) setCurrentIndex(currentIndex + 1);
  };


  return (
    <div className="rounded-3xl border border-[#c2c6d3]/30 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-bold text-[#191c1d]">
          Overview Metrics
        </h3>
        
        {allData.length > 1 && (
          <div className="flex items-center gap-1">
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="p-1.5 rounded-full text-[#727782] hover:bg-[#f3f4f5] disabled:opacity-30 disabled:hover:bg-transparent transition-all"
            >
              <ChevronLeft />
            </button>
            <button
              onClick={handleNext}
              disabled={currentIndex === allData.length - 1}
              className="p-1.5 rounded-full text-[#727782] hover:bg-[#f3f4f5] disabled:opacity-30 disabled:hover:bg-transparent transition-all"
            >
              <ChevronRight />
            </button>
          </div>
        )}
      </div>

      {(isFB || isIG) && data?.week && (
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#727782] mb-6">
          Week ({data.week})
        </p>
      )}
      {!(isFB || isIG) && <div className="mb-6"></div>}

      <div className="space-y-4">
        {metrics.map((metric, index) => (
          <div
            key={metric.label}
            className={`flex items-center justify-between ${
              index !== metrics.length - 1
                ? "border-b border-[#edeeef] pb-4"
                : ""
            }`}
          >
            <span className="text-sm font-medium text-[#727782]">
              {metric.label}
            </span>
            <span className="text-sm font-bold text-[#191c1d]">
              {metric.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}