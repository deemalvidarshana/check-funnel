export default function SystemHealthCard() {
  return (
    <div className="rounded-3xl border border-[#c2c6d3]/30 bg-[#f3f4f5] p-6">
      <div className="mb-4 flex items-center gap-3">
        <span className="text-[#4553c1]">●</span>
        <h4 className="text-sm font-bold text-[#191c1d]">System Health</h4>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex -space-x-2">
          <div className="h-6 w-6 rounded-full border border-white bg-[#7e8cfe]" />
          <div className="h-6 w-6 rounded-full border border-white bg-[#d5e3ff]" />
          <div className="h-6 w-6 rounded-full border border-white bg-[#ffdbcb]" />
        </div>

        <span className="text-[10px] font-bold text-[#727782]">
          99.9% Uptime
        </span>
      </div>
    </div>
  );
}