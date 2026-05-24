import { useState, useEffect } from "react";
import { getSystemSettings, updateSystemSettings } from "../../api/systemSettings";

function EyeIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  );
}

function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const borderColor = type === "success" ? "border-[#003870]" : "border-[#93000a]";
  const iconColor = type === "success" ? "text-[#003870]" : "text-[#93000a]";

  return (
    <div className={`fixed top-10 right-10 z-[1000] flex items-center gap-3 px-5 py-4 rounded-2xl bg-white border-l-4 ${borderColor} shadow-[0_20px_40px_-10px_rgba(0,0,0,0.15)] animate-in slide-in-from-top-4 duration-300`}>
       <div className={`${iconColor}`}>
         {type === "success" ? (
           <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
           </svg>
         ) : (
           <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
           </svg>
         )}
       </div>
       <p className="text-base font-bold text-[#191c1d] tracking-tight">{message}</p>
    </div>
  );
}

export default function UserSettingsModal({ open, onClose, mode = "full" }) {
  const [apifyApiKey, setApifyApiKey] = useState("");
  const [competitorAnalyzeMethod, setCompetitorAnalyzeMethod] = useState("upload");
  const [apifyDefaultResultsLimit, setApifyDefaultResultsLimit] = useState(100);
  const [openRouterApiKey, setOpenRouterApiKey] = useState("");
  const [openRouterModel, setOpenRouterModel] = useState("google/gemini-2.0-flash-001");
  const [lastModifiedBy, setLastModifiedBy] = useState("");
  const [updatedAt, setUpdatedAt] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [showOpenRouterKey, setShowOpenRouterKey] = useState(false);
  const [isMethodDropdownOpen, setIsMethodDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [toast, setToast] = useState(null);
  const isFullSettings = mode === "full";
  const isCompetitorSettings = mode === "competitors" || mode === "manager";
  const isAiSettings = mode === "ai";
  const title = isFullSettings
    ? "System Settings"
    : isCompetitorSettings
      ? "Competitor Settings"
      : "AI Settings";
  const description = isFullSettings
    ? "Configure global application parameters."
    : isCompetitorSettings
      ? "Configure competitor analysis parameters."
      : "Configure content calendar AI parameters.";

  useEffect(() => {
    if (open) {
      fetchSettings();
    }
  }, [open]);

  const fetchSettings = async () => {
    setFetching(true);
    try {
      const data = await getSystemSettings();
      setApifyApiKey(data.apifyApiKey || "");
      setOpenRouterApiKey(data.openRouterApiKey || "");
      setOpenRouterModel(data.openRouterModel || "google/gemini-2.0-flash-001");
      setCompetitorAnalyzeMethod(data.competitorAnalyzeMethod || "upload");
      setApifyDefaultResultsLimit(data.apifyDefaultResultsLimit || 100);
      setLastModifiedBy(data.lastModifiedBy || "");
      setUpdatedAt(data.updatedAt);
    } catch (err) {
      console.error("Failed to fetch settings", err);
      setToast({ message: "Failed to load settings.", type: "error" });
    } finally {
      setFetching(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const payload = isAiSettings
        ? {
            openRouterApiKey,
            openRouterModel,
          }
        : isCompetitorSettings
          ? {
              apifyApiKey,
              competitorAnalyzeMethod,
            }
        : {
            apifyApiKey,
            openRouterApiKey,
            openRouterModel,
            competitorAnalyzeMethod,
            apifyDefaultResultsLimit: Number(apifyDefaultResultsLimit),
          };

      await updateSystemSettings(payload);
      setToast({ message: "Settings saved successfully!", type: "success" });
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      console.error("Failed to save settings", err);
      setToast({ message: err.response?.data?.message || "Failed to save settings.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-[32px] bg-white p-8 shadow-[0_30px_60px_-5px_rgba(0,0,0,0.1)] transition-all animate-in zoom-in-95 duration-200">
        <div className="flex flex-col">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-extrabold text-[#003870] mb-2">
              {title}
            </h2>
            <p className="text-slate-500 text-sm font-medium">
              {description}
            </p>
          </div>

          {fetching ? (
            <div className="py-12 flex justify-center">
              <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {(isFullSettings || isCompetitorSettings) && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">
                    Apify API Key
                  </label>
                  <div className="relative">
                    <input
                      type={showApiKey ? "text" : "password"}
                      value={apifyApiKey}
                      onChange={(e) => setApifyApiKey(e.target.value)}
                      placeholder="Enter Apify API Key"
                      className="w-full px-5 py-4 rounded-2xl bg-[#f8f9fa] border-none ring-1 ring-[#c2c6d3]/40 focus:ring-2 focus:ring-[#a8c8ff] transition-all outline-none text-sm font-semibold text-slate-700 placeholder:text-slate-300 pr-12"
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#003870] transition-colors"
                    >
                      <EyeIcon />
                    </button>
                  </div>
                </div>
              )}

              {(isFullSettings || isAiSettings) && (
                <>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">
                  OpenRouter API Key
                </label>
                <div className="relative">
                  <input
                    type={showOpenRouterKey ? "text" : "password"}
                    value={openRouterApiKey}
                    onChange={(e) => setOpenRouterApiKey(e.target.value)}
                    placeholder="Enter OpenRouter API Key"
                    className="w-full px-5 py-4 rounded-2xl bg-[#f8f9fa] border-none ring-1 ring-[#c2c6d3]/40 focus:ring-2 focus:ring-[#a8c8ff] transition-all outline-none text-sm font-semibold text-slate-700 placeholder:text-slate-300 pr-12"
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowOpenRouterKey(!showOpenRouterKey)}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#003870] transition-colors"
                  >
                    <EyeIcon />
                  </button>
                </div>
              </div>

              {/* OpenRouter Model */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">
                  AI Model (OpenRouter)
                </label>
                <input
                  type="text"
                  value={openRouterModel}
                  onChange={(e) => setOpenRouterModel(e.target.value)}
                  placeholder="e.g. google/gemini-2.0-flash-001"
                  className="w-full px-5 py-4 rounded-2xl bg-[#f8f9fa] border-none ring-1 ring-[#c2c6d3]/40 focus:ring-2 focus:ring-[#a8c8ff] transition-all outline-none text-sm font-semibold text-slate-700 placeholder:text-slate-300"
                />
              </div>
                </>
              )}

              {(isFullSettings || isCompetitorSettings) && (
                <>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">
                      Competitor Analyze Method
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setIsMethodDropdownOpen(!isMethodDropdownOpen)}
                        className="w-full flex items-center justify-between px-5 py-4 rounded-2xl bg-[#f8f9fa] border-none ring-1 ring-[#c2c6d3]/40 focus:ring-2 focus:ring-[#a8c8ff] transition-all outline-none text-sm font-semibold text-slate-700"
                      >
                        <span className="capitalize">{competitorAnalyzeMethod}</span>
                        <svg 
                          width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" 
                          className={`text-slate-400 transition-transform ${isMethodDropdownOpen ? "rotate-180" : ""}`}
                        >
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </button>

                      {isMethodDropdownOpen && (
                        <div className="absolute left-0 right-0 top-full z-[110] mt-2 overflow-hidden rounded-2xl border border-[#c2c6d3]/20 bg-white shadow-xl animate-in fade-in zoom-in-95 duration-100">
                          <button
                            type="button"
                            onClick={() => {
                              setCompetitorAnalyzeMethod('upload');
                              setIsMethodDropdownOpen(false);
                            }}
                            className={`w-full px-5 py-3 text-left text-sm font-bold transition hover:bg-[#f3f4f5] ${
                              competitorAnalyzeMethod === 'upload' ? "text-[#003870] bg-[#003870]/5" : "text-slate-600"
                            }`}
                          >
                            Upload
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setCompetitorAnalyzeMethod('apify');
                              setIsMethodDropdownOpen(false);
                            }}
                            className={`w-full px-5 py-3 text-left text-sm font-bold transition hover:bg-[#f3f4f5] ${
                              competitorAnalyzeMethod === 'apify' ? "text-[#003870] bg-[#003870]/5" : "text-slate-600"
                            }`}
                          >
                            Apify
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {isFullSettings && <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">
                      Apify Default Results Limit
                    </label>
                    <input
                      type="number"
                      value={apifyDefaultResultsLimit}
                      onChange={(e) => setApifyDefaultResultsLimit(e.target.value)}
                      placeholder="Enter Default Limit"
                      className="w-full px-5 py-4 rounded-2xl bg-[#f8f9fa] border-none ring-1 ring-[#c2c6d3]/40 focus:ring-2 focus:ring-[#a8c8ff] transition-all outline-none text-sm font-semibold text-slate-700 placeholder:text-slate-300"
                    />
                  </div>}
                </>
              )}

              <div className="flex items-center gap-3 pt-4">
                <button
                  onClick={onClose}
                  className="flex-1 py-4 px-6 rounded-2xl font-bold text-slate-500 hover:bg-slate-50 transition-colors text-sm"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className={`flex-1 py-4 px-6 rounded-2xl font-bold text-white shadow-lg transition-all active:scale-95 text-sm ${
                    loading ? "bg-slate-300 cursor-not-allowed" : "bg-[#003870] shadow-blue-200 hover:bg-[#014f99]"
                  }`}
                >
                  {loading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
    </div>
  );
}
