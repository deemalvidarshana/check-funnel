import React from 'react';

function TrashIcon() {
  return (
    <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function DeleteConfirmationModal({ open, onClose, onConfirm, title, message }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-[32px] bg-white p-8 shadow-[0_30px_60px_-5px_rgba(0,0,0,0.1)] transition-all animate-in zoom-in-95 duration-200">
        <div className="flex flex-col items-center text-center">
          <div className="flex items-center justify-center w-20 h-20 mb-6 rounded-full bg-slate-100 text-[#003870]">
            <TrashIcon />
          </div>
          
          <h2 className="text-2xl font-extrabold text-[#003870] mb-3">
            {title || 'Are you sure?'}
          </h2>
          
          <p className="text-[#424751] leading-relaxed mb-8 text-sm">
            {message || 'This action cannot be undone.'}
          </p>
          
          <div className="flex items-center justify-center gap-3 w-full">
            <button
              onClick={onClose}
              className="flex-1 py-3.5 px-6 rounded-full font-bold text-[#424751] hover:bg-slate-100 transition-colors text-sm"
            >
              Cancel
            </button>
            
            <button
              onClick={onConfirm}
              className="flex-1 py-3.5 px-6 rounded-full font-bold text-white bg-[#003870] shadow-lg shadow-slate-200 hover:bg-[#014f99] transition-all active:scale-95 text-sm"
            >
              Confirm Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
