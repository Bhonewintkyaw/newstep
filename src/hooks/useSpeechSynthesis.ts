import { useState, useCallback, useRef, useEffect } from 'react';

let globalActiveAudio: HTMLAudioElement | null = null;

export function stopAllSpeech() {
  if (globalActiveAudio) {
    globalActiveAudio.pause();
    globalActiveAudio.currentTime = 0;
    globalActiveAudio = null;
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

export function playServerTTS(text: string, language: 'my' | 'en' = 'my'): Promise<void> {
  return new Promise((resolve) => {
    stopAllSpeech();
    if (!text || !text.trim()) {
      resolve();
      return;
    }

    const encodedText = encodeURIComponent(text.trim());
    const audioUrl = `/api/tts?text=${encodedText}&lang=${language}`;
    const audio = new Audio(audioUrl);
    globalActiveAudio = audio;

    const cleanupAndResolve = () => {
      if (globalActiveAudio === audio) globalActiveAudio = null;
      resolve();
    };

    audio.onended = cleanupAndResolve;

    audio.onerror = () => {
      if (globalActiveAudio === audio) globalActiveAudio = null;
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = language === 'my' ? 'my-MM' : 'en-US';
        utterance.rate = 0.92;
        const matchingVoice = window.speechSynthesis.getVoices().find((voice) => (
          voice.lang.toLowerCase().startsWith(language === 'my' ? 'my' : 'en')
        ));
        if (matchingVoice) utterance.voice = matchingVoice;
        utterance.onend = cleanupAndResolve;
        utterance.onerror = cleanupAndResolve;
        window.speechSynthesis.speak(utterance);
      } else {
        cleanupAndResolve();
      }
    };

    audio.play().catch(() => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = language === 'my' ? 'my-MM' : 'en-US';
        utterance.rate = 0.92;
        utterance.onend = cleanupAndResolve;
        utterance.onerror = cleanupAndResolve;
        window.speechSynthesis.speak(utterance);
      } else {
        cleanupAndResolve();
      }
    });
  });
}

export function useSpeechSynthesis(rate = 0.92) {
  const [isPlaying, setIsPlaying] = useState(false);
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);

  const stop = useCallback(() => {
    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
      activeAudioRef.current.currentTime = 0;
      activeAudioRef.current = null;
    }
    stopAllSpeech();
    setIsPlaying(false);
  }, []);

  const speak = useCallback((text: string, language: 'my' | 'en' = 'my') => {
    if (!text || !text.trim()) return;
    setIsPlaying(true);

    stopAllSpeech();

    const encodedText = encodeURIComponent(text.trim());
    const audioUrl = `/api/tts?text=${encodedText}&lang=${language}`;
    const audio = new Audio(audioUrl);
    activeAudioRef.current = audio;
    globalActiveAudio = audio;

    const handleFinished = () => {
      setIsPlaying(false);
      activeAudioRef.current = null;
      if (globalActiveAudio === audio) globalActiveAudio = null;
    };

    audio.onended = handleFinished;

    audio.onerror = () => {
      activeAudioRef.current = null;
      if (globalActiveAudio === audio) globalActiveAudio = null;
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = language === 'my' ? 'my-MM' : 'en-US';
        utterance.rate = rate;
        utterance.onend = handleFinished;
        utterance.onerror = handleFinished;
        window.speechSynthesis.speak(utterance);
      } else {
        setIsPlaying(false);
      }
    };

    audio.play().catch(() => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = language === 'my' ? 'my-MM' : 'en-US';
        utterance.rate = rate;
        utterance.onend = handleFinished;
        utterance.onerror = handleFinished;
        window.speechSynthesis.speak(utterance);
      } else {
        setIsPlaying(false);
      }
    });
  }, [rate]);

  useEffect(() => () => {
    stop();
  }, [stop]);

  return { isPlaying, speak, stop };
}
