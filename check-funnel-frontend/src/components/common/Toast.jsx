import React, { useEffect } from 'react';

const Toast = ({ message, type, onClose }) => {
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
           <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
           </svg>
         ) : (
           <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
           </svg>
         )}
       </div>
       <p className="text-base font-bold text-[#191c1d] tracking-tight">{message}</p>
    </div>
  );
};

export default Toast;
