import React, { useState, useEffect } from "react";

function CloseIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 6L6 18" strokeLinecap="round" />
      <path d="M6 6l12 12" strokeLinecap="round" />
    </svg>
  );
}

const EditUserModal = ({ open, onClose, onSave, user }) => {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    role: "viewer",
  });

  useEffect(() => {
    if (user && open) {
      setForm({
        fullName: user.fullName || "",
        email: user.email || "",
        role: user.role || "viewer",
      });
    }
  }, [user, open]);

  if (!open) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(user.id, {
      fullName: form.fullName,
      role: form.role,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      {/* Overlay */}
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" onClick={onClose} />

      <div className="relative z-10 flex w-full max-w-lg flex-col overflow-hidden rounded-[28px] bg-white shadow-[0_30px_60px_-5px_rgba(25,28,29,0.15)] animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="px-6 pb-5 pt-6 sm:px-10 sm:pb-6 sm:pt-8 bg-slate-50/50 border-b border-slate-100">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-headline text-2xl font-extrabold tracking-tight text-[#003870] sm:text-3xl">
                Update User
              </h2>
              <p className="mt-1 font-medium text-[#424751]">
                Refine user permissions and profile identity.
              </p>
            </div>
            <button
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full text-[#424751] transition-colors hover:bg-slate-200"
            >
              <CloseIcon />
            </button>
          </div>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="px-6 py-8 sm:px-10 space-y-6">
          {/* Email (Disabled) */}
          <div className="space-y-2">
            <label className="ml-1 block text-xs font-bold uppercase tracking-wider text-[#727782]">
              Email Address (Fixed)
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.206" />
                </svg>
              </div>
              <input
                type="email"
                value={form.email}
                disabled
                className="w-full rounded-2xl border-none bg-[#f8f9fa] px-4 py-3 pl-11 font-medium text-slate-400 outline-none ring-1 ring-[#c2c6d3]/40 cursor-not-allowed opacity-70"
              />
            </div>
          </div>

          {/* Full Name */}
          <div className="space-y-2">
            <label className="ml-1 block text-xs font-bold uppercase tracking-wider text-[#727782]">
              Full Name
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <input
                type="text"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                placeholder="Enter full name"
                required
                className="w-full rounded-2xl border-none bg-[#f8f9fa] px-4 py-3 pl-11 font-medium text-slate-900 outline-none ring-1 ring-[#c2c6d3]/40 transition-all focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>
          </div>

          {/* Role Dropdown */}
          <div className="space-y-2">
            <label className="ml-1 block text-xs font-bold uppercase tracking-wider text-[#727782]">
              System Role
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full appearance-none rounded-2xl border-none bg-[#f8f9fa] px-4 py-3 pl-11 pr-10 font-medium text-slate-900 outline-none ring-1 ring-[#c2c6d3]/40 transition-all focus:ring-2 focus:ring-blue-500 focus:bg-white cursor-pointer"
              >
                <option value="admin">ADMIN</option>
                <option value="viewer">VIEWER</option>
              </select>
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-4 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full px-8 py-3 font-bold text-slate-500 transition-all hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-full bg-gradient-to-br from-[#003870] to-[#014f99] px-10 py-3 font-bold text-white shadow-lg transition-all hover:shadow-blue-900/20 hover:-translate-y-0.5 active:scale-95"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditUserModal;
