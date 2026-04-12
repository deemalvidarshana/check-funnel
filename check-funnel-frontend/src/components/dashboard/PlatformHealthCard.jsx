const platforms = [
  { name: "Meta API", icon: "📣", status: "Operational", color: "green" },
  { name: "LinkedIn", icon: "💼", status: "Operational", color: "green" },
  { name: "Twitter", icon: "𝕏", status: "Degraded", color: "yellow" },
  { name: "TikTok", icon: "🎵", status: "Operational", color: "green" },
];

export default function PlatformHealthCard() {
  return (
    <section className="bg-white rounded-2xl p-8 shadow-[0_30px_60px_-15px_rgba(25,28,29,0.06)]">
      <h3 className="text-xl font-bold mb-6 text-slate-900">Platform Health</h3>

      <div className="space-y-4">
        {platforms.map((platform) => (
          <div
            key={platform.name}
            className="flex items-center justify-between p-4 bg-slate-50 rounded-xl"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center text-sm">
                {platform.icon}
              </div>
              <span className="text-sm font-bold text-slate-900">{platform.name}</span>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`text-[10px] uppercase font-bold ${
                  platform.color === "green" ? "text-green-600" : "text-yellow-600"
                }`}
              >
                {platform.status}
              </span>
              <div
                className={`w-2.5 h-2.5 rounded-full ${
                  platform.color === "green" ? "bg-green-500" : "bg-yellow-500"
                }`}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}