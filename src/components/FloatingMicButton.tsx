import React from 'react';

interface FloatingMicButtonProps {
  onOpenVoiceModal: () => void;
}

export const FloatingMicButton: React.FC<FloatingMicButtonProps> = ({ onOpenVoiceModal }) => {
  return (
    <div className="fixed bottom-22 left-1/2 -translate-x-1/2 lg:left-[calc(50%+8rem)] z-30 transform-gpu">
      <div className="relative">
        <div className="absolute inset-0 bg-[#00535b] rounded-full voice-pulse opacity-50 blur-md" />
        <button
          onClick={onOpenVoiceModal}
          className="w-16 h-16 bg-[#00535b] text-white rounded-full flex items-center justify-center shadow-2xl active:scale-90 transition-transform border-4 border-[#e4fffb] relative z-10 hover:bg-[#006d77] cursor-pointer transform-gpu"
        >
          <span className="material-symbols-outlined text-3xl fill">mic</span>
        </button>
      </div>
    </div>
  );
};
