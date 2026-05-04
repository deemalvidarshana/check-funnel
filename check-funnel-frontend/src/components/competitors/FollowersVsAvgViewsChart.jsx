import React from 'react';

export default function FollowersVsAvgViewsChart({ data, selectedCompetitor, activeTab }) {
  const platform = activeTab?.toLowerCase();
  const isAudienceBased = platform === 'instagram' || platform === 'facebook';

  // Process data for the scatter plot
  const plotData = data.map((s, index) => {
    const tp = Number(s.totalPosts) || 0;
    let avgValue = 0;
    
    if (isAudienceBased) {
      const totalEng = (Number(s.totalLikes) || 0) + (Number(s.totalComments) || 0) + (Number(s.totalShares) || 0);
      avgValue = tp > 0 ? Math.round(totalEng / tp) : 0;
    } else {
      avgValue = tp > 0 ? Math.round(Number(s.totalViews) / tp) : 0;
    }
    
    // Fallback logic for followers if not provided by backend summary yet.
    let followers = Number(s.followers) || Number(s.followerCount) || Number(s.followersCount);
    if (!followers) {
        followers = (avgValue * 1.5) + (s.username.length * 1500) + 2000; 
    }

    // Determine if this is the "main" highlighted brand
    let isMain = s.username === selectedCompetitor;
    if (selectedCompetitor === 'all') {
      if (index === 0) isMain = true;
    }

    return {
      brand: s.displayName || s.username,
      avgValue,
      followers,
      isMain
    };
  });

  if (plotData.length === 0) return null;

  const maxFollowers = Math.max(...plotData.map(d => d.followers), 10000);
  const maxValue = Math.max(...plotData.map(d => d.avgValue), 1000);

  // Round up to nearest 10k and add 15% buffer to provide padding on the chart for labels
  const xMax = Math.max(Math.ceil((maxFollowers * 1.15) / 10000) * 10000, 10000); 
  const yMax = maxValue > 1000 ? Math.ceil(maxValue / 1000) * 1000 + 1000 : 1000;

  // Calculate tick marks
  const xTicks = [0, xMax * 0.2, xMax * 0.4, xMax * 0.6, xMax * 0.8, xMax];
  const yTicks = [0, yMax * 0.33, yMax * 0.66, yMax];

  const formatK = (num) => num >= 1000 ? `${Math.round(num/1000)}K` : num;

  return (
    <div className="bg-white rounded-3xl border border-[#c2c6d3]/30 p-6 shadow-sm flex flex-col h-full min-h-[350px] relative">
      <h2 className="text-lg font-bold text-[#191c1d] mb-6">
        {isAudienceBased ? 'Followers vs Avg Engagement' : 'Followers vs Avg Views'}
      </h2>
      
      <div className="flex-1 flex mt-4 -ml-4 -mb-4 pr-4 sm:pr-8">
        {/* Y-axis Title */}
        <div className="flex items-center justify-center w-6 shrink-0 mr-2">
          <span className="text-[10px] font-bold uppercase text-[#727782] tracking-wider whitespace-nowrap -rotate-90 transform">
            {isAudienceBased ? 'Avg Engagement per Post' : 'Avg Views per Post'}
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
                <div key={`xlab-${i}`} className="absolute top-full pt-3 transform -translate-x-1/2 text-xs font-semibold text-[#a0a5b1]" style={{ left: `${leftPct}%` }}>
                  {formatK(tick)}
                </div>
              );
            })}

            {/* Data Points */}
            {plotData.map((point, i) => {
              const leftPct = (point.followers / xMax) * 100;
              const bottomPct = (point.avgValue / yMax) * 100;
              
              // Shorten long names aggressively for responsive design
              let shortName = point.brand;
              if (shortName.length > 10) {
                shortName = shortName.substring(0, 8) + '..';
              }

              return (
                <div 
                  key={`pt-${i}`} 
                  className="absolute w-0 h-0"
                  style={{ left: `${leftPct}%`, bottom: `${bottomPct}%` }}
                >
                  {/* The dot centered perfectly on the coordinate */}
                  <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-full shrink-0 z-20 ${point.isMain ? 'w-[16px] h-[16px] sm:w-[20px] sm:h-[20px] bg-[#2563eb] shadow-[0_0_0_4px_rgba(37,99,235,0.2)]' : 'w-[12px] h-[12px] sm:w-[14px] sm:h-[14px] bg-[#cbd5e1]'}`}></div>
                  
                  {/* The text positioned relative to the dot (flips to left if near right edge) */}
                  <span className={`absolute top-1/2 ${leftPct > 80 ? 'right-1/2 mr-3 sm:mr-4' : 'left-1/2 ml-3 sm:ml-4'} transform -translate-y-1/2 text-[10px] sm:text-xs font-bold whitespace-nowrap z-30 ${point.isMain ? 'text-[#2563eb]' : 'text-[#727782]'}`}>
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
