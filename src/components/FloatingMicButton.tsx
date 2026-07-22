import React from 'react';

interface FloatingMicButtonProps {
  onOpenVoiceModal: () => void;
}

export const FloatingMicButton: React.FC<FloatingMicButtonProps> = ({ onOpenVoiceModal }) => {
  return (
    <div className="fixed right-4 sm:right-6 lg:right-8 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] lg:bottom-8 z-30 transform-gpu">
      <div className="relative">
        <div className="absolute inset-0 bg-[#00535b] rounded-full voice-pulse opacity-50 blur-md" />
        <button
          onClick={onOpenVoiceModal}
          aria-label="Open voice assistant"
          className="w-14 h-14 sm:w-16 sm:h-16 bg-[#00535b] text-white rounded-full flex items-center justify-center shadow-2xl active:scale-90 transition-transform border-4 border-[#e4fffb] relative z-10 hover:bg-[#006d77] cursor-pointer transform-gpu"
        >
          <span className="material-symbols-outlined text-3xl fill">mic</span>
        </button>
      </div>
    </div>
  );
};
