import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Braces, FileSpreadsheet, FileText, Link2, Printer, Table2 } from 'lucide-react';

const DOWNLOAD_OPTIONS = [
  { format: 'xlsx', label: 'Excel (.xlsx)', Icon: FileSpreadsheet },
  { format: 'pdf', label: 'PDF (.pdf)', Icon: FileText },
  { format: 'csv', label: 'CSV (.csv)', Icon: Table2 },
  { format: 'json', label: 'JSON (.json)', Icon: Braces },
  { format: 'print', label: 'Print / Save PDF', Icon: Printer },
];

const CalendarHeader = ({
  view,
  setView,
  currentDate,
  onPrev,
  onNext,
  showViewToggle,
  onShare,
  shareLoading = false,
  shareCopied = false,
  shareDisabled = false,
  onDownload,
  downloadLoading = '',
  downloadDisabled = false,
  canManage = true,
}) => {
  const navigate = useNavigate();
  const [shareMenuOpen, setShareMenuOpen] = useState(false);
  const shareMenuRef = useRef(null);

  useEffect(() => {
    if (!shareMenuOpen) return undefined;
    const closeMenu = (event) => {
      if (!shareMenuRef.current?.contains(event.target)) setShareMenuOpen(false);
    };
    document.addEventListener('mousedown', closeMenu);
    return () => document.removeEventListener('mousedown', closeMenu);
  }, [shareMenuOpen]);

  const handleDownload = (format) => {
    setShareMenuOpen(false);
    onDownload?.(format);
  };

  const handleShare = () => {
    setShareMenuOpen(false);
    onShare?.();
  };

  return (
    <section className="flex min-w-0 flex-col justify-between gap-5 xl:flex-row xl:items-start">
      <div className="min-w-0 flex-1 space-y-2">
        <h1 className="text-3xl tracking-tight text-[#191c1d] min-[420px]:text-4xl xl:text-[40px] 2xl:text-5xl">
          <span className="font-extrabold">Content </span>
          <span className="font-medium">Calendar</span>
        </h1>
        <p className="mt-3 text-base leading-8 text-[#424751] sm:text-lg">
          Plan, schedule, and manage your cross-platform strategy.
        </p>
      </div>
      <div className="flex w-full min-w-0 flex-col items-stretch gap-3 xl:w-auto xl:shrink-0 xl:items-end">
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            {canManage && (
              <button
                onClick={() => navigate('/content-calendar/create')}
                className="bg-[#003870] text-white font-bold px-5 py-2.5 rounded-full flex items-center justify-center gap-2 hover:bg-[#003870]/90 hover:shadow-lg hover:shadow-[#003870]/20 transition-all active:scale-95 text-sm w-full sm:w-auto"
              >
                <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                Generate
              </button>
            )}
            {canManage && onShare && (
              <div className="relative w-full sm:w-auto" ref={shareMenuRef}>
                <button
                  type="button"
                  onClick={() => setShareMenuOpen((open) => !open)}
                  disabled={shareLoading || Boolean(downloadLoading)}
                  aria-haspopup="menu"
                  aria-expanded={shareMenuOpen}
                  className="flex w-full items-center justify-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-[#003870] transition-all hover:bg-slate-50 hover:shadow-lg hover:shadow-slate-200/60 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                >
                  {shareLoading || downloadLoading ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#003870] border-t-transparent" />
                  ) : (
                    <span className="material-symbols-outlined text-[18px]">
                      {shareCopied ? 'done' : 'ios_share'}
                    </span>
                  )}
                  {shareCopied ? 'Copied' : 'Share'}
                  {!shareLoading && !downloadLoading && (
                    <span className="material-symbols-outlined text-[15px]">expand_more</span>
                  )}
                </button>

                {shareMenuOpen && (
                  <div
                    role="menu"
                    className="absolute left-0 z-[70] mt-2 w-[min(220px,calc(100vw-2rem))] overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-900/10 sm:left-auto sm:right-0"
                  >
                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleShare}
                      disabled={shareDisabled}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#003870]/[0.07] text-[#003870]">
                        <Link2 className="h-3.5 w-3.5" strokeWidth={2.2} />
                      </span>
                      <span className="text-xs font-bold text-slate-800">Share link</span>
                    </button>

                    {onDownload && <div className="mx-2 my-1 border-t border-slate-100" />}
                    {onDownload && DOWNLOAD_OPTIONS.map((option) => {
                      const OptionIcon = option.Icon;
                      return (
                        <button
                          key={option.format}
                          type="button"
                          role="menuitem"
                          onClick={() => handleDownload(option.format)}
                          disabled={downloadDisabled}
                          className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#003870]/[0.07] text-[#003870]">
                            <OptionIcon className="h-3.5 w-3.5" strokeWidth={2.2} />
                          </span>
                          <span className="text-xs font-bold text-slate-800">{option.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Date Navigation */}
          <div className="flex items-center justify-between bg-white rounded-full p-1 shadow-sm border border-slate-100 w-full sm:w-auto">
            <button
              onClick={onPrev}
              className="p-2 rounded-full text-slate-400 hover:text-[#003870] hover:bg-slate-50 transition-colors material-symbols-outlined"
            >
              chevron_left
            </button>
            <span className="font-headline font-bold text-slate-800 min-w-[120px] text-center px-2 text-sm sm:text-base uppercase tracking-tight">
              {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </span>
            <button
              onClick={onNext}
              className="p-2 rounded-full text-slate-400 hover:text-[#003870] hover:bg-slate-50 transition-colors material-symbols-outlined"
            >
              chevron_right
            </button>
          </div>
        </div>

        {/* View Toggles */}
        {showViewToggle !== false && (
          <div className="flex w-full items-stretch justify-end gap-2 sm:w-auto">
            <div className="flex min-w-0 flex-1 justify-center rounded-full border border-slate-200/50 bg-slate-100/80 p-1 sm:flex-initial">
              <button
                onClick={() => setView('month')}
                className={`flex-1 rounded-full px-5 py-2 text-sm font-bold transition-all sm:flex-initial ${
                  view === 'month'
                    ? "bg-white shadow-sm text-[#003870]"
                    : "text-slate-500 hover:text-[#003870]"
                }`}
              >
                Month
              </button>
              <button
                onClick={() => setView('week')}
                className={`flex-1 rounded-full px-5 py-2 text-sm font-bold transition-all sm:flex-initial ${
                  view === 'week'
                    ? "bg-white shadow-sm text-[#003870]"
                    : "text-slate-500 hover:text-[#003870]"
                }`}
              >
                Week
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default CalendarHeader;
