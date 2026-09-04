import { useEffect, useMemo, useState } from "react";
import { getGoogleAnalyticsAccounts, testGoogleAnalyticsClient } from "../../api/googleAnalytics";

const fieldClassName =
  "w-full rounded-2xl border-none bg-white px-4 py-3 text-sm font-body text-[#191c1d] outline-none ring-1 ring-[#c2c6d3]/50 transition focus:ring-2 focus:ring-[#a8c8ff] disabled:cursor-not-allowed disabled:bg-[#f1f3f5] disabled:text-[#8a9099]";

export default function GoogleAnalyticsClientSection({ value, onChange, clientId }) {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    let active = true;
    getGoogleAnalyticsAccounts()
      .then((data) => { if (active) setAccounts(Array.isArray(data) ? data : []); })
      .catch((error) => { if (active) setMessage(error.response?.data?.message || "Connect Google Analytics in System Settings first."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const selectedAccount = useMemo(() => accounts.find((account) => account.id === value.accountId), [accounts, value.accountId]);
  const properties = selectedAccount?.properties || [];
  const updateField = (field, fieldValue) => {
    onChange({ ...value, [field]: fieldValue });
  };

  const selectAccount = (event) => {
    const account = accounts.find((item) => item.id === event.target.value);
    onChange({ ...value, accountId: account?.id || "", accountName: account?.name || "", propertyId: "", propertyName: "" });
    setMessage("");
  };

  const selectProperty = (event) => {
    const property = properties.find((item) => item.id === event.target.value);
    onChange({ ...value, propertyId: property?.id || "", propertyName: property?.name || "" });
    setMessage("");
  };

  const testConnection = async () => {
    if (!clientId) return setMessage("Create the client first, then edit it to test the saved property.");
    setTesting(true);
    try {
      const result = await testGoogleAnalyticsClient(clientId);
      setMessage(`Connected successfully. Active users (last 7 days): ${result.activeUsers}`);
    } catch (error) {
      setMessage(error.response?.data?.message || "Google Analytics connection test failed.");
    } finally { setTesting(false); }
  };

  return (
    <section className="space-y-4 rounded-3xl border border-[#c2c6d3]/20 bg-[#f8f9fa]/30 p-4 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e8f0fe] text-[#1a73e8]">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M6.5 17.5V12a2 2 0 0 1 4 0v5.5a2 2 0 0 1-4 0Z" fill="currentColor" opacity=".55" />
                <path d="M12 17.5V7.5a2 2 0 0 1 4 0v10a2 2 0 0 1-4 0Z" fill="currentColor" opacity=".78" />
                <circle cx="19" cy="18" r="2" fill="currentColor" />
              </svg>
            </span>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#727782]">Google Analytics Integration</h3>
              <p className="mt-0.5 text-[11px] font-medium text-[#727782]">Assign one GA4 property to this client.</p>
            </div>
          </div>
        </div>
        <span className="w-fit rounded-full border border-[#d8e4f2] bg-[#f5f8fc] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#003870]">
          Client specific
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-2 ml-1 block text-xs font-bold uppercase tracking-wider text-[#727782]">Analytics Account ID</span>
          <select
            value={value.accountId}
            onChange={selectAccount}
            disabled={loading || accounts.length === 0}
            className={fieldClassName}
          >
            <option value="">{loading ? "Loading accounts..." : "Select Analytics account"}</option>
            {accounts.map((account) => <option key={account.id} value={account.id}>{account.name} ({account.id})</option>)}
          </select>
        </label>

        <label className="block">
          <span className="mb-2 ml-1 block text-xs font-bold uppercase tracking-wider text-[#727782]">GA4 Property ID</span>
          <select
            value={value.propertyId}
            onChange={selectProperty}
            disabled={!selectedAccount}
            className={fieldClassName}
          >
            <option value="">Select GA4 property</option>
            {properties.map((property) => <option key={property.id} value={property.id}>{property.name} ({property.id})</option>)}
          </select>
        </label>

        <label className="block sm:col-span-2">
          <span className="mb-2 ml-1 block text-xs font-bold uppercase tracking-wider text-[#727782]">Property Display Name</span>
          <input
            type="text"
            value={value.propertyName}
            onChange={(event) => updateField("propertyName", event.target.value)}
            placeholder="e.g. Client Website - GA4"
            className={fieldClassName}
          />
        </label>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className={`text-[11px] font-semibold ${message.startsWith("Connected successfully") ? "text-emerald-700" : "text-[#727782]"}`}>{message}</p>
        <button type="button" onClick={testConnection} disabled={testing || !value.propertyId} className="shrink-0 rounded-full border border-[#d8e4f2] bg-white px-4 py-2 text-xs font-bold text-[#003870] disabled:cursor-not-allowed disabled:opacity-50">
          {testing ? "Testing..." : "Test Connection"}
        </button>
      </div>

      <div className="flex items-start gap-3 rounded-2xl border border-[#d8e4f2] bg-[#f5f8fc] p-3.5">
        <svg className="mt-0.5 h-4 w-4 shrink-0 text-[#003870]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 11v5M12 8h.01" strokeLinecap="round" />
        </svg>
        <p className="text-[11px] font-medium leading-5 text-[#5f6b7a]">
          Uses the Google OAuth connection configured in System Settings. These values map this client to its own GA4 property.
        </p>
      </div>
    </section>
  );
}
