import { useState } from 'react';
import { Link2, X } from 'lucide-react';

const LINK_FIELDS = [
  {
    key: 'facebookUrl',
    label: 'Facebook Link',
    placeholder: 'https://www.facebook.com/brand',
  },
  {
    key: 'instagramUrl',
    label: 'Instagram Link',
    placeholder: 'https://www.instagram.com/brand',
  },
  {
    key: 'tiktokUrl',
    label: 'TikTok Link',
    placeholder: 'https://www.tiktok.com/@brand',
  },
];

export default function PlatformLinksModal({ open, client, onClose, onSave, saving = false }) {
  const [form, setForm] = useState(() => ({
    facebookUrl: client?.facebookUrl || '',
    instagramUrl: client?.instagramUrl || '',
    tiktokUrl: client?.tiktokUrl || '',
  }));

  if (!open) return null;

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSave({
      facebookUrl: form.facebookUrl.trim(),
      instagramUrl: form.instagramUrl.trim(),
      tiktokUrl: form.tiktokUrl.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <form
        onSubmit={handleSubmit}
        className="relative z-10 w-full max-w-xl overflow-hidden rounded-[32px] bg-white p-8 shadow-[0_30px_60px_-5px_rgba(0,0,0,0.1)] transition-all animate-in zoom-in-95 duration-200"
      >
        <div className="mb-7 flex items-start justify-between gap-5">
          <div>
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#f3f4f5] text-[#003870]">
              <Link2 className="h-5 w-5" strokeWidth={2.4} />
            </div>
            <h2 className="text-2xl font-extrabold text-[#191c1d]">
              Platform Links
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#727782]">
              {client?.name || 'Client'} competitor platform destinations.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f3f4f5] text-[#727782] transition hover:bg-[#e1e3e4] hover:text-[#003870]"
            aria-label="Close"
          >
            <X className="h-5 w-5" strokeWidth={2.4} />
          </button>
        </div>

        <div className="space-y-4">
          {LINK_FIELDS.map((field) => (
            <div key={field.key}>
              <label className="mb-2 ml-1 block text-xs font-bold uppercase tracking-wider text-[#727782]">
                {field.label}
              </label>
              <input
                type="text"
                value={form[field.key]}
                onChange={(event) => updateField(field.key, event.target.value)}
                placeholder={field.placeholder}
                className="w-full rounded-2xl border-none bg-[#f8f9fa] px-4 py-3 font-body outline-none ring-1 ring-[#c2c6d3]/40 transition-all placeholder:text-[#727782]/50 focus:ring-2 focus:ring-[#a8c8ff]"
              />
            </div>
          ))}
        </div>

        <div className="mt-8 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-6 py-3 text-sm font-bold text-[#424751] transition hover:bg-slate-100"
            disabled={saving}
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-[linear-gradient(135deg,#003870_0%,#014f99_100%)] px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Save Links'}
          </button>
        </div>
      </form>
    </div>
  );
}
