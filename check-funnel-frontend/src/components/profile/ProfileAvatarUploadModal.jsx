import { useState, useRef } from "react";
import { uploadAvatar } from "../../api/user";

export default function ProfileAvatarUploadModal({ open, onClose, onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  if (!open) return null;

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (!selectedFile.type.startsWith("image/")) {
        setError("Please select an image file.");
        return;
      }
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError("File size should be less than 5MB.");
        return;
      }
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setError("");
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("avatar", file);

    try {
      await uploadAvatar(formData);
      onUploadSuccess();
      onClose();
    } catch (err) {
      console.error("Upload failed", err);
      setError(err.response?.data?.message || "Failed to upload image. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-[32px] bg-white p-8 shadow-[0_30px_60px_-5px_rgba(0,0,0,0.1)] transition-all animate-in zoom-in-95 duration-200">
        <div className="flex flex-col items-center text-center">
          <h2 className="text-2xl font-extrabold text-[#003870] mb-2">
            Update Profile Photo
          </h2>
          <p className="text-slate-500 mb-8 text-sm font-medium">
            Choose a new photo to personalize your account.
          </p>

          {/* Preview Area */}
          <div 
            className="group relative w-32 h-32 mb-8 cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="w-full h-full rounded-full overflow-hidden border-4 border-blue-50 bg-slate-50 shadow-inner flex items-center justify-center">
              {preview ? (
                <img src={preview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <svg className="w-10 h-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              )}
            </div>
            <div className="absolute inset-0 rounded-full bg-slate-900/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*"
              onChange={handleFileChange}
            />
          </div>

          {error && (
            <div className="mb-6 px-4 py-2 bg-red-50 text-red-600 text-xs font-bold rounded-xl w-full">
              {error}
            </div>
          )}

          <div className="flex items-center gap-3 w-full">
            <button
              onClick={onClose}
              className="flex-1 py-4 px-6 rounded-2xl font-bold text-slate-500 hover:bg-slate-50 transition-colors text-sm"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={!file || loading}
              className={`flex-1 py-4 px-6 rounded-2xl font-bold text-white shadow-lg transition-all active:scale-95 text-sm ${
                !file || loading ? "bg-slate-300 cursor-not-allowed" : "bg-[#003870] shadow-blue-200 hover:bg-[#014f99]"
              }`}
            >
              {loading ? "Uploading..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
