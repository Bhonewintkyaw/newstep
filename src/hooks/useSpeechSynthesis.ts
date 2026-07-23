import { useState, useCallback } from 'react';

export function useSpeechSynthesis(rate = 0.95) {
  const [isPlaying, setIsPlaying] = useState(false);

  const speak = useCallback((text: string, language: 'my' | 'en' = 'en') => {
    setIsPlaying(true);
    if (!('speechSynthesis' in window)) {
      setTimeout(() => setIsPlaying(false), 3000);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const isBurmese = language === 'my';
    utterance.lang = isBurmese ? 'my-MM' : 'en-US';
    const preferredVoice = window.speechSynthesis.getVoices().find((voice) => (
      voice.lang.toLowerCase().startsWith(isBurmese ? 'my' : 'en')
    ));
    if (preferredVoice) utterance.voice = preferredVoice;
    utterance.rate = rate;
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);
    window.speechSynthesis.speak(utterance);
  }, [rate]);

  return { isPlaying, speak };
}
