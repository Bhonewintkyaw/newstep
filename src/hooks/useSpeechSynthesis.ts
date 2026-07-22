import { useState, useCallback } from 'react';

export function useSpeechSynthesis(rate = 0.95) {
  const [isPlaying, setIsPlaying] = useState(false);

  const speak = useCallback((text: string) => {
    setIsPlaying(true);
    if (!('speechSynthesis' in window)) {
      setTimeout(() => setIsPlaying(false), 3000);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = rate;
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);
    window.speechSynthesis.speak(utterance);
  }, [rate]);

  return { isPlaying, speak };
}
