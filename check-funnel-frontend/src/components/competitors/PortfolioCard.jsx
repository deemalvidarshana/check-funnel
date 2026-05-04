import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function PortfolioCard({ id, name, category, competitorsTracked, isActive }) {
  const navigate = useNavigate();
  const [imgError, setImgError] = useState(false);

  const logoUrl = `${import.meta.env.VITE_API_BASE_URL || '/api'}/clients/${id}/logo`;

  return (
    <article 
      className="relative overflow-hidden rounded-[2rem] cursor-pointer group h-[340px] bg-[#bdc3c9] shadow-lg transition-transform hover:-translate-y-1"
      onClick={() => navigate(`/competitors/${id}`)}
    >
      {/* Default View: Full Fill Image */}
      <div className="absolute inset-0 flex items-center justify-center">
        {!imgError ? (
          <img
            src={logoUrl}
            onError={() => setImgError(true)}
            alt={name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[#bdc3c9] font-bold text-[#ffffff] text-6xl">
            {name?.charAt(0)?.toUpperCase()}
          </div>
        )}
      </div>

      {/* Hover State Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#003870]/95 via-[#003870]/50 via-60% to-transparent flex flex-col items-center justify-end p-8 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-20">
        <div className="relative z-30 flex flex-col items-center w-full mt-auto">
          <h3 className="text-3xl font-extrabold text-white mb-2 text-center drop-shadow-md">
            {name}
          </h3>
          <p className="text-sm text-white/90 text-center mb-6 line-clamp-3 leading-relaxed font-medium drop-shadow-sm">
            {category || "No description provided."}
          </p>

          {/* Action Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/competitors/${id}`);
            }}
            className="w-14 h-14 bg-white rounded-full flex items-center justify-center text-[#003870] shadow-xl hover:scale-110 transition-transform duration-300 mt-2"
          >
            <svg className="w-6 h-6 ml-1 mb-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    </article>
  );
}
