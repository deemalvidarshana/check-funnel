import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, Camera, Music2 } from 'lucide-react';
import { EditIcon } from '../clients/ClientIcons';

const PLATFORM_CHIPS = [
  {
    key: 'facebookUrl',
    label: 'Facebook',
    iconClass: 'bg-[#eaf2ff] text-[#003870]',
    icon: <span className="text-sm font-extrabold leading-none">f</span>,
  },
  {
    key: 'instagramUrl',
    label: 'Instagram',
    iconClass: 'bg-[#f7e9ff] text-[#7b2d8f]',
    icon: <Camera className="h-4 w-4" strokeWidth={2.4} />,
  },
  {
    key: 'tiktokUrl',
    label: 'TikTok',
    iconClass: 'bg-[#e7fbf7] text-[#111827]',
    icon: <Music2 className="h-4 w-4" strokeWidth={2.4} />,
  },
];

function normalizePlatformUrl(url) {
  const trimmed = String(url || '').trim();
  if (!trimmed) return '';
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

export default function PortfolioCard({
  id,
  name,
  category,
  facebookUrl,
  instagramUrl,
  tiktokUrl,
  isActive,
  canEditLinks = false,
  onEditLinks,
}) {
  const navigate = useNavigate();
  const [imgError, setImgError] = useState(false);

  const logoUrl = `${import.meta.env.VITE_API_BASE_URL || '/api'}/clients/${id}/logo`;
  const platformLinks = { facebookUrl, instagramUrl, tiktokUrl };

  return (
    <article 
      className="group relative flex min-h-[390px] flex-col overflow-hidden rounded-3xl border border-[#c2c6d3] bg-white p-6 shadow-[0_20px_50px_rgba(25,28,29,0.04)] transition hover:-translate-y-1"
    >
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="h-14 w-14 overflow-hidden rounded-full border border-[#c2c6d3] bg-[#edeeef] shadow-sm">
        {!imgError ? (
          <img
            src={logoUrl}
            onError={() => setImgError(true)}
            alt={name}
              className="h-full w-full object-cover"
          />
        ) : (
            <div className="flex h-full w-full items-center justify-center bg-[#bdc3c9] text-2xl font-extrabold text-white">
            {name?.charAt(0)?.toUpperCase()}
          </div>
        )}
        </div>

        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f3f4f5] text-[#4553c1]">
            <BarChart3 className="h-4 w-4" strokeWidth={2.3} />
          </span>
          <span className="rounded-full bg-[#e1e3e4] px-3 py-1 text-xs font-semibold text-[#424751]">
            {isActive ? 'Active' : 'Draft'}
          </span>
          {canEditLinks && (
            <button
              type="button"
              onClick={onEditLinks}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-100 bg-white text-[#003870] shadow-md transition hover:bg-[#003870] hover:text-white"
              title="Edit platform links"
            >
              <EditIcon />
            </button>
          )}
        </div>
      </div>

      <h3 className="text-2xl font-bold leading-tight text-[#191c1d]">
        {name}
      </h3>

      <p className="mt-3 line-clamp-3 text-sm font-medium leading-7 text-[#424751]">
        {category || "No description provided."}
      </p>

      <div className="mt-6">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#727782]">
            Analysis Channels
          </p>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {PLATFORM_CHIPS.map((platform) => {
            const link = normalizePlatformUrl(platformLinks[platform.key]);
            const hasLink = Boolean(link);

            return (
              <button
                key={platform.label}
                type="button"
                onClick={() => {
                  if (link) window.open(link, '_blank', 'noopener,noreferrer');
                }}
                disabled={!hasLink}
                className={`flex min-h-[76px] flex-col items-center justify-center rounded-2xl border border-[#e1e3e4] bg-[#f8f9fa] px-2 py-3 text-center transition ${
                  hasLink ? 'cursor-pointer hover:border-[#003870]/30 hover:bg-white' : 'cursor-default opacity-70'
                }`}
                title={hasLink ? `Open ${platform.label}` : `${platform.label} link not added`}
              >
                <span className={`mb-1.5 flex h-8 w-8 items-center justify-center rounded-full ${platform.iconClass}`}>
                  {platform.icon}
                </span>
                <span className="text-[11px] font-bold leading-tight text-[#424751]">
                  {platform.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <button
        onClick={() => navigate(`/competitors/${id}`)}
        className="mt-6 inline-flex items-center justify-center gap-2 rounded-full border border-[#c2c6d3] px-5 py-3 text-sm font-bold text-[#003870] transition hover:bg-[#e7e8e9]"
      >
        <span>Open Competitor Dashboard</span>
      </button>
    </article>
  );
}
