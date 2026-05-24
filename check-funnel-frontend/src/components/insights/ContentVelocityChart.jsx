import { useState, useEffect, useRef } from "react";
import { useSidebar } from "../../context/SidebarContext";

// ---------------- Icon Components ----------------
function MaximizeIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MinimizeIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 14h6v6M20 10h-6V4M14 10l7-7M10 14l-7 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PrevIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function NextIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ---------------- Helper Functions ----------------
function getNestedValue(obj, path) {
  if (!obj) return 0;
  if (!path || typeof path !== 'string') return 0;
  if (!path.includes(".")) return obj[path] ?? 0;
  return path.split(".").reduce((acc, part) => acc?.[part] ?? 0, obj);
}

function buildPoints(data, key, width, height, maxValue) {
  const stepX = data.length > 1 ? width / (data.length - 1) : 0;
  return data
    .map((item, index) => {
      const x = data.length > 1 ? index * stepX : width / 2;
      const v = getNestedValue(item, key);
      const val = typeof v === 'number' ? v : 0;
      const y = height - (val / maxValue) * (height - 30);
      return `${x},${y}`;
    })
    .join(" ");
}

function buildAreaPoints(data, key, width, height, maxValue) {
  const stepX = data.length > 1 ? width / (data.length - 1) : 0;
  const points = data.map((item, index) => {
    const x = data.length > 1 ? index * stepX : width / 2;
    const v = getNestedValue(item, key);
    const val = typeof v === 'number' ? v : 0;
    const y = height - (val / maxValue) * (height - 30);
    return `${x},${y}`;
  });
  points.push(`${width},${height}`);
  points.push(`0,${height}`);
  return points.join(" ");
}

function formatAxisLabelLines(label, isCompact) {
  if (typeof label !== "string") return [label];

  const monthWeekMatch = label.match(/^Week\s+(\d+)\s+\(([^)]+)\)$/);
  if (monthWeekMatch) return [`Week ${monthWeekMatch[1]}`, monthWeekMatch[2]];

  if (!isCompact) return [label];

  const match = label.match(/^(\d{1,2})\s+([A-Za-z]{3})\s+-\s+(\d{1,2})\s+([A-Za-z]{3})$/);
  if (!match) return [label];

  const [, startDay, startMonth, endDay, endMonth] = match;
  if (startMonth === endMonth) return [`${startDay}-${endDay}`, endMonth];
  return [`${startDay} ${startMonth}`, `${endDay} ${endMonth}`];
}

function formatChartValue(value) {
  return value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value;
}

function getValueLabelPositions(currentY, previousY, height, hasPrevious) {
  let currentLabelY = currentY - 12;
  let previousLabelY = previousY + 16;

  if (hasPrevious && Math.abs(currentY - previousY) < 30) {
    if (currentY <= previousY) {
      currentLabelY = currentY - 18;
      previousLabelY = previousY + 22;
    } else {
      currentLabelY = currentY + 20;
      previousLabelY = previousY - 14;
    }
  }

  if (currentLabelY > height - 8) currentLabelY = currentY - 12;
  if (previousLabelY > height - 8) previousLabelY = previousY - 14;
  if (currentLabelY < -24) currentLabelY = currentY + 20;
  if (previousLabelY < -24) previousLabelY = previousY + 22;

  return { currentLabelY, previousLabelY };
}

// ---------------- Sub-component for Chart Content ----------------
function ChartDrawing({ data, comparisonData = null, activeMetrics, height = 240, hidePoints = false }) {
  const containerRef = useRef(null);
  const [chartWidth, setChartWidth] = useState(760);

  useEffect(() => {
    if (!containerRef.current) return;
    const handleResize = (entries) => {
      for (const entry of entries) {
        const newWidth = Math.max(300, entry.contentRect.width - 48);
        setChartWidth(newWidth);
      }
    };
    const observer = new ResizeObserver(handleResize);
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const maxValue = Math.max(
    ...data.flatMap((d) => 
      activeMetrics.map(m => {
        const val = getNestedValue(d, m.key);
        return typeof val === 'number' ? val : 0;
      })
    ),
    ...(comparisonData || []).flatMap((d) =>
      activeMetrics.map(m => {
        const val = getNestedValue(d, m.key);
        return typeof val === 'number' ? val : 0;
      })
    ),
    10
  );

  return (
    <div ref={containerRef} className="w-full h-full overflow-hidden">
      <svg
        viewBox={`-50 -40 ${chartWidth + 100} ${height + 100}`}
        className="h-full w-full transition-all duration-300"
        preserveAspectRatio="none"
      >
        {[40, 90, 140, 190].map((y) => (
          <line
            key={y}
            x1="0"
            y1={y}
            x2={chartWidth}
            y2={y}
            stroke="#e2e8f0"
            strokeDasharray="4"
            strokeWidth="1"
          />
        ))}

        <rect x={chartWidth - 120} y="0" width="120" height={height} fill="rgba(0,56,112,0.05)" />

        {activeMetrics.map((m) => (
          <polyline
            key={`area-${m.key}`}
            fill={m.color}
            fillOpacity="0.08"
            stroke="none"
            points={buildAreaPoints(data, m.key, chartWidth, height, maxValue)}
            className="transition-all duration-300"
          />
        ))}

        {activeMetrics.map((m) => (
          <polyline
            key={`line-${m.key}`}
            fill="none"
            stroke={m.color}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={buildPoints(data, m.key, chartWidth, height, maxValue)}
            className="transition-all duration-300"
          />
        ))}

        {comparisonData && activeMetrics.map((m) => (
          <polyline
            key={`comparison-line-${m.key}`}
            fill="none"
            stroke={m.color}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="9 7"
            strokeOpacity="0.7"
            points={buildPoints(comparisonData, m.key, chartWidth, height, maxValue)}
            className="transition-all duration-300"
          />
        ))}

        {data.map((item, index) => {
          const stepX = data.length > 1 ? chartWidth / (data.length - 1) : 0;
          const x = data.length > 1 ? index * stepX : chartWidth / 2;
          const isCompactAxis = chartWidth < 500;
          const axisLabelLines = formatAxisLabelLines(item.week, isCompactAxis);

          return (
            <g key={index}>
              {activeMetrics.map((m, metricIndex) => {
                const val = getNestedValue(item, m.key);
                const numVal = typeof val === 'number' ? val : 0;
                const y = height - (numVal / maxValue) * (height - 30);
                const comparisonVal = comparisonData ? getNestedValue(comparisonData[index], m.key) : 0;
                const comparisonNumVal = typeof comparisonVal === 'number' ? comparisonVal : 0;
                const comparisonY = height - (comparisonNumVal / maxValue) * (height - 30);
                const labelOffsetX = activeMetrics.length > 1 ? (metricIndex - (activeMetrics.length - 1) / 2) * 18 : 0;
                const labelX = Math.max(-28, Math.min(chartWidth + 28, x + labelOffsetX));
                const { currentLabelY, previousLabelY } = getValueLabelPositions(
                  y,
                  comparisonY,
                  height,
                  comparisonData && comparisonNumVal > 0 && numVal > 0
                );
                return (
                  <g key={`${index}-${m.key}`}>
                    {comparisonData && comparisonNumVal > 0 && (
                      <>
                        <circle cx={x} cy={comparisonY} r="3.5" fill="white" stroke={m.color} strokeWidth="2" opacity="0.8" className="transition-all duration-300" />
                        <text
                          x={labelX}
                          y={previousLabelY}
                          textAnchor="middle"
                          fontSize="9"
                          fontWeight="bold"
                          fill={m.color}
                          opacity="0.7"
                          stroke="#ffffff"
                          strokeWidth="4"
                          paintOrder="stroke"
                          className="transition-all duration-300"
                        >
                          {formatChartValue(comparisonNumVal)}
                        </text>
                      </>
                    )}

                    {/* Only show dot if value is > 0 OR if it's not the bottom line */}
                    {numVal > 0 && (
                      <circle cx={x} cy={y} r="4" fill={m.color} className="transition-all duration-300" />
                    )}
                    
                    {numVal > 0 && (
                      <text
                        x={labelX}
                        y={currentLabelY}
                        textAnchor="middle"
                        fontSize="10"
                        fontWeight="bold"
                        fill={m.color}
                        stroke="#ffffff"
                        strokeWidth="4"
                        paintOrder="stroke"
                        className="transition-all duration-300"
                      >
                        {formatChartValue(numVal)}
                      </text>
                    )}
                  </g>
                );
              })}

              <text
                x={x}
                y={height + (isCompactAxis ? 18 : 25)}
                textAnchor="middle"
                fontSize={isCompactAxis ? "8.6" : "10"}
                fontWeight={index === data.length - 1 ? "800" : "600"}
                fill={index === data.length - 1 ? "#003870" : "#727782"}
                className="transition-all duration-300"
              >
                {axisLabelLines.map((line, lineIndex) => (
                  <tspan
                    key={line}
                    x={x}
                    dy={lineIndex === 0 ? 0 : isCompactAxis ? 9.5 : 11}
                  >
                    {line}
                  </tspan>
                ))}
              </text>
            </g>
          );
        })}

      </svg>
    </div>
  );
}

// ---------------- Main Component ----------------
export default function ContentVelocityChart({ title, subtitle, data, comparisonData = null, comparisonLabels = null, metrics, onNext, onPrev, hidePoints = false }) {
  const [isMaximized, setIsMaximized] = useState(false);
  
  const defaultMetrics = metrics || [
    { key: "static_posts", label: "Posts", color: "#003870" },
    { key: "no_of_stories", label: "Stories", color: "#4553c1" },
    { key: "no_of_reels", label: "Reels", color: "#863802" },
  ];

  const [visibleKeys, setVisibleKeys] = useState(defaultMetrics.map(m => m.key));

  // Reset visible keys when metrics change (e.g. when switching tabs)
  useEffect(() => {
    setVisibleKeys(defaultMetrics.map(m => m.key));
  }, [metrics]);

  const toggleMetric = (key) => {
    setVisibleKeys(prev => {
      if (prev.includes(key)) {
        // Don't allow deselecting last one? Or allow it? 
        // User asked for checkboxes, usually you want at least one or empty graph.
        if (prev.length === 1) return prev; 
        return prev.filter(k => k !== key);
      }
      return [...prev, key];
    });
  };

  const activeMetrics = defaultMetrics.filter(m => visibleKeys.includes(m.key));
  const comparisonColor = activeMetrics[0]?.color || defaultMetrics[0]?.color || "#003870";

  // Prevent body scroll when maximized
  useEffect(() => {
    if (isMaximized) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
  }, [isMaximized]);

  return (
    <>
      <div className="rounded-3xl border border-[#c2c6d3]/30 bg-white p-4 sm:p-6 shadow-sm overflow-hiddenTransition-all duration-300">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1">
            <h2 className="text-xl sm:text-2xl font-bold text-[#191c1d] leading-tight">{title}</h2>
            <p className="text-xs sm:text-sm text-[#727782]">{subtitle}</p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
            <div className="flex flex-col items-center gap-2">
              <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-[10px] sm:text-xs font-bold uppercase tracking-widest text-[#727782]">
                {defaultMetrics.map((m) => (
                  <label 
                    key={m.key} 
                    className="flex items-center gap-2 cursor-pointer group"
                  >
                    <div className="relative flex items-center justify-center">
                      <input
                        type="checkbox"
                        checked={visibleKeys.includes(m.key)}
                        onChange={() => toggleMetric(m.key)}
                        className="sr-only"
                      />
                      <div className={`h-4 w-4 rounded border-2 transition-all ${visibleKeys.includes(m.key) ? 'border-transparent' : 'border-[#c2c6d3]'}`} style={{ backgroundColor: visibleKeys.includes(m.key) ? m.color : 'transparent' }}>
                        {visibleKeys.includes(m.key) && (
                          <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </div>
                    </div>
                    <span className={`transition-colors ${visibleKeys.includes(m.key) ? 'text-[#191c1d]' : 'text-[#727782]/50'}`}>{m.label}</span>
                  </label>
                ))}
              </div>

              {comparisonData && (
                <div className="flex flex-wrap items-center justify-center gap-4 text-[10px] font-extrabold uppercase tracking-widest text-[#727782]">
                  <span className="flex items-center gap-2">
                    <span className="h-[3px] w-8 rounded-full" style={{ backgroundColor: comparisonColor }} />
                    {comparisonLabels?.current || "Current Month"}
                  </span>
                  <span className="flex items-center gap-2">
                    <svg width="34" height="6" viewBox="0 0 34 6" aria-hidden="true">
                      <line x1="1" y1="3" x2="33" y2="3" stroke={comparisonColor} strokeWidth="3" strokeLinecap="round" strokeDasharray="7 6" opacity="0.7" />
                    </svg>
                    {comparisonLabels?.previous || "Previous Month"}
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-1.5 border-t sm:border-t-0 sm:border-l border-slate-100 pt-3 sm:pt-0 sm:pl-6">
               <div className="flex items-center gap-1">
                 <button
                  onClick={onPrev}
                  className="p-2 text-[#727782] hover:text-[#003870] hover:bg-blue-50 rounded-full transition-all shrink-0"
                  title="Previous Metric"
                >
                  <PrevIcon />
                </button>
                <button
                  onClick={onNext}
                  className="p-2 text-[#727782] hover:text-[#003870] hover:bg-blue-50 rounded-full transition-all shrink-0"
                  title="Next Metric"
                >
                  <NextIcon />
                </button>
              </div>
              <button
                onClick={() => setIsMaximized(true)}
                className="p-2 text-[#727782] hover:text-[#003870] hover:bg-blue-50 rounded-full transition-all shrink-0 border border-slate-100 ml-2"
                title="Maximize Chart"
              >
                <MaximizeIcon />
              </button>
            </div>
          </div>
        </div>

        <div className="h-[240px] sm:h-[300px] w-full">
          <ChartDrawing data={data} comparisonData={comparisonData} activeMetrics={activeMetrics} height={220} hidePoints={hidePoints} />
        </div>
      </div>

      {/* Maximized Modal Layout */}
      {isMaximized && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 sm:p-10 animate-in fade-in duration-300">
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl" 
            onClick={() => setIsMaximized(false)}
          />

          <div className="relative z-10 w-full max-w-6xl bg-white rounded-[24px] sm:rounded-[32px] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 mx-4 max-h-[90vh]">
            {/* Modal Header */}
            <div className="border-b border-[#edeeef] p-6 sm:p-10 flex flex-col sm:flex-row sm:items-center justify-between bg-white gap-4">
              <div>
                <h3 className="text-xl sm:text-3xl font-extrabold text-[#191c1d] leading-tight">
                  {title}: Focused View
                </h3>
                <p className="text-xs sm:text-sm text-[#727782] font-medium mt-1">
                  {subtitle}
                </p>
              </div>
              
              <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4">
                <div className="flex items-center bg-slate-100 rounded-full p-1">
                  <button
                    onClick={onPrev}
                    className="p-2 sm:p-3 text-[#191c1d] hover:bg-[#003870] hover:text-white rounded-full transition-all"
                  >
                    <PrevIcon />
                  </button>
                  <button
                    onClick={onNext}
                    className="p-2 sm:p-3 text-[#191c1d] hover:bg-[#003870] hover:text-white rounded-full transition-all"
                  >
                    <NextIcon />
                  </button>
                </div>

                <button
                  onClick={() => setIsMaximized(false)}
                  className="p-2 sm:p-3 bg-slate-100 text-[#191c1d] hover:bg-[#003870] hover:text-white rounded-full transition-all shadow-sm"
                  title="Exit Fullscreen"
                >
                  <MinimizeIcon />
                </button>
              </div>
            </div>

            {/* Modal Content - Larger Graph Area */}
            <div className="p-6 sm:p-10 h-[300px] sm:h-[450px] overflow-hidden">
              <ChartDrawing data={data} comparisonData={comparisonData} activeMetrics={activeMetrics} height={350} hidePoints={hidePoints} />
            </div>


            {/* Modal Footer */}
            <div className="border-t border-[#edeeef] px-6 py-4 sm:px-10 sm:py-6 bg-[#f8f9fa] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-[#727782]">
              <div className="flex flex-wrap gap-4 sm:gap-6">
                {defaultMetrics.map((m) => (
                  <label 
                    key={m.key} 
                    className="flex items-center gap-2 cursor-pointer group"
                  >
                    <div className="relative flex items-center justify-center">
                      <input
                        type="checkbox"
                        checked={visibleKeys.includes(m.key)}
                        onChange={() => toggleMetric(m.key)}
                        className="sr-only"
                      />
                      <div className={`h-4 w-4 rounded border-2 transition-all ${visibleKeys.includes(m.key) ? 'border-transparent' : 'border-[#c2c6d3]'}`} style={{ backgroundColor: visibleKeys.includes(m.key) ? m.color : 'transparent' }}>
                        {visibleKeys.includes(m.key) && (
                          <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </div>
                    </div>
                    <span className={`transition-colors ${visibleKeys.includes(m.key) ? 'text-[#191c1d]' : 'text-[#727782]/50'}`}>{m.label}</span>
                  </label>
                ))}
              </div>
              <span className="opacity-70 sm:opacity-100">Trend Accuracy Verified</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
