import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, maxWidth = 'max-w-md' }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className={`bg-white rounded-3xl p-6 w-full ${maxWidth} shadow-2xl border border-[#00535b]/20 space-y-4`}>
        <div className="flex justify-between items-center border-b pb-3">
          <h3 className="font-bold text-lg text-[#00535b]">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 cursor-pointer">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};
