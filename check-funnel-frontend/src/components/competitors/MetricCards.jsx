import React from 'react';

const icons = {
  users: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
      <circle cx="9" cy="7" r="4"></circle>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
    </svg>
  ),
  play: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <polygon points="10 8 16 12 10 16 10 8"></polygon>
    </svg>
  ),
  message: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
      <circle cx="8" cy="10" r="1"></circle>
      <circle cx="12" cy="10" r="1"></circle>
      <circle cx="16" cy="10" r="1"></circle>
    </svg>
  ),
  trophy: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path>
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path>
      <path d="M4 22h16"></path>
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path>
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path>
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path>
    </svg>
  ),
  flame: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path>
    </svg>
  ),
  video: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m22 8-6 4 6 4V8Z" />
      <rect width="14" height="12" x="2" y="6" rx="2" ry="2" />
    </svg>
  )
};

export default function MetricCards({ data, showProgress = true }) {
  return (
    <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {data.map((card, index) => {
        const hasToggle = card.onPrev && card.onNext;

        return (
        <div key={index} className="relative bg-white rounded-2xl border border-[#c2c6d3]/30 p-5 shadow-sm flex flex-col h-full hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-[#f0f5ff] text-[#2563eb] flex items-center justify-center shrink-0">
              {icons[card.icon]}
            </div>
            <div className={`min-w-0 flex-1 ${hasToggle ? 'pr-12' : ''}`}>
              <p className="text-[13px] font-bold text-[#727782] mb-0.5 truncate" title={card.title}>{card.title}</p>
              <h3 className="text-2xl font-black text-[#191c1d] tracking-tight">
                {String(card.value).split(' ')[0]}
                {String(card.value).includes(' ') && (
                  <span className="text-sm font-bold text-[#727782] ml-1 opacity-80">
                    {' ' + String(card.value).split(' ').slice(1).join(' ')}
                  </span>
                )}
              </h3>
            </div>
            {hasToggle && (
              <div className="absolute right-4 top-3 flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={card.onPrev}
                  className="flex h-6 w-6 items-center justify-center rounded-full text-[#727782] transition hover:bg-[#f3f4f5] hover:text-[#003870]"
                  title={card.toggleLabel || 'Switch metric'}
                  aria-label={card.toggleLabel || 'Switch metric'}
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={card.onNext}
                  className="flex h-6 w-6 items-center justify-center rounded-full text-[#727782] transition hover:bg-[#f3f4f5] hover:text-[#003870]"
                  title={card.toggleLabel || 'Switch metric'}
                  aria-label={card.toggleLabel || 'Switch metric'}
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}
          </div>
          
          <div className="mt-auto">
            <div className="flex items-center justify-between mb-2">
              {showProgress && (
                <>
                  <span className="text-[12px] font-bold text-[#727782]">Target {card.targetValue || '0'}+</span>
                  {card.change && card.change !== "0" && (
                    <div className={`flex items-center gap-1 text-[11px] font-bold ${card.isPositive ? 'text-green-600' : 'text-red-500'}`}>
                      <svg className={`w-3 h-3 ${!card.isPositive ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <polyline points="5 12 12 5 19 12" />
                      </svg>
                      {card.change}
                    </div>
                  )}
                </>
              )}
            </div>
            
            {/* Progress Bar */}
            {showProgress && (
              <div className="w-full h-1.5 bg-[#f1f5f9] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#2563eb] rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${Math.min(Math.max(card.progress || 0, 5), 100)}%` }}
                />
              </div>
            )}
          </div>
        </div>
        );
      })}
    </div>
  );
}
