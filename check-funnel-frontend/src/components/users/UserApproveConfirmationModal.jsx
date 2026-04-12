import React from 'react';

function CheckIcon() {
  return (
    <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function UserApproveConfirmationModal({ open, onClose, onConfirm, userName }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-[32px] bg-white p-8 shadow-[0_30px_60px_-5px_rgba(0,0,0,0.1)] transition-all animate-in zoom-in-95 duration-200">
        <div className="flex flex-col items-center text-center">
          <div className="flex items-center justify-center w-20 h-20 mb-6 rounded-full bg-blue-50 text-[#003870]">
            <CheckIcon />
          </div>
          
          <h2 className="text-2xl font-extrabold text-[#003870] mb-3">
            Approve User?
          </h2>
          
          <p className="text-[#424751] leading-relaxed mb-8 text-sm px-2">
            Are you sure you want to grant platform access to <span className="font-bold text-[#191c1d]">"{userName}"</span>? They will be able to log in and use the system immediately.
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
              className="flex-1 py-3.5 px-6 rounded-full font-bold text-white bg-[linear-gradient(135deg,#003870_0%,#014f99_100%)] shadow-lg shadow-blue-200 hover:scale-[1.02] transition-all active:scale-95 text-sm"
            >
              Confirm Approval
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
