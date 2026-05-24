import React, { useEffect, useState } from "react";
import { FEATURE_OPTIONS } from "../../utils/permissions";

const CloseIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 6L6 18" strokeLinecap="round" />
    <path d="M6 6l12 12" strokeLinecap="round" />
  </svg>
);

const generatePassword = () => {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnopqrstuvwxyz";
  const numbers = "23456789";
  const symbols = "@$!%*#?&";
  const all = `${upper}${lower}${numbers}${symbols}`;
  const pick = (chars) => chars[Math.floor(Math.random() * chars.length)];

  const required = [pick(upper), pick(lower), pick(numbers), pick(symbols)];
  const remaining = Array.from({ length: 8 }, () => pick(all));

  return [...required, ...remaining]
    .sort(() => Math.random() - 0.5)
    .join("");
};

const UserFormField = ({ label, children }) => (
  <label className="block">
    <span className="mb-2 ml-1 block text-xs font-bold uppercase tracking-wider text-[#727782]">
      {label}
    </span>
    {children}
  </label>
);

const fieldClass = "w-full rounded-2xl border-none bg-[#f8f9fa] px-4 py-3 font-body font-medium text-[#191c1d] outline-none ring-1 ring-[#c2c6d3]/40 transition-all focus:bg-white focus:ring-2 focus:ring-[#a8c8ff]";
const ROLE_OPTIONS = [
  { value: "viewer", label: "VIEWER", description: "Standard access" },
  { value: "manager", label: "MANAGER", description: "Feature access" },
  { value: "admin", label: "ADMIN", description: "Full platform access" },
];

const CreateUserModal = ({ open, onClose, onCreate, createdCredentials }) => {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    role: "viewer",
    featureAccess: [],
    password: generatePassword(),
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);

  useEffect(() => {
    if (open && !createdCredentials) {
      setForm({
        fullName: "",
        email: "",
        role: "viewer",
        featureAccess: [],
        password: generatePassword(),
      });
      setCopied(false);
      setRoleMenuOpen(false);
    }
  }, [open, createdCredentials]);

  if (!open) return null;

  const credentialText = createdCredentials
    ? `Check Funnel login credentials\n\nLogin URL: ${window.location.origin}\nEmail: ${createdCredentials.email}\nPassword: ${createdCredentials.password}`
    : "";

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      await onCreate(form);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(credentialText);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  const selectedRole = ROLE_OPTIONS.find((option) => option.value === form.role) || ROLE_OPTIONS[0];
  const selectedFeatures = FEATURE_OPTIONS.filter((feature) => form.featureAccess.includes(feature.value));
  const featureLabel = selectedFeatures.length
    ? selectedFeatures.map((feature) => feature.label).join(", ")
    : "Select feature access";

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
      <div className="absolute inset-0 bg-transparent" onClick={onClose} />

      <div className="relative z-10 flex max-h-[calc(100vh-2rem)] w-full max-w-3xl flex-col overflow-hidden rounded-[28px] bg-[#ffffff] shadow-[0_30px_60px_-5px_rgba(25,28,29,0.10)] animate-in zoom-in-95 duration-300 sm:max-h-[calc(100vh-3rem)]">
        <div className="shrink-0 px-6 pb-3 pt-5 sm:px-10 sm:pb-4 sm:pt-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-headline text-2xl font-extrabold tracking-tight text-[#003870] sm:text-3xl">
                Create User
              </h2>
              <p className="mt-1 text-sm font-medium text-[#424751] sm:text-base">
                Add an approved account and share the login credentials.
              </p>
            </div>
            <button
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full text-[#424751] transition-colors hover:bg-[#e7e8e9]"
            >
              <CloseIcon />
            </button>
          </div>
        </div>

        {createdCredentials ? (
          <>
            <div className="min-h-0 space-y-6 overflow-y-auto px-6 pb-6 sm:px-10 sm:pb-7">
              <section>
                <div className="mb-6 flex items-center gap-2">
                  <div className="h-6 w-1 rounded-full bg-[#014f99]" />
                  <h3 className="font-headline text-lg font-bold text-[#191c1d]">Login Credentials</h3>
                </div>
                <div className="rounded-[24px] border border-[#d8e4f2] bg-[#f5f8fc] p-5">
                  <p className="text-sm font-extrabold text-[#003870]">User created successfully</p>
                  <p className="mt-1 text-xs font-medium leading-5 text-[#424751]">
                    Send these credentials to the user. The account is already approved for login.
                  </p>
                </div>

                <div className="mt-5 grid gap-5 rounded-[24px] border-2 border-dashed border-[#c2c6d3]/50 bg-[#f8f9fa]/80 p-6 sm:grid-cols-2">
                  <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#727782]">Email</p>
                    <p className="mt-1 break-all text-sm font-bold text-[#191c1d]">{createdCredentials.email}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#727782]">Password</p>
                    <p className="mt-1 break-all text-sm font-bold text-[#191c1d]">{createdCredentials.password}</p>
                  </div>
                </div>
              </section>
            </div>

            <div className="shrink-0 border-t border-[#c2c6d3]/20 bg-[#ffffff] px-6 pb-6 pt-5 sm:px-10 sm:pb-7">
              <div className="flex items-center justify-end gap-4">
              <button
                type="button"
                onClick={onClose}
                className="rounded-full px-8 py-3 font-bold text-[#424751] transition-all hover:bg-[#e7e8e9]"
              >
                Done
              </button>
              <button
                type="button"
                onClick={handleCopy}
                className="rounded-full bg-[linear-gradient(135deg,#003870_0%,#014f99_100%)] px-10 py-3 font-bold text-white shadow-lg transition-all hover:shadow-xl active:scale-95"
              >
                {copied ? "Copied" : "Copy Credentials"}
              </button>
              </div>
            </div>
          </>
        ) : (
          <form onSubmit={handleSubmit} className="flex min-h-0 flex-col">
            <div className="min-h-0 space-y-6 overflow-y-auto px-6 pb-6 sm:px-10 sm:pb-7">
              <section>
                <div className="mb-4 flex items-center gap-2">
                  <div className="h-6 w-1 rounded-full bg-[#003870]" />
                  <h3 className="font-headline text-lg font-bold text-[#191c1d]">User Identity</h3>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <UserFormField label="Full Name">
                      <input
                        type="text"
                        value={form.fullName}
                        onChange={(event) => setForm({ ...form, fullName: event.target.value })}
                        required
                        placeholder="e.g. Jane Cooper"
                        className={fieldClass}
                      />
                    </UserFormField>
                  </div>
                  <UserFormField label="Email Address">
                    <input
                      type="email"
                      value={form.email}
                      onChange={(event) => setForm({ ...form, email: event.target.value })}
                      required
                      placeholder="user@company.com"
                      className={fieldClass}
                    />
                  </UserFormField>
                  <UserFormField label="System Role">
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
                              <span className="flex items-center justify-between gap-3">
                                <span>{option.label}</span>
                                <span className="text-[10px] font-semibold uppercase tracking-wider opacity-60">
                                  {option.description}
                                </span>
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </UserFormField>
                </div>
                {form.role === "manager" && (
                  <div className="mt-5">
                    <UserFormField label="Feature Access">
                      <div className="rounded-3xl border border-[#c2c6d3]/20 bg-white shadow-sm">
                        <div className="flex items-center justify-between gap-4 border-b border-[#c2c6d3]/20 px-4 py-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-[#003870]">{featureLabel}</p>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-[#727782]">
                              {selectedFeatures.length} selected
                            </p>
                          </div>
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
                        <div className="grid gap-3 p-4 sm:grid-cols-2">
                          {FEATURE_OPTIONS.map((feature) => {
                            const selected = form.featureAccess.includes(feature.value);
                            return (
                              <button
                                key={feature.value}
                                type="button"
                                onClick={() => toggleFeature(feature.value)}
                                className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-sm font-extrabold transition-all ${
                                  selected
                                    ? "border-[#003870] bg-[#003870] text-white shadow-md shadow-[#003870]/15"
                                    : "border-[#d8e4f2] bg-white text-[#27415f] hover:bg-[#f5f8fc]"
                                }`}
                              >
                                <span className={`flex h-5 w-5 items-center justify-center rounded-md border ${
                                  selected ? "border-white/80 bg-white/10" : "border-[#c2c6d3]"
                                }`}>
                                  {selected && (
                                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                    </UserFormField>
                  </div>
                )}
              </section>

              <section>
                <div className="mb-4 flex items-center gap-2">
                  <div className="h-6 w-1 rounded-full bg-[#4553c1]" />
                  <h3 className="font-headline text-lg font-bold text-[#191c1d]">Login Credentials</h3>
                </div>
                <div className="rounded-3xl border border-[#c2c6d3]/20 bg-[#f8f9fa]/30 p-4">
                  <UserFormField label="Password">
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <input
                        type="text"
                        value={form.password}
                        onChange={(event) => setForm({ ...form, password: event.target.value })}
                        required
                        minLength={8}
                        className={`${fieldClass} min-w-0 flex-1`}
                      />
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, password: generatePassword() })}
                        className="rounded-2xl bg-[#003870] px-5 py-3 text-xs font-bold uppercase tracking-wider text-white transition-all hover:bg-[#014f99] active:scale-95"
                      >
                        Generate
                      </button>
                    </div>
                  </UserFormField>
                  <p className="mt-3 text-[10px] font-medium leading-relaxed text-[#727782]">
                    The account will be approved immediately. Share the generated credentials with the user after creation.
                  </p>
                </div>
              </section>
            </div>

            <div className="shrink-0 border-t border-[#c2c6d3]/20 bg-[#ffffff] px-6 pb-5 pt-4 sm:px-10 sm:pb-6">
              <div className="flex items-center justify-end gap-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full px-8 py-3 font-bold text-[#424751] transition-all hover:bg-[#e7e8e9]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-full bg-[linear-gradient(135deg,#003870_0%,#014f99_100%)] px-10 py-3 font-bold text-white shadow-lg transition-all hover:shadow-xl active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? "Creating..." : "Create User"}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default CreateUserModal;
