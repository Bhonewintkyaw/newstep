import React, { useState, useEffect } from 'react';
import { VoiceProcessResult } from '../types';

interface VoiceAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyVoiceActionResult: (result: VoiceProcessResult) => void;
  language: 'my' | 'en';
}

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

  useEffect(() => {
    if (isOpen) {
      setTranscriptInput('');
      setActiveResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const quickPrompts = [
    { labelBurmese: 'ဆန် ၅ အိတ် ရောင်းရသည်', labelEnglish: 'Sold 5 bags of rice' },
    { labelBurmese: 'ဆီ ၃ ပုလင်း ဝယ်ယူသည်', labelEnglish: 'Bought 3 bottles of cooking oil' },
    { labelBurmese: 'ချေးငွေ အခြေအနေ ဘယ်လိုလဲ', labelEnglish: 'Check current loan status' },
    { labelBurmese: 'ယနေ့ မိုးလေဝသ ပြောပြပါ', labelEnglish: 'Today weather forecast' },
  ];

  const handleProcessText = async (textToSend: string) => {
    if (!textToSend.trim()) return;
    setIsLoading(true);
    setIsListening(false);

    try {
      const res = await fetch('/api/ai/voice-process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: textToSend,
          currentLanguage: language,
        }),
      });

      const data: VoiceProcessResult = await res.json();
      setActiveResult(data);
      onApplyVoiceActionResult(data);

      // Web Speech Synthesis TTS feedback if supported
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const textToSpeak = language === 'my' ? data.replyBurmese : data.replyEnglish;
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        utterance.rate = 0.95;
        window.speechSynthesis.speak(utterance);
      }
    } catch (err) {
      console.error('Error processing voice request:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const startSpeechRecognition = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert(
        language === 'my'
          ? 'သင့်ဘရောက်ဇာတွင် အသံဖမ်းစနစ် မပါဝင်သေးပါ။ ကျေးဇူးပြု၍ အောက်ပါ စာသားခလုတ်များကို နှိပ်ပါ။'
          : 'Speech recognition is not supported in this browser window. Please tap the quick voice prompt chips below.'
      );
      return;
    }

    try {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = language === 'my' ? 'my-MM' : 'en-US';
      recognition.interimResults = true;

      setIsListening(true);

      recognition.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        setTranscriptInput(text);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl flex flex-col gap-5 border border-[#00535b]/20 relative max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#00535b] text-2xl animate-pulse">
              auto_awesome
            </span>
            <h3 className="font-bold text-lg text-[#00201e]">
              {language === 'my' ? 'AI အသံ မန်နေဂျာ (Voice Assistant)' : 'AI Voice Assistant'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Central Mic Button */}
        <div className="flex flex-col items-center justify-center py-2">
          <div className="relative">
            {isListening && (
              <div className="absolute inset-0 bg-[#00535b]/30 rounded-full scale-150 animate-ping" />
            )}
            <button
              onClick={() => {
                if (isListening) {
                  setIsListening(false);
                } else {
                  startSpeechRecognition();
                }
              }}
              className={`w-28 h-28 rounded-full flex items-center justify-center text-white shadow-xl relative z-10 transition-all duration-200 active:scale-95 ${
                isListening ? 'bg-[#ffba27] pulse-gold' : 'bg-[#00535b] voice-pulse'
              }`}
            >
              <span className="material-symbols-outlined text-5xl fill">
                {isListening ? 'hearing' : 'mic'}
              </span>
            </button>
          </div>

          <p className="mt-4 font-bold text-lg text-[#00201e] text-center">
            {isListening
              ? language === 'my'
                ? 'နားထောင်နေပါသည်... စကားပြောပါ'
                : 'Listening... Speak now'
              : language === 'my'
              ? 'ကျွန်ုပ်ကို မေးမြန်းပါ (Ask Me Anything)'
              : 'Ask Me Anything'}
          </p>
          <span className="text-xs text-[#3e494a] bg-[#b7fbf3]/50 px-3 py-1 rounded-full mt-1">
            {language === 'my' ? 'အသံဖြင့် ခိုင်းစေရုံဖြင့် အရာရာလွယ်ကူစေမည်' : 'Tap mic or quick prompt below'}
          </span>
        </div>

        {/* Manual text input or voice result display */}
        <div className="space-y-3">
          <div className="relative flex items-center">
            <input
              type="text"
              value={transcriptInput}
              onChange={(e) => setTranscriptInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleProcessText(transcriptInput);
                }
              }}
              placeholder={
                language === 'my'
                  ? 'ဥပမာ: "ဆန် ၅ အိတ် ရောင်းရသည်" သို့မဟုတ် စာရိုက်ပါ...'
                  : 'Type or speak command (e.g., Sold 5 bags of rice)...'
              }
              className="w-full h-12 pl-4 pr-12 bg-gray-50 border border-[#bec8ca] focus:border-[#00535b] focus:bg-white rounded-xl text-sm font-medium outline-none transition-all"
            />
            <button
              onClick={() => handleProcessText(transcriptInput)}
              disabled={isLoading || !transcriptInput.trim()}
              className="absolute right-2 p-2 text-[#00535b] hover:bg-[#e4fffb] disabled:opacity-30 rounded-lg transition-colors"
            >
              <span className="material-symbols-outlined">send</span>
            </button>
          </div>

          {/* Quick Prompts Chips */}
          <div>
            <p className="text-xs font-bold text-[#3e494a] mb-2 uppercase tracking-wider">
              {language === 'my' ? 'အလွယ်တကူ စမ်းသပ်ရန် စကားစုများ:' : 'Quick Voice Prompts:'}
            </p>
            <div className="flex flex-wrap gap-2">
              {quickPrompts.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    const text = language === 'my' ? item.labelBurmese : item.labelEnglish;
                    setTranscriptInput(text);
                    handleProcessText(text);
                  }}
                  className="px-3 py-1.5 bg-[#e4fffb] hover:bg-[#b1f5ed] border border-[#00535b]/20 text-[#00535b] text-xs font-medium rounded-full active:scale-95 transition-all text-left flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-sm">mic</span>
                  <span>{language === 'my' ? item.labelBurmese : item.labelEnglish}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Loading Spinner */}
        {isLoading && (
          <div className="flex items-center justify-center gap-3 py-4 bg-[#b7fbf3]/30 rounded-2xl border border-[#00535b]/10">
            <div className="w-5 h-5 border-2 border-[#00535b] border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-semibold text-[#00535b]">
              {language === 'my' ? 'AI မန်နေဂျာမှ စနစ်ပြင်ဆင်နေပါသည်...' : 'AI Manager is processing...'}
            </span>
          </div>
        )}

        {/* Result Feedback Banner */}
        {activeResult && !isLoading && (
          <div className="p-4 bg-[#e4fffb] border border-[#00535b]/20 rounded-2xl space-y-2 animate-in fade-in duration-300">
            <div className="flex items-center gap-2 text-[#00535b]">
              <span className="material-symbols-outlined fill text-xl">check_circle</span>
              <span className="font-bold text-sm">
                {language === 'my' ? 'AI တုံ့ပြန်ချက်:' : 'AI Result:'}
              </span>
            </div>
            <p className="text-sm font-semibold text-[#00201e]">
              {language === 'my' ? activeResult.replyBurmese : activeResult.replyEnglish}
            </p>
            {activeResult.amount ? (
              <div className="text-xs font-bold px-2.5 py-1 bg-[#006d77]/10 text-[#00535b] rounded-md inline-block">
                {activeResult.action === 'RECORD_SALE' ? '+' : '-'} {activeResult.amount.toLocaleString()} MMK
              </div>
            ) : null}
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-[#00201e] font-bold rounded-xl text-sm transition-colors mt-1"
        >
          {language === 'my' ? 'ပိတ်မည် (Close)' : 'Close'}
        </button>
      </div>
    </div>
  );
};
