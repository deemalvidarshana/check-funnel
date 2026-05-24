import React, { useState, useEffect } from "react";
import { FEATURE_OPTIONS } from "../../utils/permissions";

function CloseIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 6L6 18" strokeLinecap="round" />
      <path d="M6 6l12 12" strokeLinecap="round" />
    </svg>
  );
}

const ROLE_OPTIONS = [
  { value: "viewer", label: "VIEWER" },
  { value: "manager", label: "MANAGER" },
  { value: "admin", label: "ADMIN" },
];

const EditUserModal = ({ open, onClose, onSave, user }) => {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    role: "viewer",
    featureAccess: [],
  });
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);

  useEffect(() => {
    if (user && open) {
      setForm({
        fullName: user.fullName || "",
        email: user.email || "",
        role: user.role || "viewer",
        featureAccess: Array.isArray(user.featureAccess) ? user.featureAccess : [],
      });
      setRoleMenuOpen(false);
    }
  }, [user, open]);

  if (!open) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(user.id, {
      fullName: form.fullName,
      role: form.role,
      featureAccess: form.role === "manager" ? form.featureAccess : [],
    });
    onClose();
  };

  const selectedRole = ROLE_OPTIONS.find((option) => option.value === form.role) || ROLE_OPTIONS[0];
  const toggleFeature = (value) => {
    setForm((previous) => ({
      ...previous,
      featureAccess: previous.featureAccess.includes(value)
        ? previous.featureAccess.filter((item) => item !== value)
        : [...previous.featureAccess, value],
    }));
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
            <div className="relative w-full">
              <button
                type="button"
                onClick={() => setRoleMenuOpen((value) => !value)}
                className="flex w-full items-center justify-between gap-3 rounded-full border border-transparent bg-[#f3f4f5]/50 px-5 py-3 transition hover:bg-[#f3f4f5] focus:outline-none focus:ring-2 focus:ring-[#a8c8ff]"
              >
                <span className="flex min-w-0 items-center gap-3">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="shrink-0 text-[#003870]"
                  >
                    <path d="M12 3 4 7v6c0 5 3.4 7.7 8 8 4.6-.3 8-3 8-8V7l-8-4Z" />
                    <path d="m9 12 2 2 4-4" />
                  </svg>
                  <span className="truncate text-sm font-bold text-[#003870]">{selectedRole.label}</span>
                </span>
                <svg
                  width="14"
                  height="14"
                  className={`shrink-0 text-[#727782] transition-transform ${roleMenuOpen ? "rotate-180" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {roleMenuOpen && (
                <div className="absolute left-0 top-full z-50 mt-2 max-h-64 w-full overflow-y-auto rounded-2xl border border-[#c2c6d3]/20 bg-white shadow-xl animate-in fade-in slide-in-from-top-1 duration-200 no-scrollbar">
                  {ROLE_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        setForm({
                          ...form,
                          role: option.value,
                          featureAccess: option.value === "manager" ? form.featureAccess : [],
                        });
                        setRoleMenuOpen(false);
                      }}
                      className={`w-full px-4 py-2.5 text-left text-xs font-bold transition hover:bg-[#f3f4f5] ${
                        form.role === option.value ? "bg-[#003870]/5 text-[#003870]" : "text-[#727782]"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {form.role === "manager" && (
              <div className="mt-4 rounded-3xl border border-[#c2c6d3]/20 bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-xs font-extrabold uppercase tracking-wider text-[#727782]">
                    Feature Access
                  </p>
                  <div className="flex items-center gap-3 text-[10px] font-extrabold uppercase tracking-wider">
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, featureAccess: FEATURE_OPTIONS.map((feature) => feature.value) })}
                      className="text-[#003870]"
                    >
                      All
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, featureAccess: [] })}
                      className="text-[#727782]"
                    >
                      Clear
                    </button>
                  </div>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {FEATURE_OPTIONS.map((feature) => {
                    const selected = form.featureAccess.includes(feature.value);
                    return (
                      <button
                        key={feature.value}
                        type="button"
                        onClick={() => toggleFeature(feature.value)}
                        className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-xs font-extrabold transition-all ${
                          selected
                            ? "border-[#003870] bg-[#003870] text-white"
                            : "border-[#d8e4f2] bg-white text-[#27415f] hover:bg-[#f5f8fc]"
                        }`}
                      >
                        <span className={`flex h-4 w-4 items-center justify-center rounded border ${
                          selected ? "border-white/80" : "border-[#c2c6d3]"
                        }`}>
                          {selected && (
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </span>
                        {feature.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
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
