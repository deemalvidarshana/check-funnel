const platforms = [
  { key: "facebook", label: "Facebook" },
  { key: "instagram", label: "Instagram" },
  { key: "tiktok", label: "TikTok" },
];

export default function PlatformSelector({ activePlatform, setActivePlatform }) {
  return (
    <div className="flex overflow-x-auto no-scrollbar whitespace-nowrap items-center gap-2 rounded-full bg-[#f3f4f5] p-1 w-full sm:w-auto">
      {platforms.map((platform) => (
        <button
          key={platform.key}
          onClick={() => setActivePlatform(platform.key)}
          className={`flex-shrink-0 rounded-full px-4 py-2 text-sm transition ${
            activePlatform === platform.key
              ? "bg-[#003870] font-semibold text-white"
              : "font-medium text-[#727782] hover:bg-[#e7e8e9]"
          }`}
        >
          {platform.label}
        </button>
      ))}
    </div>
  );
}