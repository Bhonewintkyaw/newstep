import React from 'react';

interface VoicePlayButtonProps {
  isPlaying: boolean;
  labelPlaying: string;
  labelIdle: string;
  onClick: () => void;
  className?: string;
}

export const VoicePlayButton: React.FC<VoicePlayButtonProps> = ({
  isPlaying,
  labelPlaying,
  labelIdle,
  onClick,
  className = '',
}) => {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-extrabold transition-all cursor-pointer shadow-xs ${className} ${
        isPlaying
          ? 'bg-[#ffba27] text-[#00201e] animate-pulse'
          : 'bg-[#e4fffb] text-[#00535b] border border-[#00535b]/20 hover:bg-[#b7fbf3]'
      }`}
    >
      <span className="material-symbols-outlined text-lg">{isPlaying ? 'graphic_eq' : 'volume_up'}</span>
      <span>{isPlaying ? labelPlaying : labelIdle}</span>
    </button>
  );
};
