import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { VoiceProcessResult } from '../types';
import { playServerTTS, stopAllSpeech } from '../hooks/useSpeechSynthesis';

interface VoiceAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyVoiceActionResult: (result: VoiceProcessResult) => void;
  language: 'my' | 'en';
}

interface SpeechRecognitionResultLike {
  readonly isFinal: boolean;
  readonly 0: { transcript: string };
}

interface SpeechRecognitionEventLike {
  readonly resultIndex: number;
  readonly results: ArrayLike<SpeechRecognitionResultLike>;
}

interface SpeechRecognitionErrorLike {
  readonly error: string;
}

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

const isFinancialAction = (result: VoiceProcessResult) => (
  result.action === 'RECORD_SALE' || result.action === 'RECORD_PURCHASE'
);

export const VoiceAssistantModal: React.FC<VoiceAssistantModalProps> = ({
  isOpen,
  onClose,
  onApplyVoiceActionResult,
  language,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcriptInput, setTranscriptInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeResult, setActiveResult] = useState<VoiceProcessResult | null>(null);
  const [error, setError] = useState('');
  const [isApplied, setIsApplied] = useState(false);

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const finalTranscriptRef = useRef('');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const t = useCallback((my: string, en: string) => language === 'my' ? my : en, [language]);

  const speakResult = useCallback((result: VoiceProcessResult) => {
    const text = language === 'my' ? result.replyBurmese : result.replyEnglish;
    if (!text) return;
    void playServerTTS(text, language);
  }, [language]);

  const stopAudioRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (err) {
        console.error('Error stopping MediaRecorder:', err);
      }
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.error('Error stopping SpeechRecognition:', err);
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTranscriptInput('');
      setActiveResult(null);
      setError('');
      setIsApplied(false);
      return;
    }
    stopAudioRecording();
    stopAllSpeech();
  }, [isOpen, stopAudioRecording]);

  useEffect(() => () => {
    stopAudioRecording();
    stopAllSpeech();
  }, [stopAudioRecording]);

  const handleProcessText = useCallback(async (textToSend: string) => {
    const transcript = textToSend.trim();
    if (!transcript || isLoading) return;
    setIsLoading(true);
    setIsListening(false);
    setActiveResult(null);
    setIsApplied(false);
    setError('');

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 20_000);
    try {
      const response = await fetch('/api/ai/voice-process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript, currentLanguage: language }),
        signal: controller.signal,
      });
      const payload = await response.json() as VoiceProcessResult & { error?: string };
      if (!response.ok) throw new Error(payload.error || `Request failed (${response.status})`);
      if (!payload.action || !payload.replyBurmese || !payload.replyEnglish) {
        throw new Error('The assistant returned an invalid response.');
      }

      setActiveResult(payload);
      speakResult(payload);
      if (!isFinancialAction(payload) && payload.action !== 'GENERAL_QUERY') {
        onApplyVoiceActionResult(payload);
        setIsApplied(true);
      }
    } catch (requestError) {
      const message = requestError instanceof DOMException && requestError.name === 'AbortError'
        ? t('တောင်းဆိုမှု အချိန်ကြာလွန်းပါသည်။ ထပ်မံကြိုးစားပါ။', 'The request timed out. Please try again.')
        : t('အသံအကူအညီဆာဗာနှင့် ချိတ်ဆက်မရပါ။ ထပ်မံကြိုးစားပါ။', 'Could not reach the voice assistant. Please try again.');
      setError(message);
      console.error('Voice assistant request failed:', requestError);
    } finally {
      window.clearTimeout(timeoutId);
      setIsLoading(false);
    }
  }, [isLoading, language, onApplyVoiceActionResult, speakResult, t]);

  const handleProcessAudioBlob = useCallback(async (blob: Blob, mimeType: string) => {
    if (blob.size === 0) return;
    setIsLoading(true);
    setIsListening(false);
    setActiveResult(null);
    setIsApplied(false);
    setError('');

    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      const audioBase64 = await base64Promise;

      const response = await fetch('/api/ai/voice-process-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audioBase64, mimeType, currentLanguage: language }),
      });

      const payload = await response.json() as VoiceProcessResult & { transcript?: string; error?: string };
      if (!response.ok) throw new Error(payload.error || `Audio request failed (${response.status})`);

      if (payload.transcript) {
        setTranscriptInput(payload.transcript);
      }

      setActiveResult(payload);
      speakResult(payload);
      if (!isFinancialAction(payload) && payload.action !== 'GENERAL_QUERY') {
        onApplyVoiceActionResult(payload);
        setIsApplied(true);
      }
    } catch (err) {
      console.error('Gemini audio processing failed:', err);
      // Fallback message
      const completedTranscript = transcriptInput.trim();
      if (completedTranscript) {
        void handleProcessText(completedTranscript);
      } else {
        setError(t(
          'အသံဖမ်းယူမှု မအောင်မြင်ပါ။ စာရိုက်၍ တိုက်ရိုက် မေးမြန်းနိုင်ပါသည်။',
          'Could not process voice recording. You can type your command below.',
        ));
      }
    } finally {
      setIsLoading(false);
    }
  }, [handleProcessText, language, onApplyVoiceActionResult, speakResult, t, transcriptInput]);

  const startListening = useCallback(async () => {
    setError('');
    setActiveResult(null);
    stopAllSpeech();

    // Prefer MediaRecorder for cross-browser reliability (Chrome, Safari iOS, Firefox, Android)
    if (navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== 'undefined') {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = stream;
        audioChunksRef.current = [];

        const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
        const recorder = new MediaRecorder(stream, { mimeType });
        mediaRecorderRef.current = recorder;

        recorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        recorder.onstop = () => {
          if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach((track) => track.stop());
            mediaStreamRef.current = null;
          }
          const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
          void handleProcessAudioBlob(audioBlob, mimeType);
        };

        recorder.start();
        setIsListening(true);
        return;
      } catch (micErr) {
        console.warn('MediaRecorder mic access failed or denied, trying SpeechRecognition fallback', micErr);
      }
    }

    // Fallback: Web Speech API
    const speechWindow = window as Window & {
      SpeechRecognition?: SpeechRecognitionConstructor;
      webkitSpeechRecognition?: SpeechRecognitionConstructor;
    };
    const Recognition = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;

    if (!Recognition) {
      setError(t(
        'ဤဘရောက်ဇာတွင် မိုက်ခရိုဖုန်းအသုံးပြုခွင့် မရရှိပါ။ အောက်တွင် စာရိုက်၍ မေးမြန်းနိုင်ပါသည်။',
        'Microphone access is unavailable here. Please type your command below.',
      ));
      return;
    }

    finalTranscriptRef.current = '';
    const recognition = new Recognition();
    recognition.lang = language === 'my' ? 'my-MM' : 'en-US';
    recognition.continuous = false;
    recognition.interimResults = true;
    recognitionRef.current = recognition;

    recognition.onresult = (event) => {
      let finalText = finalTranscriptRef.current;
      let interimText = '';
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        if (result.isFinal) finalText += `${result[0].transcript} `;
        else interimText += result[0].transcript;
      }
      finalTranscriptRef.current = finalText;
      setTranscriptInput(`${finalText}${interimText}`.trim());
    };

    recognition.onerror = (event) => {
      recognitionRef.current = null;
      setIsListening(false);
      const messages: Record<string, [string, string]> = {
        'not-allowed': ['မိုက်ခရိုဖုန်းအသုံးပြုခွင့် ပေးရန်လိုပါသည်။', 'Allow microphone access to use voice commands.'],
        'audio-capture': ['မိုက်ခရိုဖုန်းကို ရှာမတွေ့ပါ။', 'No microphone was found.'],
        'no-speech': ['စကားသံ မကြားရပါ။ မိုက်ကိုနှိပ်ပြီး ထပ်ပြောပါ။', 'No speech was detected. Tap the microphone and try again.'],
        network: ['အသံဖမ်းဝန်ဆောင်မှုနှင့် ချိတ်ဆက်မရပါ။', 'The speech recognition service is unavailable.'],
      };
      const localized = messages[event.error] || ['အသံဖမ်းမှု မအောင်မြင်ပါ။ ထပ်မံကြိုးစားပါ။', 'Speech recognition failed. Please try again.'];
      setError(language === 'my' ? localized[0] : localized[1]);
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      setIsListening(false);
      const completedTranscript = finalTranscriptRef.current.trim();
      finalTranscriptRef.current = '';
      if (completedTranscript) void handleProcessText(completedTranscript);
    };

    try {
      recognition.start();
      setIsListening(true);
    } catch {
      recognitionRef.current = null;
      setIsListening(false);
      setError(t('မိုက်ခရိုဖုန်းကို စတင်၍မရပါ။ ထပ်မံကြိုးစားပါ။', 'Could not start the microphone. Please try again.'));
    }
  }, [handleProcessAudioBlob, handleProcessText, language, t]);

  if (!isOpen) return null;

  const quickPrompts = [
    { my: 'ချေးငွေနှင့် ဘဏ်များ ကြည့်မည်', en: 'Open loans and nearby banks' },
    { my: 'ယနေ့ ရာသီဥတု ကြည့်မည်', en: 'Open today’s weather' },
    { my: 'ကုန်ပစ္စည်းစာရင်း ကြည့်မည်', en: 'Open inventory records' },
  ];

  const confirmFinancialRecord = () => {
    if (!activeResult || !isFinancialAction(activeResult) || isApplied) return;
    onApplyVoiceActionResult(activeResult);
    setIsApplied(true);
  };

  return (
    <div onClick={onClose} className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 backdrop-blur-xs sm:items-center sm:p-4">
      <section aria-modal="true" aria-labelledby="voice-assistant-title" role="dialog" onClick={(event) => event.stopPropagation()} className="relative flex max-h-[92vh] w-full max-w-lg flex-col gap-5 overflow-y-auto rounded-t-3xl border border-[#00535b]/20 bg-white p-6 shadow-2xl sm:rounded-3xl">
        <header className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <span aria-hidden="true" className="material-symbols-outlined animate-pulse text-2xl text-[#00535b]">auto_awesome</span>
            <h2 id="voice-assistant-title" className="text-lg font-bold text-[#00201e]">{t('AI အသံအကူအညီ', 'AI Voice Assistant')}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label={t('ပိတ်မည်', 'Close')} className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100"><span aria-hidden="true" className="material-symbols-outlined">close</span></button>
        </header>

        <div className="flex flex-col items-center py-1">
          <div className="relative">
            {isListening && <div className="absolute inset-0 scale-150 animate-ping rounded-full bg-[#00535b]/30" />}
            <button
              type="button"
              onClick={() => isListening ? stopAudioRecording() : void startListening()}
              disabled={isLoading}
              aria-label={isListening ? t('အသံဖမ်းမှု ရပ်မည်', 'Stop listening') : t('အသံဖမ်းမည်', 'Start listening')}
              className={`voice-pulse relative z-10 flex h-28 w-28 items-center justify-center rounded-full text-white shadow-xl transition active:scale-95 disabled:opacity-50 ${isListening ? 'bg-[#ffba27] text-[#00201e]' : 'bg-[#00535b]'}`}
            >
              <span aria-hidden="true" className="material-symbols-outlined fill text-5xl">{isListening ? 'stop' : 'mic'}</span>
            </button>
          </div>
          <p className="mt-4 text-center text-lg font-bold text-[#00201e]">{isListening ? t('နားထောင်နေပါသည်… စကားပြောပါ', 'Listening… Speak now') : t('မိုက်ကိုနှိပ်ပြီး စကားပြောပါ', 'Tap the microphone and speak')}</p>
          <p className="mt-1 text-center text-xs text-[#3e494a]">{t('အရောင်း/အဝယ်အတွက် ပစ္စည်းနှင့် စုစုပေါင်းကျပ်ငွေကို အတိအကျပြောပါ', 'For sales or purchases, include the item and exact total MMK amount.')}</p>
        </div>

        <form onSubmit={(event) => { event.preventDefault(); void handleProcessText(transcriptInput); }} className="relative flex items-center">
          <label htmlFor="voice-command" className="sr-only">{t('အသံအမိန့်စာသား', 'Voice command')}</label>
          <input id="voice-command" value={transcriptInput} onChange={(event) => setTranscriptInput(event.target.value)} disabled={isLoading} placeholder={t('ဥပမာ - ဆန်ရောင်း၊ စုစုပေါင်း ၅၀၀၀၀ ကျပ်', 'Example: Sold rice, total 50,000 MMK')} className="h-12 w-full rounded-xl border border-[#bec8ca] bg-gray-50 pl-4 pr-12 text-sm font-medium outline-none transition focus:border-[#00535b] focus:bg-white" />
          <button type="submit" disabled={isLoading || !transcriptInput.trim()} aria-label={t('ပို့မည်', 'Send command')} className="absolute right-2 rounded-lg p-2 text-[#00535b] hover:bg-[#e4fffb] disabled:opacity-30"><span aria-hidden="true" className="material-symbols-outlined">send</span></button>
        </form>

        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[#3e494a]">{t('အမြန်လုပ်ဆောင်ချက်များ', 'Quick actions')}</p>
          <div className="flex flex-wrap gap-2">
            {quickPrompts.map((prompt) => {
              const text = language === 'my' ? prompt.my : prompt.en;
              return <button key={prompt.en} type="button" onClick={() => { setTranscriptInput(text); void handleProcessText(text); }} disabled={isLoading} className="rounded-full border border-[#00535b]/20 bg-[#e4fffb] px-3 py-2 text-left text-xs font-medium text-[#00535b] transition hover:bg-[#b1f5ed] disabled:opacity-50">{text}</button>;
            })}
          </div>
        </div>

        {isLoading && <div className="flex items-center justify-center gap-3 rounded-2xl border border-[#00535b]/10 bg-[#b7fbf3]/30 py-4"><div className="h-5 w-5 animate-spin rounded-full border-2 border-[#00535b] border-t-transparent" /><span className="text-sm font-semibold text-[#00535b]">{t('လုပ်ဆောင်နေပါသည်…', 'Processing…')}</span></div>}
        {error && <div role="alert" className="rounded-2xl bg-[#ffdad6] px-4 py-3 text-sm font-semibold text-[#93000a]">{error}</div>}

        {activeResult && !isLoading && (
          <div className="space-y-3 rounded-2xl border border-[#00535b]/20 bg-[#e4fffb] p-4">
            <div className="flex items-center gap-2 font-bold text-[#00535b]"><span aria-hidden="true" className="material-symbols-outlined">{isApplied ? 'check_circle' : 'fact_check'}</span><span>{isFinancialAction(activeResult) && !isApplied ? t('မသိမ်းမီ စစ်ဆေးပါ', 'Review before saving') : t('အသံအကူအညီ အဖြေ', 'Assistant result')}</span></div>
            <p className="text-sm font-semibold text-[#00201e]">{language === 'my' ? activeResult.replyBurmese : activeResult.replyEnglish}</p>
            {activeResult.amount ? <div className="inline-block rounded-md bg-[#006d77]/10 px-2.5 py-1 text-sm font-bold text-[#00535b]">{activeResult.itemName || t('စာရင်း', 'Record')} · {activeResult.amount.toLocaleString()} MMK</div> : null}
            {isFinancialAction(activeResult) && (
              <button type="button" onClick={confirmFinancialRecord} disabled={isApplied} className="w-full rounded-xl bg-[#00535b] px-4 py-3 text-sm font-bold text-white disabled:bg-[#6f797a]">{isApplied ? t('စာရင်းသွင်းပြီးပါပြီ', 'Record saved') : t('ဤစာရင်းကို သိမ်းမည်', 'Save this record')}</button>
            )}
          </div>
        )}

        <button type="button" onClick={onClose} className="w-full rounded-xl bg-gray-100 py-3 text-sm font-bold text-[#00201e] hover:bg-gray-200">{t('ပိတ်မည်', 'Close')}</button>
      </section>
    </div>
  );
};
