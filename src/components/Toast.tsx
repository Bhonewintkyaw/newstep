import React from 'react';

interface ToastProps {
  message: string | null;
}

export const Toast: React.FC<ToastProps> = ({ message }) => {
  if (!message) return null;

  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 bg-[#00201e] text-[#e4fffb] px-5 py-3 rounded-full shadow-2xl z-50 flex items-center gap-2 border border-[#00535b]/30 animate-in fade-in slide-in-from-top-4 duration-200">
      <span className="material-symbols-outlined text-[#e4fffb] text-base">check_circle</span>
      <span className="text-xs font-bold">{message}</span>
    </div>
  );
};
