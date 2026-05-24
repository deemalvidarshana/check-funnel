import { useState, useEffect } from "react";
import ClientFormField from "./ClientFormField";
import ChannelCheckbox from "./ChannelCheckbox";
import api from "../../api";

// ---------------- Toast Component ----------------
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


function CloseIcon() {
  return (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M18 6L6 18" strokeLinecap="round" />
      <path d="M6 6l12 12" strokeLinecap="round" />
    </svg>
  );
}

function PlusImageIcon() {
  return (
    <svg
      className="h-8 w-8"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M8 13l2.5-2.5L14 14l2-2 3 3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 8v4M10 10h4" strokeLinecap="round" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  );
}

function DropdownChevronIcon({ isOpen }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`text-[#727782] transition-transform ${isOpen ? "rotate-180" : ""}`}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function ResponsiblePersonDropdown({ value, label, users, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedLabel = label || "Select responsible person";

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="flex w-full items-center justify-between rounded-2xl border-none bg-[#f8f9fa] px-4 py-3 font-body text-[#191c1d] outline-none ring-1 ring-[#c2c6d3]/40 transition-all hover:bg-[#f3f4f5] focus:ring-2 focus:ring-[#a8c8ff]"
      >
        <span className={`truncate ${value ? "text-[#191c1d]" : "text-[#727782]/70"}`}>
          {selectedLabel}
        </span>
        <DropdownChevronIcon isOpen={isOpen} />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full z-[120] mt-2 max-h-56 overflow-y-auto rounded-2xl border border-[#c2c6d3]/20 bg-white py-2 shadow-xl animate-in fade-in slide-in-from-top-1 duration-200">
          <button
            type="button"
            onClick={() => {
              onChange("", "");
              setIsOpen(false);
            }}
            className={`w-full px-4 py-3 text-left text-sm font-bold transition hover:bg-[#f3f4f5] ${
              !value ? "bg-[#003870]/5 text-[#003870]" : "text-[#727782]"
            }`}
          >
            Select responsible person
          </button>
          {users.map((user) => (
            <button
              key={user.id}
              type="button"
              onClick={() => {
                onChange(String(user.id), user.fullName);
                setIsOpen(false);
              }}
              className={`w-full px-4 py-3 text-left text-sm font-bold transition hover:bg-[#f3f4f5] ${
                String(user.id) === value ? "bg-[#003870]/5 text-[#003870]" : "text-[#727782]"
              }`}
            >
              {user.fullName}
            </button>
          ))}
          {users.length === 0 && (
            <div className="px-4 py-3 text-sm font-bold text-[#727782]">
              No users available
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AddClientModal({ open, onClose, onCreate, initialData, users = [] }) {
  const [form, setForm] = useState({
    clientName: "",
    monthlyTarget: "",
    hashtags: "",
    description: "",
    email: "",
    phone: "",
    responsiblePersonId: "",
    responsiblePersonName: "",
    facebook: false,
    instagram: true,
    tiktok: false,
    facebookApi: "",
    facebookPageId: "",
    instagramApi: "",
    instagramAccountId: "",
    tiktokApi: "",
    tiktokClientKey: "",
    tiktokClientSecret: "",
    tiktokRefreshToken: "",
    logo: null,
  });

  const [toast, setToast] = useState(null);

  const [logoPreview, setLogoPreview] = useState(null);

  const [manualUrl, setManualUrl] = useState("");
  const [isExchanging, setIsExchanging] = useState(false);
  const [tkDisplayName, setTkDisplayName] = useState("");


  useEffect(() => {
    if (initialData && open) {


      const parseField = (val) => {
        if (!val) return [];
        if (Array.isArray(val)) return val;
        try { return JSON.parse(val); } catch { return []; }
      };

      const active = parseField(initialData.activeChannels);
      const tagsArray = parseField(initialData.hashtags);
      const tagsString = Array.isArray(tagsArray) ? tagsArray.join(" ") : "";

      setForm({
        clientName: initialData.name || "",
        monthlyTarget: initialData.monthlyTargetPosts || "",
        hashtags: tagsString,
        description: initialData.shortDescription || "",
        email: initialData.contactEmail || "",
        phone: initialData.contactPhone || "",
        responsiblePersonId: initialData.responsiblePersonId ? String(initialData.responsiblePersonId) : "",
        responsiblePersonName: initialData.responsiblePersonName || "",
        facebook: active.includes("facebook"),
        instagram: active.includes("instagram"),
        tiktok: active.includes("tiktok"),
        facebookApi: initialData.facebookApiKey || "",
        facebookPageId: initialData.facebookPageId || "",
        instagramApi: initialData.instagramApiKey || "",
        instagramAccountId: initialData.instagramAccountId || "",
        tiktokApi: initialData.tiktokApiKey || "",
        tiktokClientKey: initialData.tiktokClientKey || "",
        tiktokClientSecret: initialData.tiktokClientSecret || "",
        tiktokRefreshToken: initialData.tiktokRefreshToken || "",
        logo: null,
      });

      if (initialData.id) {
        setLogoPreview(`${import.meta.env.VITE_API_BASE_URL || '/api'}/clients/${initialData.id}/logo`);
      }
    } else if (open) {
      setForm({
        clientName: "",
        monthlyTarget: "",
        hashtags: "",
        description: "",
        email: "",
        phone: "",
        responsiblePersonId: "",
        responsiblePersonName: "",
        facebook: false,
        instagram: true,
        tiktok: false,
        facebookApi: "",
        facebookPageId: "",
        instagramApi: "",
        instagramAccountId: "",
        tiktokApi: "",
        tiktokClientKey: "",
        tiktokClientSecret: "",
        tiktokRefreshToken: "",
        logo: null,
      });
      setLogoPreview(null);
    }
  }, [initialData, open]);

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setForm((prev) => ({ ...prev, logo: file }));
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const [showFb, setShowFb] = useState(false);
  const [showIg, setShowIg] = useState(false);
  const responsibleUsers = users.filter((user) => user.status !== "pending" && user.status !== "rejected");

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleResponsiblePersonChange = (selectedId, selectedName) => {
    setForm((prev) => ({
      ...prev,
      responsiblePersonId: selectedId,
      responsiblePersonName: selectedName,
    }));
  };

  const handleSubmit = () => {
    if (onCreate) onCreate(form, initialData?.id);
    onClose();
  };

  const handleConnectTiktok = () => {
    if (!form.tiktokClientKey) {
      setToast({ message: "Please enter your TikTok Client Key first.", type: "error" });
      return;
    }
    const width = 600;
    const height = 700;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    
    // Generating the direct TikTok URL exactly like tiktok.py
    const scope = "user.info.basic,user.info.profile,user.info.stats,video.list";
    const redirectUri = "https://deemalvidarshana.github.io/deemal/";
    const state = "deemal_state";
    
    const authUrl = `https://www.tiktok.com/v2/auth/authorize/?client_key=${form.tiktokClientKey}&scope=${encodeURIComponent(scope)}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;
    
    window.open(authUrl, 'Connect TikTok', `width=${width},height=${height},left=${left},top=${top}`);
  };




  const handleManualUrlExchange = async (url) => {
    if (!url) return;
    
    let code = "";
    try {
      if (url.includes('code=')) {
        const urlObj = new URL(url.startsWith('http') ? url : `https://temp.com/${url.startsWith('?') ? '' : '?'}${url}`);
        code = urlObj.searchParams.get('code');
      } else if (url.length > 10) {
        // If it's a long string without "code=", assume it's the code itself
        code = url;
      }
      
      if (code && !isExchanging) {
        setIsExchanging(true);
        const response = await api.post('/clients/tiktok/exchange', {
          code,
          clientKey: form.tiktokClientKey,
          clientSecret: form.tiktokClientSecret
        });
        
        if (response.data?.access_token) {
          updateField('tiktokApi', response.data.access_token);
          updateField('tiktokRefreshToken', response.data.refresh_token);
          setTkDisplayName(response.data.displayName || "Connected");
          setManualUrl("");
          setToast({ message: `TikTok connected successfully as ${response.data.displayName || 'Account'}!`, type: "success" });
        } else {
          setToast({ message: "TikTok returned no access token. check your credentials.", type: "error" });
        }
      } else {
        setToast({ message: "Could not find an authorization code in the URL you pasted.", type: "error" });
      }
    } catch (error) {
      console.error("Exchange error:", error.response?.data || error.message);
      const msg = error.response?.data?.message || error.message;
      setToast({ message: `Connection failed: ${msg}`, type: "error" });
    } finally {
      setIsExchanging(false);
    }
  };




  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data?.type === 'TIKTOK_TOKEN') {
        const { access_token, refresh_token } = event.data.data;
        updateField('tiktokApi', access_token);
        updateField('tiktokRefreshToken', refresh_token);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  if (!open) return null;

  return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
        <div className="absolute inset-0 bg-transparent" onClick={onClose} />
        <div className="relative z-10 flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-[28px] bg-[#ffffff] shadow-[0_30px_60px_-5px_rgba(25,28,29,0.10)]">
        <div className="px-6 pb-5 pt-6 sm:px-10 sm:pb-6 sm:pt-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-headline text-2xl font-extrabold tracking-tight text-[#003870] sm:text-3xl">
                {initialData ? "Update Client" : "Add New Client"}
              </h2>
              <p className="mt-1 font-medium text-[#424751]">
                {initialData ? "Refine brand strategy and channel focus." : "Onboard a new brand to your curation engine."}
              </p>
            </div>
            <button onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-full text-[#424751] transition-colors hover:bg-[#e7e8e9]">
              <CloseIcon />
            </button>
          </div>
        </div>

        <div className="space-y-10 overflow-y-auto px-6 pb-8 sm:px-10 sm:pb-10">
          <section>
            <div className="mb-6 flex items-center gap-2">
              <div className="h-6 w-1 rounded-full bg-[#014f99]" />
              <h3 className="font-headline text-lg font-bold text-[#191c1d]">Company Logo</h3>
            </div>
            <label className="group flex cursor-pointer items-center gap-6 rounded-[24px] border-2 border-dashed border-[#c2c6d3]/50 bg-[#f8f9fa]/80 p-6 transition-colors hover:border-[#a8c8ff]">
              <input type="file" accept="image/png, image/jpeg, image/svg+xml" className="hidden" onChange={handleLogoChange} />
              <div className="flex h-20 w-20 overflow-hidden items-center justify-center rounded-2xl bg-[#e7e8e9] text-[#727782] transition-colors group-hover:text-[#003870]">
                {logoPreview ? <img src={logoPreview} alt="Preview" className="h-full w-full object-cover" /> : <PlusImageIcon />}
              </div>
              <div>
                <p className="text-sm font-bold text-[#191c1d]">{logoPreview ? "Change Brand Mark" : "Upload Brand Mark"}</p>
                <p className="text-xs text-[#424751]">SVG, PNG or JPG (max. 800x800px)</p>
              </div>
            </label>
          </section>

          <section>
            <div className="mb-6 flex items-center gap-2">
              <div className="h-6 w-1 rounded-full bg-[#003870]" />
              <h3 className="font-headline text-lg font-bold text-[#191c1d]">Client Identity</h3>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="md:col-span-2">
                <ClientFormField label="Client Name" placeholder="e.g. Zenith Media" value={form.clientName} onChange={(e) => updateField("clientName", e.target.value)} />
              </div>
              <ClientFormField label="Monthly Target Posts/Reels" type="number" placeholder="30" value={form.monthlyTarget} onChange={(e) => updateField("monthlyTarget", e.target.value)} />
              <ClientFormField label="Client Hashtags" placeholder="#brand #luxury" value={form.hashtags} onChange={(e) => updateField("hashtags", e.target.value)} />
              <div className="md:col-span-2">
                <label className="mb-2 ml-1 block text-xs font-bold uppercase tracking-wider text-[#727782]">
                  Responsible Person
                </label>
                <ResponsiblePersonDropdown
                  value={form.responsiblePersonId}
                  label={form.responsiblePersonName}
                  users={responsibleUsers}
                  onChange={handleResponsiblePersonChange}
                />
              </div>
              <div className="md:col-span-2">
                <ClientFormField label="Short Description" textarea rows={3} placeholder="Briefly describe the brand's niche and tone..." value={form.description} onChange={(e) => updateField("description", e.target.value)} />
              </div>
            </div>
          </section>

          <section>
            <div className="mb-6 flex items-center gap-2">
              <div className="h-6 w-1 rounded-full bg-[#4553c1]" />
              <h3 className="font-headline text-lg font-bold text-[#191c1d]">Contact & Social</h3>
            </div>
            <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
              <ClientFormField label="Contact Email" type="email" placeholder="admin@client.com" value={form.email} onChange={(e) => updateField("email", e.target.value)} />
              <ClientFormField label="Contact Phone" type="tel" placeholder="+1 (555) 000-0000" value={form.phone} onChange={(e) => updateField("phone", e.target.value)} />
            </div>
            <div>
              <label className="mb-3 ml-1 block text-xs font-bold uppercase tracking-wider text-[#727782]">Active Channels</label>
              <div className="flex flex-wrap gap-3">
                <ChannelCheckbox label="Facebook" checked={form.facebook} onChange={(e) => updateField("facebook", e.target.checked)} />
                <ChannelCheckbox label="Instagram" checked={form.instagram} onChange={(e) => updateField("instagram", e.target.checked)} />
                <ChannelCheckbox label="TikTok" checked={form.tiktok} onChange={(e) => updateField("tiktok", e.target.checked)} />
              </div>
            </div>
          </section>

          <section>
            <div className="mb-6 flex items-center gap-2">
              <div className="h-6 w-1 rounded-full bg-[#622700]" />
              <h3 className="font-headline text-lg font-bold text-[#191c1d]">API Integrations</h3>
            </div>
            <div className="space-y-6">
              {/* Facebook */}
              <div className="space-y-4">
                <div>
                  <label className="mb-2 ml-1 block text-xs font-bold uppercase tracking-wider text-[#727782]">Facebook API Key</label>
                  <div className="relative">
                    <input type={showFb ? "text" : "password"} value={form.facebookApi} onChange={(e) => updateField("facebookApi", e.target.value)} placeholder="Paste integration token..." className="w-full rounded-2xl border-none bg-[#f8f9fa] px-4 py-3 pr-12 font-body outline-none ring-1 ring-[#c2c6d3]/40 focus:ring-2 focus:ring-[#a8c8ff]" />
                    <button type="button" onClick={() => setShowFb(!showFb)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#727782] hover:text-[#003870]"><EyeIcon /></button>
                  </div>
                </div>
                <div>
                  <label className="mb-2 ml-1 block text-xs font-bold uppercase tracking-wider text-[#727782]">Facebook Page ID</label>
                  <input type="text" value={form.facebookPageId} onChange={(e) => updateField("facebookPageId", e.target.value)} placeholder="Enter Page ID..." className="w-full rounded-2xl border-none bg-[#f8f9fa] px-4 py-3 font-body outline-none ring-1 ring-[#c2c6d3]/40 focus:ring-2 focus:ring-[#a8c8ff]" />
                </div>
              </div>

              {/* Instagram */}
              <div className="space-y-4">
                <div>
                  <label className="mb-2 ml-1 block text-xs font-bold uppercase tracking-wider text-[#727782]">Instagram API Key</label>
                  <div className="relative">
                    <input type={showIg ? "text" : "password"} value={form.instagramApi} onChange={(e) => updateField("instagramApi", e.target.value)} placeholder="Paste integration token..." className="w-full rounded-2xl border-none bg-[#f8f9fa] px-4 py-3 pr-12 font-body outline-none ring-1 ring-[#c2c6d3]/40 focus:ring-2 focus:ring-[#a8c8ff]" />
                    <button type="button" onClick={() => setShowIg(!showIg)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#727782] hover:text-[#003870]"><EyeIcon /></button>
                  </div>
                </div>
                <div>
                  <label className="mb-2 ml-1 block text-xs font-bold uppercase tracking-wider text-[#727782]">Instagram Account ID</label>
                  <input type="text" value={form.instagramAccountId} onChange={(e) => updateField("instagramAccountId", e.target.value)} placeholder="Enter Account ID..." className="w-full rounded-2xl border-none bg-[#f8f9fa] px-4 py-3 font-body outline-none ring-1 ring-[#c2c6d3]/40 focus:ring-2 focus:ring-[#a8c8ff]" />
                </div>
              </div>

              {/* TikTok */}
              <div className="space-y-4 rounded-3xl border border-[#c2c6d3]/20 bg-[#f8f9fa]/30 p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <label className="mb-2 ml-1 block text-xs font-bold uppercase tracking-wider text-[#727782]">TikTok App Integration</label>
                  <button type="button" onClick={handleConnectTiktok} className="flex items-center gap-2 rounded-full bg-[#003870] px-4 py-1.5 text-xs font-bold text-white transition-all hover:bg-[#014f99] active:scale-95">
                    <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1 .05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.04-.1z"/>
                    </svg>
                    Connect TikTok
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <ClientFormField 
                    label="TikTok Client Key" 
                    placeholder="Enter Client Key..." 
                    value={form.tiktokClientKey} 
                    onChange={(e) => updateField("tiktokClientKey", e.target.value)} 
                  />
                  <ClientFormField 
                    label="TikTok Client Secret" 
                    type="password" 
                    placeholder="Enter Client Secret..." 
                    value={form.tiktokClientSecret} 
                    onChange={(e) => updateField("tiktokClientSecret", e.target.value)} 
                  />
                </div>
                <div className="mt-4 space-y-3">
                  <div>
                    <p className="mb-2 ml-1 block text-xs font-bold uppercase tracking-wider text-[#727782]">Step 2: Paste Redirected URL</p>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => handleManualUrlExchange(manualUrl)}
                        disabled={isExchanging || !manualUrl}
                        className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-[#003870] text-white transition-all hover:bg-[#014f99] disabled:cursor-not-allowed disabled:bg-[#b8cce3]"
                        aria-label="Link TikTok account"
                      >
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M5 12h12" strokeLinecap="round" />
                          <path d="m13 6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                      <input
                        type="text"
                        value={manualUrl}
                        onChange={(e) => setManualUrl(e.target.value)}
                        placeholder="Paste the full URL from your browser address bar here..."
                        className="w-full rounded-2xl border-none bg-[#f8f9fa] px-4 py-3 pr-14 text-sm font-body outline-none ring-1 ring-[#c2c6d3]/40 focus:ring-2 focus:ring-[#a8c8ff]"
                      />
                    </div>
                    {isExchanging && <p className="mt-2 text-[10px] text-[#003870] animate-pulse">Please wait, linking account...</p>}
                  </div>

                  {form.tiktokApi && (
                    <div className="rounded-2xl border border-[#d8e4f2] bg-[#f5f8fc] p-4">
                      <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-[#003870]">Status</p>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-[#7aa7d9] animate-pulse"></div>
                        <p className="text-xs font-medium text-[#1f2937]">
                          Connected: <span className="font-bold">{tkDisplayName || 'TikTok Account'}</span>
                        </p>
                      </div>
                      <p className="mt-1 text-[9px] text-[#5f6b7a]">The access token is handled securely in the background.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

        </div>

        <div className="border-t border-[#c2c6d3]/20 bg-[#ffffff] px-6 pb-6 pt-5 sm:px-10 sm:pb-8 sm:pt-6">
          <div className="flex items-center justify-end gap-4">
            <button onClick={onClose} className="rounded-full px-8 py-3 font-bold text-[#424751] transition-all hover:bg-[#e7e8e9]">Cancel</button>
            <button onClick={handleSubmit} className="rounded-full bg-[linear-gradient(135deg,#003870_0%,#014f99_100%)] px-10 py-3 font-bold text-white shadow-lg transition-all hover:shadow-xl active:scale-95">
              {initialData ? "Save Changes" : "Create Client"}
            </button>
          </div>
        </div>
        </div>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </div>
  );
}
