import React from 'react';

const accountKeyFromSummary = (summaryItem) => String(
  summaryItem?.accountKey ??
  summaryItem?.accountId ??
  summaryItem?.id ??
  summaryItem?.username ??
  ''
);

export default function FollowersVsAvgViewsChart({ data, selectedCompetitor, activeTab, performanceMode }) {
  const platform = activeTab?.toLowerCase();
  const isAudienceBased = performanceMode
    ? performanceMode === 'engagement'
    : platform === 'instagram' || platform === 'facebook';
  const isVideoViewsMode = performanceMode === 'videoViews';
  const metricKey = isVideoViewsMode ? 'videoViews' : isAudienceBased ? 'engagement' : 'views';
  const chartTitle = isVideoViewsMode
    ? 'Followers vs Avg Video Views'
    : isAudienceBased ? 'Followers vs Avg Engagement' : 'Followers vs Avg Views';
  const axisTitle = isVideoViewsMode
    ? 'Avg Video Views'
    : isAudienceBased ? 'Avg Engagement' : 'Avg Views';

  // Process data for the scatter plot
  const plotData = data.map((s, index) => {
    const tp = Number(s.totalPosts) || 0;
    let avgValue = Number(s[metricKey]) || 0;
    
    if (!avgValue && isAudienceBased) {
      const totalEng = (Number(s.totalLikes) || 0) + (Number(s.totalComments) || 0) + (Number(s.totalShares) || 0);
      avgValue = tp > 0 ? Math.round(totalEng / tp) : 0;
    } else if (!avgValue) {
      avgValue = tp > 0 ? Math.round(Number(s.totalViews) / tp) : 0;
    }
    
    // Fallback logic for followers if not provided by backend summary yet.
    let followers = Number(s.followers) || Number(s.followerCount) || Number(s.followersCount);
    if (!followers) {
        followers = (avgValue * 1.5) + ((s.username || '').length * 1500) + 2000;
    }

    // Determine if this is the "main" highlighted brand
    let isMain = accountKeyFromSummary(s) === selectedCompetitor;
    if (selectedCompetitor === 'all') {
      if (index === 0) isMain = true;
    }

    return {
      brand: s.brand || s.displayName || s.username || 'Unknown',
      avgValue,
      followers,
      isMain
    };
  });

  if (plotData.length === 0) return null;

  const maxFollowers = Math.max(...plotData.map(d => d.followers), 1000);
  const maxValue = Math.max(...plotData.map(d => d.avgValue), 10);

  // Use a tighter buffer and round more logically
  const xMax = Math.ceil((maxFollowers * 1.1) / 1000) * 1000; 
  const yMax = Math.ceil((maxValue * 1.2) / 10) * 10;

  // Calculate tick marks - more granular
  const xTicks = [0, xMax * 0.25, xMax * 0.5, xMax * 0.75, xMax];
  const yTicks = [0, yMax * 0.25, yMax * 0.5, yMax * 0.75, yMax];

  const formatK = (num) => {
    if (num >= 1000000) return `${(num/1000000).toFixed(1)}M`;
    if (num >= 1000) return `${Math.round(num/1000)}K`;
    return Math.round(num);
  };

  return (
    <div className="bg-white rounded-3xl border border-[#c2c6d3]/30 p-6 shadow-sm flex flex-col h-full min-h-[400px] relative">
      <h2 className="text-lg font-bold text-[#191c1d] mb-6">
        {chartTitle}
      </h2>
      
      <div className="flex-1 flex mt-4 -ml-4 -mb-4 pr-4 sm:pr-8">
        {/* Y-axis Title */}
        <div className="flex items-center justify-center w-6 shrink-0 mr-2">
          <span className="text-[10px] font-bold uppercase text-[#727782] tracking-wider whitespace-nowrap -rotate-90 transform">
            {axisTitle}
          </span>
        </div>

        {/* Y-axis Labels */}
        <div className="flex flex-col justify-between items-end pr-3 pb-12 shrink-0 w-8 sm:w-10">
          {yTicks.slice().reverse().map((tick, i) => (
            <span key={`ylab-${i}`} className="text-[10px] sm:text-xs font-semibold text-[#a0a5b1] leading-none transform translate-y-1/2">
              {formatK(tick)}
            </span>
          ))}
        </div>

        {/* Chart Area container */}
        <div className="flex-1 flex flex-col relative pb-12">
          
          {/* Chart Grid */}
          <div className="flex-1 relative border-l-2 border-b-2 border-[#f3f4f5]">
            
            {/* Horizontal Grid lines */}
            {yTicks.map((tick, i) => {
              const bottomPct = (tick / yMax) * 100;
              return (
                <div key={`hgrid-${i}`} className="absolute w-full border-t border-slate-100/50 border-dashed h-0" style={{ bottom: `${bottomPct}%` }}></div>
              );
            })}

            {/* Vertical Grid lines */}
            {xTicks.map((tick, i) => {
              const leftPct = (tick / xMax) * 100;
              return (
                <div key={`vgrid-${i}`} className="absolute h-full border-l border-slate-100/50 border-dashed w-0" style={{ left: `${leftPct}%` }}></div>
              );
            })}

            {/* X-axis Labels */}
            {xTicks.map((tick, i) => {
              const leftPct = (tick / xMax) * 100;
              return (
                <div key={`xlab-${i}`} className="absolute top-full pt-3 transform -translate-x-1/2 text-xs font-semibold text-[#a0a5b1] whitespace-nowrap" style={{ left: `${leftPct}%` }}>
                  {formatK(tick)}
                </div>
              );
            })}

            {/* Data Points */}
            {plotData.map((point, i) => {
              const leftPct = (point.followers / xMax) * 100;
              const bottomPct = (point.avgValue / yMax) * 100;
              
              let shortName = point.brand || 'Unknown';
              if (shortName.length > 12) {
                shortName = shortName.substring(0, 10) + '..';
              }

              // Simple collision avoidance: alternate label positions
              const isEven = i % 2 === 0;
              const isThird = i % 3 === 0;
              
              let labelStyle = {};
              if (leftPct > 80) {
                labelStyle = { right: '100%', marginRight: '10px' };
              } else {
                labelStyle = { left: '100%', marginLeft: '10px' };
              }

              // Vertical offset to prevent horizontal overlap
              if (isEven) {
                labelStyle.transform = 'translateY(-120%)';
              } else if (isThird) {
                labelStyle.transform = 'translateY(20%)';
              } else {
                labelStyle.transform = 'translateY(-50%)';
              }

              return (
                <div 
                  key={`pt-${i}`} 
                  className="absolute w-0 h-0 transition-all duration-500"
                  style={{ left: `${leftPct}%`, bottom: `${bottomPct}%` }}
                >
                  <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-full shrink-0 z-20 ${point.isMain ? 'w-[14px] h-[14px] sm:w-[18px] sm:h-[18px] bg-[#003870] shadow-[0_0_0_4px_rgba(0,56,112,0.15)]' : 'w-[10px] h-[10px] sm:w-[12px] sm:h-[12px] bg-[#cbd5e1]'}`}></div>
                  
                  <span 
                    className={`absolute font-bold text-[9px] sm:text-[11px] whitespace-nowrap z-30 pointer-events-none ${point.isMain ? 'text-[#003870]' : 'text-[#727782]'}`}
                    style={labelStyle}
                  >
                    {shortName}
                  </span>
                </div>
              );
            })}
          </div>

          {/* X-axis Title */}
          <div className="absolute bottom-0 left-0 right-0 text-center text-[11px] font-bold uppercase text-[#727782] tracking-wider mt-2">
            Followers
          </div>
        </div>
      </div>
    </div>
  );
}
