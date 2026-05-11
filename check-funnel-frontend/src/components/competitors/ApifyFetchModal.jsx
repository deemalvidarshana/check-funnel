import { useState, useEffect } from "react";

function CloseIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 6L6 18" strokeLinecap="round" />
      <path d="M6 6l12 12" strokeLinecap="round" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

export default function ApifyFetchModal({ open, onClose, platform, defaultResultsLimit, onFetch }) {
  const [urls, setUrls] = useState("");
  const [resultsAmount, setResultsAmount] = useState(100);
  const [includeTranscript, setIncludeTranscript] = useState(false);
  const [newerThan, setNewerThan] = useState("");
  const [olderThan, setOlderThan] = useState("");

  useEffect(() => {
    if (open) {
      setResultsAmount(defaultResultsLimit || 100);
    }
  }, [open, defaultResultsLimit]);

  if (!open) return null;

  const handleFetch = () => {
    const urlList = urls.split('\n').filter(u => u.trim());
    onFetch({
      urls: urlList,
      resultsAmount,
      includeTranscript,
      newerThan,
      olderThan
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-[32px] bg-white shadow-[0_30px_60px_-5px_rgba(0,0,0,0.15)] transition-all animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-8 pb-6 pt-8 sm:px-10">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-extrabold text-[#003870] sm:text-3xl">
                Fetch {platform} Data
              </h2>
              <p className="mt-1 font-medium text-slate-500">
                Configure real-time scraping parameters via Apify.
              </p>
            </div>
            <button 
              onClick={onClose} 
              className="flex h-10 w-10 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100"
            >
              <CloseIcon />
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="space-y-8 overflow-y-auto px-8 pb-10 sm:px-10">
          {/* URL Input */}
          <section>
            <div className="mb-4 flex items-center gap-2">
              <div className="h-5 w-1 rounded-full bg-[#003870]" />
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Bulk Edit URLs</h3>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-medium text-slate-400">Paste URLs separated by a new line.</p>
              <textarea
                value={urls}
                onChange={(e) => setUrls(e.target.value)}
                rows={4}
                placeholder={
                  platform?.toLowerCase() === 'tiktok' 
                    ? "https://www.tiktok.com/@username\nhttps://www.tiktok.com/@another_user" 
                    : platform?.toLowerCase() === 'instagram'
                      ? "https://www.instagram.com/username/"
                      : "https://www.facebook.com/page_name/"
                }
                className="w-full rounded-2xl border-none bg-[#f8f9fa] px-5 py-4 text-sm font-semibold text-slate-700 outline-none ring-1 ring-[#c2c6d3]/40 focus:ring-2 focus:ring-[#a8c8ff] transition-all placeholder:text-slate-300"
              />
              <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest text-right">
                {urls.split('\n').filter(u => u.trim()).length} URLs detected
              </p>
            </div>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Results Amount */}
            <section>
              <div className="mb-4 flex items-center gap-2">
                <div className="h-5 w-1 rounded-full bg-orange-500" />
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Results amount</h3>
              </div>
              <input
                type="number"
                value={resultsAmount}
                onChange={(e) => setResultsAmount(parseInt(e.target.value) || 0)}
                className="w-full rounded-2xl border-none bg-[#f8f9fa] px-5 py-4 text-sm font-semibold text-slate-700 outline-none ring-1 ring-[#c2c6d3]/40 focus:ring-2 focus:ring-[#a8c8ff] transition-all"
              />
            </section>

            {/* Video Transcript Toggle */}
            <section>
              <div className="mb-4 flex items-center gap-2">
                <div className="h-5 w-1 rounded-full bg-emerald-500" />
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Video Transcript</h3>
              </div>
              <div className="flex items-center gap-4 py-3">
                <button
                  type="button"
                  onClick={() => setIncludeTranscript(!includeTranscript)}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none ${includeTranscript ? 'bg-[#003870]' : 'bg-slate-200'}`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${includeTranscript ? 'translate-x-6' : 'translate-x-1'}`}
                  />
                </button>
                <span className="text-sm font-bold text-slate-600">
                  {includeTranscript ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </section>
          </div>

          {/* Time Frame */}
          <section>
            <div className="mb-6 flex items-center gap-2">
              <div className="h-5 w-1 rounded-full bg-blue-400" />
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Time frame</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Posts newer than</label>
                <div className="relative">
                  <input
                    type="date"
                    value={newerThan}
                    onChange={(e) => setNewerThan(e.target.value)}
                    className="w-full rounded-2xl border-none bg-[#f8f9fa] px-5 py-4 text-sm font-semibold text-slate-700 outline-none ring-1 ring-[#c2c6d3]/40 focus:ring-2 focus:ring-[#a8c8ff] transition-all"
                  />
                </div>
              </div>
              <div className="flex-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Posts older than</label>
                <div className="relative">
                  <input
                    type="date"
                    value={olderThan}
                    onChange={(e) => setOlderThan(e.target.value)}
                    className="w-full rounded-2xl border-none bg-[#f8f9fa] px-5 py-4 text-sm font-semibold text-slate-700 outline-none ring-1 ring-[#c2c6d3]/40 focus:ring-2 focus:ring-[#a8c8ff] transition-all"
                  />
                </div>
              </div>
            </div>
            <p className="mt-4 text-[10px] text-slate-400 font-medium italic">
              * Leave empty to scrape all available posts within the results limit.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 bg-white px-8 pb-8 pt-6 sm:px-10">
          <div className="flex items-center justify-end gap-4">
            <button 
              onClick={onClose} 
              className="rounded-full px-8 py-3.5 font-bold text-slate-500 transition-all hover:bg-slate-50"
            >
              Cancel
            </button>
            <button 
              onClick={handleFetch}
              className="rounded-full bg-[linear-gradient(135deg,#003870_0%,#014f99_100%)] px-10 py-3.5 font-bold text-white shadow-lg transition-all hover:shadow-xl hover:scale-[1.02] active:scale-95"
            >
              <span className="sm:hidden">Start</span>
              <span className="hidden sm:inline">Start Syncing Data</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
