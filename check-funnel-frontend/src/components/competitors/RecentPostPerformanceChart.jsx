import React, { useRef, useState, useEffect } from 'react';

const COLORS = ["#2563eb", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4"];

const groupKey = (group) => String(group?.accountKey ?? group?.username ?? '');

function buildPoints(data, width, height, maxValue) {
  if (data.length < 2) return "";
  const stepX = width / (data.length - 1);
  return data
    .map((item, index) => {
      const x = index * stepX;
      const y = height - (item.value / maxValue) * (height - 25);
      return `${x},${y}`;
    })
    .join(" ");
}

function buildAreaPoints(data, width, height, maxValue) {
  if (data.length < 2) return "";
  const stepX = width / (data.length - 1);
  const points = data.map((item, index) => {
    const x = index * stepX;
    const y = height - (item.value / maxValue) * (height - 25);
    return `${x},${y}`;
  });
  points.push(`${width},${height}`);
  points.push(`0,${height}`);
  return points.join(" ");
}

export default function RecentPostPerformanceChart({ data, selectedCompetitor, activeTab }) {
  const platform = activeTab?.toLowerCase();
  const isAudienceBased = platform === 'instagram' || platform === 'facebook';
  const containerRef = useRef(null);
  const [chartWidth, setChartWidth] = useState(500);
  const [chartHeight, setChartHeight] = useState(160);
  const [currentIndex, setCurrentIndex] = useState(0); // 0 to data.length - 1 are competitors, data.length is 'All'
  const [hiddenCompetitors, setHiddenCompetitors] = useState(new Set());

  // Total items in carousel = competitors + 1 (for All)
  const totalCarouselItems = data.length + 1;

  // Sync with global selector
  useEffect(() => {
    if (selectedCompetitor) {
      if (selectedCompetitor === 'all') {
        setCurrentIndex(data.length); // The last index is 'All'
      } else {
        const idx = data.findIndex(group => groupKey(group) === selectedCompetitor);
        if (idx !== -1) {
          setCurrentIndex(idx);
          setHiddenCompetitors(new Set()); // Reset hidden when switching to single
        }
      }
    }
  }, [selectedCompetitor, data]);

  useEffect(() => {
    setCurrentIndex(index => Math.min(index, data.length));
  }, [data]);

  useEffect(() => {
    if (!containerRef.current) return;
    const handleResize = (entries) => {
      for (const entry of entries) {
        setChartWidth(Math.max(200, entry.contentRect.width - 60));
        setChartHeight(Math.max(120, entry.contentRect.height - 50));
      }
    };
    const observer = new ResizeObserver(handleResize);
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  if (!data || data.length === 0) return null;

  // Is current view 'All Competitors'?
  const safeCurrentIndex = Math.min(currentIndex, data.length);
  const isAll = safeCurrentIndex === data.length;
  const currentGroup = !isAll ? data[safeCurrentIndex] : null;
  
  // Filtering for 'All' mode
  const activeGroups = isAll 
    ? data.filter(g => !hiddenCompetitors.has(groupKey(g)))
    : currentGroup ? [currentGroup] : [];

  // Calculate max value across only ACTIVE visible data
  const allValues = activeGroups.flatMap(g => (g?.data || []).map(d => d.value));
  // Calculate max value across only ACTIVE visible data with 15% buffer
  const rawMax = allValues.reduce((max, val) => val > max ? val : max, 0);
  const maxValue = rawMax > 100 
    ? Math.ceil((rawMax * 1.15) / 100) * 100 
    : Math.max(Math.ceil((rawMax * 1.15) / 10) * 10, 10);

  const handlePrev = () => {
    const nextIdx = currentIndex === 0 ? totalCarouselItems - 1 : currentIndex - 1;
    setCurrentIndex(nextIdx);
    setHiddenCompetitors(new Set());
  };
  
  const handleNext = () => {
    const nextIdx = currentIndex === totalCarouselItems - 1 ? 0 : currentIndex + 1;
    setCurrentIndex(nextIdx);
    setHiddenCompetitors(new Set());
  };

  const toggleCompetitor = (accountKey) => {
    setHiddenCompetitors(prev => {
      const next = new Set(prev);
      if (next.has(accountKey)) {
        next.delete(accountKey);
      } else {
        // Prevent hiding all competitors
        if (next.size < data.length - 1) {
          next.add(accountKey);
        }
      }
      return next;
    });
  };

  const formatK = (num) => {
    if (num >= 1000) return (num / 1000).toFixed(1).replace('.0', '') + 'K';
    return num;
  };

  // Get common dates for X-axis
  const commonDates = data.reduce((acc, g) => g.data.length > acc.length ? g.data : acc, data[0].data);

  return (
    <div className="bg-white rounded-3xl border border-[#c2c6d3]/30 p-5 pb-4 shadow-sm flex flex-col h-full group min-h-[350px]">
      <div className="flex items-center justify-between mb-3">
        <div className="flex flex-col">
          <h2 className="text-lg font-bold text-[#191c1d]">
            Recent Performance {isAudienceBased ? '(Based on Engagement)' : '(Based on Views)'}
          </h2>
          <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">
            {isAll ? "Comparison: All Competitors" : currentGroup?.brand}
          </span>
        </div>
        
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

      <div className="flex-1 w-full" ref={containerRef}>
        <div className="h-full w-full relative">
          <svg
            viewBox={`-40 -20 ${chartWidth + 80} ${chartHeight + 50}`}
            className="w-full h-full overflow-visible"
            preserveAspectRatio="none"
          >
            {/* Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
              const y = chartHeight - ratio * (chartHeight - 25);
              const label = formatK(Math.round(ratio * maxValue));
              return (
                <g key={i}>
                  <text x="-15" y={y + 3} textAnchor="end" fontSize="9" fill="#94a3b8" fontWeight="bold">{label}</text>
                  <line x1="0" y1={y} x2={chartWidth} y2={y} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
                </g>
              );
            })}

            {data.map((group, gIdx) => {
              const accountKey = groupKey(group);
              const isHidden = hiddenCompetitors.has(accountKey);
              const isVisible = !isAll ? (safeCurrentIndex === gIdx) : !isHidden;
              
              if (!isVisible) return null;

              const color = isAll ? COLORS[gIdx % COLORS.length] : "#2563eb";
              const gradId = isAll ? `grad-all-${gIdx}` : `grad-single-${safeCurrentIndex}`;
              
              return (
                <g key={accountKey} className="transition-all duration-500">
                  {!isAll && (
                    <defs>
                      <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity="0.15" />
                        <stop offset="100%" stopColor={color} stopOpacity="0" />
                      </linearGradient>
                    </defs>
                  )}
                  
                  {!isAll && (
                    <polyline
                      fill={`url(#${gradId})`}
                      stroke="none"
                      points={buildAreaPoints(group.data, chartWidth, chartHeight, maxValue)}
                    />
                  )}

                  <polyline
                    fill="none"
                    stroke={color}
                    strokeWidth={isAll ? "2" : "2.5"}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={buildPoints(group.data, chartWidth, chartHeight, maxValue)}
                  />

                  {group.data.map((item, index) => {
                    const stepX = group.data.length > 1 ? chartWidth / (group.data.length - 1) : 0;
                    const x = index * stepX;
                    const y = chartHeight - (item.value / maxValue) * (chartHeight - 25);
                    const skipPoint = isAll && group.data.length > 10 && index % 2 !== 0 && index !== group.data.length - 1;

                    return (
                      <g key={index}>
                        {!skipPoint && (
                          <circle 
                            cx={x} cy={y} 
                            r={isAll ? "2" : (group.data.length > 15 ? "2.5" : "4")} 
                            fill="white" stroke={color} 
                            strokeWidth={isAll ? "1" : "2"} 
                          />
                        )}
                        {!isAll && (
                          <text x={x} y={y - 10} textAnchor="middle" fontSize={group.data.length > 15 ? "7.5" : "9"} fontWeight="bold" fill="#1e40af">
                            {formatK(item.value)}
                          </text>
                        )}
                      </g>
                    );
                  })}
                </g>
              );
            })}

            {commonDates.map((item, index) => {
              const stepX = commonDates.length > 1 ? chartWidth / (commonDates.length - 1) : 0;
              const x = index * stepX;
              const skipDate = commonDates.length > 10 && index % (Math.ceil(commonDates.length / 8)) !== 0 && index !== commonDates.length - 1;

              if (!skipDate) {
                return (
                  <text key={index} x={x} y={chartHeight + 20} textAnchor="middle" fontSize="9" fontWeight="bold" fill="#64748b">
                    {item.date}
                  </text>
                );
              }
              return null;
            })}
          </svg>
        </div>
      </div>

      {isAll && (
        <div className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-2 border-t border-slate-50 pt-3">
          {data.map((group, idx) => {
            const accountKey = groupKey(group);
            const isHidden = hiddenCompetitors.has(accountKey);
            return (
              <button
                key={accountKey}
                onClick={() => toggleCompetitor(accountKey)}
                className={`flex items-center gap-1.5 transition-all hover:opacity-80 ${isHidden ? "opacity-40 grayscale" : "opacity-100"}`}
              >
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                <span className={`text-[10px] font-bold truncate max-w-[100px] ${isHidden ? "text-slate-400" : "text-slate-600"}`}>
                  {group.brand}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
