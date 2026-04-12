export default function OverviewMetricsCard() {
  const metrics = [
    { label: "Avg Daily Reach", value: "12.4K" },
    { label: "Share Rate", value: "1.2%" },
    { label: "Profile Visits", value: "842" },
    { label: "Bio Clicks", value: "156" },
  ];

  return (
    <div className="rounded-3xl border border-[#c2c6d3]/30 bg-white p-6 shadow-sm">
      <h3 className="mb-6 text-lg font-bold text-[#191c1d]">
        Overview Metrics
      </h3>

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