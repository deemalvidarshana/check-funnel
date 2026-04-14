import { useState, useEffect } from "react";
import ClientFormField from "./ClientFormField";
import ChannelCheckbox from "./ChannelCheckbox";

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

export default function AddClientModal({ open, onClose, onCreate, initialData }) {
  const [form, setForm] = useState({
    clientName: "",
    monthlyTarget: "",
    hashtags: "",
    description: "",
    email: "",
    phone: "",
    facebook: false,
    instagram: true,
    tiktok: false,
    facebookApi: "",
    facebookPageId: "",
    instagramApi: "",
    instagramAccountId: "",
    tiktokApi: "",
    logo: null,
  });

  const [logoPreview, setLogoPreview] = useState(null);

  // Pre-fill form if initialData is present (Edit Mode)
  useEffect(() => {
    if (initialData && open) {
      // Helper to handle both JSON strings and already-parsed arrays
      const parseField = (val) => {
        if (!val) return [];
        if (Array.isArray(val)) return val;
        try { return JSON.parse(val); } catch (e) { return []; }
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
        facebook: active.includes("facebook"),
        instagram: active.includes("instagram"),
        tiktok: active.includes("tiktok"),
        facebookApi: initialData.facebookApiKey || "",
        facebookPageId: initialData.facebookPageId || "",
        instagramApi: initialData.instagramApiKey || "",
        instagramAccountId: initialData.instagramAccountId || "",
        tiktokApi: initialData.tiktokApiKey || "",
        logo: null,
      });

      // Show existing logo if available
      if (initialData.id) {
        setLogoPreview(`${import.meta.env.VITE_API_BASE_URL || '/api'}/clients/${initialData.id}/logo`);
      }
    } else if (open) {
      // Reset for Create Mode
      setForm({
        clientName: "",
        monthlyTarget: "",
        hashtags: "",
        description: "",
        email: "",
        phone: "",
        facebook: false,
        instagram: true,
        tiktok: false,
        facebookApi: "",
        facebookPageId: "",
        instagramApi: "",
        instagramAccountId: "",
        tiktokApi: "",
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
  const [showTk, setShowTk] = useState(false);

  if (!open) return null;

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = () => {
    if (onCreate) onCreate(form, initialData?.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      {/* overlay eka transparent. blur/dim ne */}
      <div
        className="absolute inset-0 bg-transparent"
        onClick={onClose}
      />

      <div className="relative z-10 flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-[28px] bg-[#ffffff] shadow-[0_30px_60px_-5px_rgba(25,28,29,0.10)]">
        {/* Header */}
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

            <button
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full text-[#424751] transition-colors hover:bg-[#e7e8e9]"
            >
              <CloseIcon />
            </button>
          </div>
        </div>

        {/* Scroll body */}
        <div className="space-y-10 overflow-y-auto px-6 pb-8 sm:px-10 sm:pb-10">
          {/* Company Logo */}
          <section>
            <div className="mb-6 flex items-center gap-2">
              <div className="h-6 w-1 rounded-full bg-[#014f99]" />
              <h3 className="font-headline text-lg font-bold text-[#191c1d]">
                Company Logo
              </h3>
            </div>

            <label className="group flex cursor-pointer items-center gap-6 rounded-[24px] border-2 border-dashed border-[#c2c6d3]/50 bg-[#f8f9fa]/80 p-6 transition-colors hover:border-[#a8c8ff]">
              <input type="file" accept="image/png, image/jpeg, image/svg+xml" className="hidden" onChange={handleLogoChange} />
              <div className="flex h-20 w-20 overflow-hidden items-center justify-center rounded-2xl bg-[#e7e8e9] text-[#727782] transition-colors group-hover:text-[#003870]">
                {logoPreview ? (
                  <img src={logoPreview} alt="Preview" className="h-full w-full object-cover" />
                ) : (
                  <PlusImageIcon />
                )}
              </div>

              <div>
                <p className="text-sm font-bold text-[#191c1d]">
                  {logoPreview ? "Change Brand Mark" : "Upload Brand Mark"}
                </p>
                <p className="text-xs text-[#424751]">
                  SVG, PNG or JPG (max. 800x800px)
                </p>
              </div>
            </label>
          </section>

          {/* Client Identity */}
          <section>
            <div className="mb-6 flex items-center gap-2">
              <div className="h-6 w-1 rounded-full bg-[#003870]" />
              <h3 className="font-headline text-lg font-bold text-[#191c1d]">
                Client Identity
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="md:col-span-2">
                <ClientFormField
                  label="Client Name"
                  placeholder="e.g. Zenith Media"
                  value={form.clientName}
                  onChange={(e) => updateField("clientName", e.target.value)}
                />
              </div>

              <ClientFormField
                label="Monthly Target Posts/Reels"
                type="number"
                placeholder="30"
                value={form.monthlyTarget}
                onChange={(e) => updateField("monthlyTarget", e.target.value)}
              />

              <ClientFormField
                label="Client Hashtags"
                placeholder="#brand #luxury"
                value={form.hashtags}
                onChange={(e) => updateField("hashtags", e.target.value)}
              />

              <div className="md:col-span-2">
                <ClientFormField
                  label="Short Description"
                  textarea
                  rows={3}
                  placeholder="Briefly describe the brand's niche and tone..."
                  value={form.description}
                  onChange={(e) => updateField("description", e.target.value)}
                />
              </div>
            </div>
          </section>

          {/* Contact & Social */}
          <section>
            <div className="mb-6 flex items-center gap-2">
              <div className="h-6 w-1 rounded-full bg-[#4553c1]" />
              <h3 className="font-headline text-lg font-bold text-[#191c1d]">
                Contact & Social
              </h3>
            </div>

            <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
              <ClientFormField
                label="Contact Email"
                type="email"
                placeholder="admin@client.com"
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
              />

              <ClientFormField
                label="Contact Phone"
                type="tel"
                placeholder="+1 (555) 000-0000"
                value={form.phone}
                onChange={(e) => updateField("phone", e.target.value)}
              />
            </div>

            <div>
              <label className="mb-3 ml-1 block text-xs font-bold uppercase tracking-wider text-[#727782]">
                Active Channels
              </label>

              <div className="flex flex-wrap gap-3">
                <ChannelCheckbox
                  label="Facebook"
                  checked={form.facebook}
                  onChange={(e) => updateField("facebook", e.target.checked)}
                />
                <ChannelCheckbox
                  label="Instagram"
                  checked={form.instagram}
                  onChange={(e) => updateField("instagram", e.target.checked)}
                />
                <ChannelCheckbox
                  label="TikTok"
                  checked={form.tiktok}
                  onChange={(e) => updateField("tiktok", e.target.checked)}
                />
              </div>
            </div>
          </section>

          {/* API Integrations */}
          <section>
            <div className="mb-6 flex items-center gap-2">
              <div className="h-6 w-1 rounded-full bg-[#622700]" />
              <h3 className="font-headline text-lg font-bold text-[#191c1d]">
                API Integrations
              </h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-2 ml-1 block text-xs font-bold uppercase tracking-wider text-[#727782]">
                  Facebook API Key
                </label>
                <div className="relative">
                  <input
                    type={showFb ? "text" : "password"}
                    value={form.facebookApi}
                    onChange={(e) => updateField("facebookApi", e.target.value)}
                    placeholder="Paste integration token here..."
                    className="w-full rounded-2xl border-none bg-[#f8f9fa] px-4 py-3 pr-12 font-body outline-none ring-1 ring-[#c2c6d3]/40 transition-all placeholder:text-[#727782]/50 focus:ring-2 focus:ring-[#a8c8ff]"
                  />
                    <button
                      type="button"
                      onClick={() => setShowFb(!showFb)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#727782] hover:text-[#003870]"
                    >
                      <EyeIcon />
                    </button>
                  </div>
                </div>
  
                <div>
                  <label className="mb-2 ml-1 block text-xs font-bold uppercase tracking-wider text-[#727782]">
                    Facebook Page ID
                  </label>
                  <input
                    type="text"
                    value={form.facebookPageId}
                    onChange={(e) => updateField("facebookPageId", e.target.value)}
                    placeholder="Enter Facebook Page ID..."
                    className="w-full rounded-2xl border-none bg-[#f8f9fa] px-4 py-3 font-body outline-none ring-1 ring-[#c2c6d3]/40 transition-all placeholder:text-[#727782]/50 focus:ring-2 focus:ring-[#a8c8ff]"
                  />
                </div>

              <div>
                <label className="mb-2 ml-1 block text-xs font-bold uppercase tracking-wider text-[#727782]">
                  Instagram API Key
                </label>
                <div className="relative">
                  <input
                    type={showIg ? "text" : "password"}
                    value={form.instagramApi}
                    onChange={(e) => updateField("instagramApi", e.target.value)}
                    placeholder="Paste integration token here..."
                    className="w-full rounded-2xl border-none bg-[#f8f9fa] px-4 py-3 pr-12 font-body outline-none ring-1 ring-[#c2c6d3]/40 transition-all placeholder:text-[#727782]/50 focus:ring-2 focus:ring-[#a8c8ff]"
                  />
                    <button
                      type="button"
                      onClick={() => setShowIg(!showIg)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#727782] hover:text-[#003870]"
                    >
                      <EyeIcon />
                    </button>
                  </div>
                </div>
  
                <div>
                  <label className="mb-2 ml-1 block text-xs font-bold uppercase tracking-wider text-[#727782]">
                    Instagram Account ID
                  </label>
                  <input
                    type="text"
                    value={form.instagramAccountId}
                    onChange={(e) => updateField("instagramAccountId", e.target.value)}
                    placeholder="Enter Instagram Account ID..."
                    className="w-full rounded-2xl border-none bg-[#f8f9fa] px-4 py-3 font-body outline-none ring-1 ring-[#c2c6d3]/40 transition-all placeholder:text-[#727782]/50 focus:ring-2 focus:ring-[#a8c8ff]"
                  />
                </div>

              <div>
                <label className="mb-2 ml-1 block text-xs font-bold uppercase tracking-wider text-[#727782]">
                  TikTok API Key
                </label>
                <div className="relative">
                  <input
                    type={showTk ? "text" : "password"}
                    value={form.tiktokApi}
                    onChange={(e) => updateField("tiktokApi", e.target.value)}
                    placeholder="Paste integration token here..."
                    className="w-full rounded-2xl border-none bg-[#f8f9fa] px-4 py-3 pr-12 font-body outline-none ring-1 ring-[#c2c6d3]/40 transition-all placeholder:text-[#727782]/50 focus:ring-2 focus:ring-[#a8c8ff]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowTk(!showTk)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#727782] hover:text-[#003870]"
                  >
                    <EyeIcon />
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="border-t border-[#c2c6d3]/20 bg-[#ffffff] px-6 pb-6 pt-5 sm:px-10 sm:pb-8 sm:pt-6">
          <div className="flex items-center justify-end gap-4">
            <button
              onClick={onClose}
              className="rounded-full px-8 py-3 font-bold text-[#424751] transition-all hover:bg-[#e7e8e9]"
            >
              Cancel
            </button>

            <button
              onClick={handleSubmit}
              className="rounded-full bg-[linear-gradient(135deg,#003870_0%,#014f99_100%)] px-10 py-3 font-bold text-white shadow-lg transition-all hover:shadow-xl active:scale-95"
            >
              {initialData ? "Save Changes" : "Create Client"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}