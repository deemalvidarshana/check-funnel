import React, { useState } from 'react';

export default function AverageViewsChart({ data, activeTab }) {
  const platform = activeTab?.toLowerCase();
  const isAudienceBased = platform === 'instagram' || platform === 'facebook';

  const metrics = [
    { 
      key: isAudienceBased ? 'engagement' : 'views', 
      label: isAudienceBased ? 'Average Engagement per Post' : 'Average Views per Post' 
    },
    { key: 'followers', label: 'Audience Size (Followers)' },
    { key: 'likes', label: 'Average Likes per Post' },
    { key: 'comments', label: 'Average Comments per Post' },
    { key: 'shares', label: 'Average Shares per Post' },
    { key: 'saves', label: 'Average Saves per Post' }
  ];

  const [metricIndex, setMetricIndex] = useState(0);
  const currentMetric = metrics[metricIndex];

  const handlePrev = () => setMetricIndex(i => (i === 0 ? metrics.length - 1 : i - 1));
  const handleNext = () => setMetricIndex(i => (i === metrics.length - 1 ? 0 : i + 1));

  const sortedData = [...data].sort((a, b) => b[currentMetric.key] - a[currentMetric.key]);
  const maxValue = Math.max(...sortedData.map(d => d[currentMetric.key] || 0), 0) || 1;

  // Generate 7 ticks (0 to 6)
  const xTicks = Array.from({ length: 7 }).map((_, i) => (maxValue * i) / 6);
  
  const formatK = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1).replace('.0', '') + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1).replace('.0', '') + 'K';
    return Math.round(num);
  };

  return (
    <div className="bg-white rounded-3xl border border-[#c2c6d3]/30 p-6 shadow-sm flex flex-col h-full relative group">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-[#191c1d]">{currentMetric.label}</h2>
        <div className="flex items-center gap-1 transition-opacity">
          <button onClick={handlePrev} className="p-1.5 hover:bg-slate-100 rounded-full transition-colors">
            <svg className="w-4 h-4 text-[#727782]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button onClick={handleNext} className="p-1.5 hover:bg-slate-100 rounded-full transition-colors">
            <svg className="w-4 h-4 text-[#727782]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-around gap-4 mt-2 relative">
        {/* Background Grid Lines (Vertical) */}
        <div className="absolute inset-y-0 left-28 right-10 flex justify-between pointer-events-none z-0">
          {xTicks.map((_, i) => (
            <div key={i} className="h-full border-l border-slate-100 border-dashed w-0"></div>
          ))}
        </div>

        {/* Chart Bars */}
        <div className="relative z-10 flex flex-col gap-5">
          {sortedData.map((item, index) => {
            const value = item[currentMetric.key] || 0;
            const widthPercent = (value / maxValue) * 100;
            return (
              <div key={index} className="flex items-center">
                <div className="w-28 shrink-0">
                  <span className={`text-sm font-semibold truncate block pr-4 ${item.isMain ? 'text-[#003870]' : 'text-[#727782]'}`}>
                    {item.brand}
                  </span>
                </div>
                <div className="flex-1 flex items-center relative h-6">
                  <div 
                    className={`h-full rounded-sm transition-all duration-500 ease-out ${item.isMain ? 'bg-[#003870]' : 'bg-[#7ba6f0]'}`}
                    style={{ width: `${widthPercent}%`, minWidth: '4px' }}
                  ></div>
                  <span className="ml-3 text-sm font-semibold text-[#727782]">
                    {value.toLocaleString()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* X-Axis Labels */}
        <div className="flex items-center mt-4 pt-2 border-t border-slate-100">
           <div className="w-28 shrink-0"></div>
           <div className="flex-1 flex justify-between text-xs font-semibold text-[#727782] pr-10">
             {xTicks.map((tick, i) => (
               <span key={i}>{formatK(tick)}</span>
             ))}
           </div>
        </div>
      </div>
    </div>
  );
}
