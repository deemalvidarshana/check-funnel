import { useRef, useState } from "react";

function EyeIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.4-.18-2.06H12v3.9h5.38a4.6 4.6 0 0 1-2 3.02v2.53h3.24c1.9-1.75 2.98-4.33 2.98-7.39Z" />
      <path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.62-2.38l-3.24-2.53c-.9.6-2.05.96-3.38.96-2.6 0-4.8-1.76-5.59-4.12H3.07v2.6A10 10 0 0 0 12 22Z" />
      <path fill="#FBBC05" d="M6.41 13.93A6 6 0 0 1 6.1 12c0-.67.12-1.32.31-1.93v-2.6H3.07A10 10 0 0 0 2 12c0 1.61.39 3.14 1.07 4.53l3.34-2.6Z" />
      <path fill="#EA4335" d="M12 5.95c1.47 0 2.79.5 3.83 1.5l2.87-2.87A9.62 9.62 0 0 0 12 2a10 10 0 0 0-8.93 5.47l3.34 2.6C7.2 7.71 9.4 5.95 12 5.95Z" />
    </svg>
  );
}

function Field({ label, children }) {
  return (
    <div className="space-y-2">
      <label className="ml-1 text-xs font-bold uppercase tracking-widest text-slate-400">
        {label}
      </label>
      {children}
    </div>
  );
}

const inputClass =
  "w-full rounded-2xl border-none bg-[#f8f9fa] px-5 py-4 text-sm font-semibold text-slate-700 outline-none ring-1 ring-[#c2c6d3]/40 transition-all placeholder:text-slate-300 focus:ring-2 focus:ring-[#a8c8ff]";

export default function GoogleAnalyticsSettingsSection({ value, onChange, onConnect, connecting = false }) {
  const [showSecret, setShowSecret] = useState(false);
  const fileInputRef = useRef(null);

  const update = (field, nextValue) => {
    onChange({ ...value, [field]: nextValue });
  };

  const handleCredentialFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const parsed = JSON.parse(await file.text());
      const credentials = parsed.web || parsed.installed || {};
      onChange({
        ...value,
        clientId: credentials.client_id || value.clientId,
        clientSecret: credentials.client_secret || value.clientSecret,
        projectId: parsed.project_id || credentials.project_id || value.projectId,
        credentialFileName: file.name,
      });
    } catch {
      onChange({ ...value, credentialFileName: "Invalid credentials file" });
    } finally {
      event.target.value = "";
    }
  };

  const isConfigured = Boolean(value.clientId && (value.clientSecret || value.clientSecretConfigured));

  return (
    <section className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_14px_35px_-28px_rgba(15,23,42,0.55)] sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-50 ring-1 ring-slate-200">
            <GoogleIcon />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-[#003870]">Google Analytics Integration</h3>
            <p className="mt-1 max-w-md text-xs font-medium leading-5 text-slate-500">
              Configure the global OAuth client used to connect Analytics properties across all clients.
            </p>
          </div>
        </div>

        <span
          className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-2 text-[11px] font-extrabold uppercase tracking-wider ${
            isConfigured ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
          }`}
        >
          <span className={`h-2 w-2 rounded-full ${isConfigured ? "bg-emerald-500" : "bg-amber-500"}`} />
          {value.connected ? "Connected" : isConfigured ? "Ready to connect" : "Not configured"}
        </span>
      </div>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <Field label="Google Cloud Project ID">
          <input
            className={inputClass}
            value={value.projectId}
            onChange={(event) => update("projectId", event.target.value)}
            placeholder="massive-petal-507401-r3"
          />
        </Field>

        <Field label="OAuth Client ID">
          <input
            className={inputClass}
            value={value.clientId}
            onChange={(event) => update("clientId", event.target.value)}
            placeholder="Client ID"
          />
        </Field>

        <Field label="OAuth Client Secret">
          <div className="relative">
            <input
              type={showSecret ? "text" : "password"}
              className={`${inputClass} pr-12`}
              value={value.clientSecret}
              onChange={(event) => update("clientSecret", event.target.value)}
              placeholder="Client secret"
            />
            <button
              type="button"
              onClick={() => setShowSecret((current) => !current)}
              className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-[#003870]"
              aria-label={showSecret ? "Hide OAuth client secret" : "Show OAuth client secret"}
            >
              <EyeIcon />
            </button>
          </div>
        </Field>

        <Field label="OAuth Scope">
          <input
            className={`${inputClass} cursor-not-allowed text-slate-500`}
            value="analytics.readonly"
            readOnly
          />
        </Field>
      </div>

      <div className="mt-5 grid gap-5">
        <Field label="Local Redirect URI">
          <input
            className={inputClass}
            value={value.localRedirectUri}
            onChange={(event) => update("localRedirectUri", event.target.value)}
            placeholder="http://localhost:3000/google-analytics/callback"
          />
        </Field>

        <Field label="Production Redirect URI">
          <input
            className={inputClass}
            value={value.productionRedirectUri}
            onChange={(event) => update("productionRedirectUri", event.target.value)}
            placeholder="https://reports.checkfunnels.com/api/google-analytics/callback"
          />
        </Field>
      </div>

      <div className="mt-5 flex flex-col gap-3 rounded-2xl bg-[#f8f9fa] p-4 ring-1 ring-[#c2c6d3]/30 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-extrabold uppercase tracking-widest text-slate-500">OAuth credentials JSON</p>
          <p className="mt-1 truncate text-xs font-medium text-slate-400">
            {value.credentialFileName || "Upload the JSON downloaded from Google Cloud."}
          </p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          onChange={handleCredentialFile}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="shrink-0 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-extrabold text-[#003870] shadow-sm transition hover:border-blue-200 hover:bg-blue-50"
        >
          Upload JSON
        </button>
      </div>

      <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-extrabold text-slate-700">Google account connection</p>
          <p className="mt-1 text-xs font-medium text-slate-400">
            {value.connected ? `Connected${value.connectedEmail ? ` as ${value.connectedEmail}` : ""}.` : "Settings are saved before Google authorization starts."}
          </p>
        </div>
        <button
          type="button"
          disabled={!isConfigured || connecting}
          onClick={onConnect}
          className={`rounded-2xl px-5 py-3 text-sm font-extrabold transition ${
            isConfigured
              ? "bg-[#003870] text-white shadow-lg shadow-blue-100 hover:bg-[#014f99]"
              : "cursor-not-allowed bg-slate-200 text-slate-400"
          }`}
        >
          {connecting ? "Connecting..." : value.connected ? "Reconnect Google Analytics" : "Connect Google Analytics"}
        </button>
      </div>
    </section>
  );
}
