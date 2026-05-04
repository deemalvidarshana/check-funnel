import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import api from "../../api";

// ─── Toast ───────────────────────────────────────────────
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
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

// ─── SVG Icons ───────────────────────────────────────────
function CloseIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 6L6 18" strokeLinecap="round" />
      <path d="M6 6l12 12" strokeLinecap="round" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points="17,8 12,3 7,8" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="12" y1="3" x2="12" y2="15" strokeLinecap="round" />
    </svg>
  );
}

// Platform pill data
const PLATFORMS = [
  { key: "tiktok", label: "TikTok" },
  { key: "instagram", label: "Instagram" },
  { key: "facebook", label: "Facebook" },
];

export default function CSVUploadModal({ open, onClose, clientId, clientName }) {
  const [platform, setPlatform] = useState("tiktok");
  const [file, setFile] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [toast, setToast] = useState(null);

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setFile(null);
      setResult(null);
      setIsUploading(false);
    }
  }, [open]);

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
    }
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && (droppedFile.name.endsWith('.csv') || droppedFile.name.endsWith('.json'))) {
      setFile(droppedFile);
      setResult(null);
    }
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleUpload = async () => {
    if (!file || !clientId) return;

    setIsUploading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("platform", platform);
      formData.append("clientId", String(clientId));

      const response = await api.post("/competitors/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setResult(response.data);
      if (response.data.error) {
        setToast({ message: response.data.error, type: "error" });
      } else {
        setToast({
          message: `Successfully imported ${response.data.inserted} posts!`,
          type: "success",
        });
      }
    } catch (error) {
      const msg = error.response?.data?.message || error.message || "Upload failed";
      setToast({ message: msg, type: "error" });
    } finally {
      setIsUploading(false);
    }
  };

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-transparent" onClick={onClose} />
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-[28px] bg-[#ffffff] shadow-[0_30px_60px_-5px_rgba(25,28,29,0.10)]">
        
        {/* Header */}
        <div className="px-6 pb-5 pt-6 sm:px-10 sm:pb-6 sm:pt-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-headline text-2xl font-extrabold tracking-tight text-[#003870] sm:text-3xl">
                Upload Extension Data
              </h2>
              <p className="mt-1 font-medium text-[#424751]">
                Import competitor data from browser extensions for <span className="font-bold text-[#191c1d]">{clientName || "this client"}</span>.
              </p>
            </div>
            <button onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-full text-[#424751] transition-colors hover:bg-[#e7e8e9]">
              <CloseIcon />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="space-y-8 overflow-y-auto px-6 pb-8 sm:px-10 sm:pb-10">
          
          {/* Platform Selector */}
          <section>
            <div className="mb-4 flex items-center gap-2">
              <div className="h-6 w-1 rounded-full bg-[#014f99]" />
              <h3 className="font-headline text-lg font-bold text-[#191c1d]">Select Platform</h3>
            </div>
            <div className="flex flex-wrap gap-3">
              {PLATFORMS.map((p) => (
                <button
                  key={p.key}
                  onClick={() => setPlatform(p.key)}
                  className={`rounded-full px-6 py-2.5 text-sm font-bold transition-all duration-300 ${
                    platform === p.key
                      ? "bg-[#003870] text-white shadow-sm"
                      : "bg-[#f3f4f5] text-[#424751] hover:bg-[#e7e8e9]"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </section>

          {/* File Drop Zone */}
          <section>
            <div className="mb-4 flex items-center gap-2">
              <div className="h-6 w-1 rounded-full bg-[#003870]" />
              <h3 className="font-headline text-lg font-bold text-[#191c1d]">Upload CSV File</h3>
            </div>
            <label
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`group flex cursor-pointer flex-col items-center gap-4 rounded-[24px] border-2 border-dashed p-10 transition-colors ${
                isDragOver
                  ? "border-[#003870] bg-[#003870]/5"
                  : file
                  ? "border-[#003870]/30 bg-[#f5f8fc]"
                  : "border-[#c2c6d3]/50 bg-[#f8f9fa]/80 hover:border-[#a8c8ff]"
              }`}
            >
              <input
                type="file"
                accept=".csv,.json"
                className="hidden"
                onChange={handleFileSelect}
              />
              <div className={`flex h-16 w-16 items-center justify-center rounded-2xl transition-colors ${
                file ? "bg-[#003870]/10 text-[#003870]" : "bg-[#e7e8e9] text-[#727782] group-hover:text-[#003870]"
              }`}>
                <UploadIcon />
              </div>
              {file ? (
                <div className="text-center">
                  <p className="text-sm font-bold text-[#191c1d]">{file.name}</p>
                  <p className="text-xs text-[#727782] mt-1">
                    {(file.size / 1024).toFixed(1)} KB • Click to change file
                  </p>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-sm font-bold text-[#191c1d]">
                    Drop your CSV file here or <span className="text-[#003870]">browse</span>
                  </p>
                  <p className="text-xs text-[#727782] mt-1">
                    CSV or JSON files from TikTok, Instagram, or Facebook extensions
                  </p>
                </div>
              )}
            </label>
          </section>

          {/* Upload Result */}
          {result && !result.error && (
            <section className="rounded-3xl border border-[#c2c6d3]/20 bg-[#f8f9fa]/50 p-6">
              <div className="mb-4 flex items-center gap-2">
                <div className="h-6 w-1 rounded-full bg-[#4553c1]" />
                <h3 className="font-headline text-lg font-bold text-[#191c1d]">Upload Results</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl bg-white p-4 border border-[#c2c6d3]/20">
                  <p className="text-xs font-bold uppercase tracking-wider text-[#727782]">Inserted</p>
                  <p className="mt-1 text-3xl font-extrabold text-[#003870]">{result.inserted}</p>
                </div>
                <div className="rounded-2xl bg-white p-4 border border-[#c2c6d3]/20">
                  <p className="text-xs font-bold uppercase tracking-wider text-[#727782]">Skipped</p>
                  <p className="mt-1 text-3xl font-extrabold text-[#424751]">{result.skipped}</p>
                </div>
              </div>
              {result.autoCreated?.length > 0 && (
                <div className="mt-4 rounded-2xl bg-[#f5f8fc] p-4 border border-[#003870]/15">
                  <p className="text-xs font-bold uppercase tracking-wider text-[#003870] mb-2">Auto-Created Accounts</p>
                  <div className="flex flex-wrap gap-2">
                    {result.autoCreated.map((u) => (
                      <span key={u} className="rounded-full bg-white px-3 py-1 text-xs font-medium text-[#003870] border border-[#003870]/20">
                        @{u}
                      </span>
                    ))}
                  </div>
                  <p className="mt-2 text-[11px] text-[#424751]">
                    These accounts were automatically registered as competitor tracked accounts.
                  </p>
                </div>
              )}
            </section>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-[#c2c6d3]/20 bg-[#ffffff] px-6 pb-6 pt-5 sm:px-10 sm:pb-8 sm:pt-6">
          <div className="flex items-center justify-end gap-4">
            <button
              onClick={onClose}
              className="rounded-full px-8 py-3 font-bold text-[#424751] transition-all hover:bg-[#e7e8e9]"
            >
              {result ? "Close" : "Cancel"}
            </button>
            {!result && (
              <button
                onClick={handleUpload}
                disabled={!file || isUploading}
                className="rounded-full bg-[linear-gradient(135deg,#003870_0%,#014f99_100%)] px-10 py-3 font-bold text-white shadow-lg transition-all hover:shadow-xl active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isUploading ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Uploading...
                  </>
                ) : (
                  "Upload & Process"
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>,
    document.body
  );
}
