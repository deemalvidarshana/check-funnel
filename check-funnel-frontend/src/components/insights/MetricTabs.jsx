const fbTabs = [
  "Content Counts",
  "Total Views",
  "Viewer Retention",
  "Engagement Metrics",
  "Audience Growth",
];

const igTabs = [
  "Content Counts",
  "Total Views",
  "Audience Reach",
  "Engagement Metrics",
  "Audience Growth",
];

const tkTabs = [
  "Video Breakdown",
  "Video Likes",
];


export default function MetricTabs({ activeTab, setActiveTab, platform = 'facebook' }) {
  const tabs = platform === 'instagram' ? igTabs : (platform === 'tiktok' ? tkTabs : fbTabs);


  return (
    <div className="flex overflow-x-auto no-scrollbar whitespace-nowrap gap-2 rounded-full bg-[#f3f4f5] p-1.5">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => setActiveTab(tab)}
          className={`flex-shrink-0 rounded-full px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm transition ${
            activeTab === tab
              ? "bg-white font-semibold text-[#003870] shadow-sm"
              : "font-medium text-[#727782] hover:text-[#191c1d]"
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}