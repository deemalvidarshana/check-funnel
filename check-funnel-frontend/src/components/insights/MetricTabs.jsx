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
    <div className="flex w-full min-w-0 gap-2 overflow-x-auto whitespace-nowrap rounded-full bg-[#f3f4f5] p-1.5 no-scrollbar 2xl:w-auto">
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
