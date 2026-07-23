import React, { useState, useEffect, useCallback } from 'react';
import type { WeatherData, MarketRecommendation } from '../types';
import { FloatingMicButton } from '../components/FloatingMicButton';
import { playServerTTS, stopAllSpeech } from '../hooks/useSpeechSynthesis';

interface PredictionScreenProps {
  weatherData: WeatherData;
  marketRecommendations: MarketRecommendation[];
  onOpenVoiceModal: () => void;
  language: 'my' | 'en';
}

const cityOptions = [
  { key: 'Yangon', labelMy: 'ရန်ကုန်', labelEn: 'Yangon' },
  { key: 'Mandalay', labelMy: 'မန္တလေး', labelEn: 'Mandalay' },
  { key: 'Naypyidaw', labelMy: 'နေပြည်တော်', labelEn: 'Naypyidaw' },
  { key: 'Bago', labelMy: 'ပဲခူး', labelEn: 'Bago' },
  { key: 'Mawlamyine', labelMy: 'မော်လမြိုင်', labelEn: 'Mawlamyine' },
  { key: 'Taunggyi', labelMy: 'တောင်ကြီး', labelEn: 'Taunggyi' },
];

export const PredictionScreen: React.FC<PredictionScreenProps> = ({
  weatherData: initialWeather,
  marketRecommendations,
  onOpenVoiceModal,
  language,
}) => {
  const [selectedCity, setSelectedCity] = useState('Yangon');
  const [currentWeather, setCurrentWeather] = useState<WeatherData>(initialWeather);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [locationMessage, setLocationMessage] = useState<string | null>(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState(false);

  const fetchWeather = useCallback(async (params: { city?: string; lat?: number; lon?: number }) => {
    setIsLoadingWeather(true);
    try {
      const search = new URLSearchParams();
      if (params.city) search.set('city', params.city);
      if (params.lat !== undefined && params.lon !== undefined) {
        search.set('lat', String(params.lat));
        search.set('lon', String(params.lon));
      }
      const res = await fetch(`/api/weather?${search.toString()}`);
      if (!res.ok) throw new Error('Weather fetch failed');
      const data: WeatherData = await res.json();
      setCurrentWeather(data);
    } catch {
      setLocationMessage(language === 'my'
        ? 'တိုက်ရိုက်ရာသီဥတုအချက်အလက်ကို ယခုရယူ၍မရပါ။ ထပ်မံကြိုးစားပါ။'
        : 'Live weather is temporarily unavailable. Please try again.');
    } finally {
      setIsLoadingWeather(false);
    }
  }, [language]);

  useEffect(() => {
    if (!isLocating) fetchWeather({ city: 'Yangon' });
  }, []);

  const handleCityChange = (cityName: string) => {
    setSelectedCity(cityName);
    setLocationMessage(null);
    fetchWeather({ city: cityName });
  };

  const handleDetectLocation = () => {
    setIsLocating(true);
    setLocationMessage(null);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setIsLocating(false);
          const { latitude, longitude } = pos.coords;
          setLocationMessage(
            language === 'my'
              ? `တည်နေရာစစ်ဆေးပြီးပါပြီ (${latitude.toFixed(3)}, ${longitude.toFixed(3)})`
              : `Location detected (${latitude.toFixed(3)}, ${longitude.toFixed(3)})`
          );
          setSelectedCity('');
          fetchWeather({ lat: latitude, lon: longitude });
        },
        () => {
          setIsLocating(false);
          setLocationMessage(
            language === 'my'
              ? 'GPSမရပါ၊ ရန်ကုန်မြို့ကိုမူလအဖြစ်သုံးပါသည်။'
              : 'GPS unavailable. Defaulting to Yangon.'
          );
          handleCityChange('Yangon');
        }
      );
    } else {
      setIsLocating(false);
      setLocationMessage(t('ဤဘရောက်ဇာတွင် တည်နေရာစနစ် မပါဝင်ပါ။', 'Geolocation is not supported.'));
    }
  };

  const handlePlayVoiceAnnouncement = () => {
    setIsPlayingAudio(true);
    const isBurmese = language === 'my';
    const text = isBurmese
      ? currentWeather.voiceAnnouncementBurmese
      : `${currentWeather.city} temperature is ${currentWeather.tempCelsius} degrees Celsius, ${currentWeather.conditionEnglish}, with a ${currentWeather.rainProbabilityPercent}% chance of rain.`;
    playServerTTS(text, language).finally(() => {
      setIsPlayingAudio(false);
    });
  };

  const t = (my: string, en: string) => (language === 'my' ? my : en);

  return (
    <div className="screen-shell space-y-6 lg:space-y-8">
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#00535b] flex items-center gap-2">
            <span className="material-symbols-outlined text-3xl text-[#825b00]">auto_awesome</span>
            <span>{t('AI ရာသီဥတုနှင့် ဈေးကွက် ခန့်မှန်းချက်', 'AI Weather & Market Predictions')}</span>
          </h2>
          <p className="text-xs sm:text-sm text-[#3e494a] font-semibold mt-1">
            {t('တိုက်ရိုက်ရာသီဥတုအချက်အလက်နှင့် ဈေးကွက်အကြံပြုချက်များ', 'Live weather data & smart market recommendations')}
          </p>
        </div>
        <button
          onClick={handleDetectLocation}
          disabled={isLocating}
          className="self-start sm:self-auto flex items-center gap-2 px-4 py-2.5 bg-[#00535b] hover:bg-[#006d77] text-white rounded-2xl text-xs font-bold shadow-sm active:scale-95 transition-all cursor-pointer disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-lg">my_location</span>
          <span>{isLocating ? t('ရှာနေသည်...', 'Detecting...') : t('တည်နေရာရယူမည်', 'Detect Location')}</span>
        </button>
      </section>

      {locationMessage && (
        <div className="p-3.5 bg-[#b7fbf3]/60 border border-[#00535b]/20 rounded-2xl text-xs font-bold text-[#00535b] flex items-center gap-2 animate-in fade-in">
          <span className="material-symbols-outlined text-lg">location_on</span>
          <span>{locationMessage}</span>
        </div>
      )}

      {isLoadingWeather && (
        <div className="flex items-center justify-center py-4 text-[#00535b]">
          <span className="w-5 h-5 border-2 border-[#00535b] border-t-transparent rounded-full animate-spin mr-2" />
          <span className="text-xs font-bold">{t('ရာသီဥတုရယူနေသည်...', 'Loading weather...')}</span>
        </div>
      )}

      <section className="bg-gradient-to-br from-[#00535b] to-[#00383f] text-white rounded-3xl p-6 shadow-md relative overflow-hidden space-y-6">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-white/5 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/15 pb-4 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#ffba27] text-2xl">partly_cloudy_day</span>
              <span className="text-xs font-extrabold uppercase tracking-widest text-[#9becf7]">
                {t('မိုးလေဝသခန့်မှန်းချက်', 'Live Weather Forecast')}
              </span>
            </div>
            <h3 className="text-2xl font-extrabold mt-1">{language === 'my' ? currentWeather.cityBurmese : currentWeather.city}</h3>
          </div>

          <div className="flex flex-wrap gap-2">
            {cityOptions.map((c) => (
              <button
                key={c.key}
                onClick={() => handleCityChange(c.key)}
                className={`px-3 py-1.5 rounded-full text-xs font-extrabold transition-all cursor-pointer ${
                  selectedCity === c.key ? 'bg-[#ffba27] text-[#00201e] shadow-sm scale-105' : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
              >
                {t(c.labelMy, c.labelEn)}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center relative z-10">
          <div className="flex items-center gap-5 md:col-span-1">
            <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/20">
              <span className="material-symbols-outlined text-5xl text-[#ffba27]">{currentWeather.iconName}</span>
            </div>
            <div>
              <p className="text-4xl font-extrabold tracking-tight">{currentWeather.tempCelsius}°C</p>
              <p className="text-xs font-bold text-[#9becf7] mt-1 leading-snug">{language === 'my' ? currentWeather.conditionBurmese : currentWeather.conditionEnglish}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 md:col-span-2">
            <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10 text-center">
              <span className="material-symbols-outlined text-lg text-[#9becf7]">water_drop</span>
              <p className="text-[10px] text-gray-200 font-semibold mt-1">{t('မိုးရွာနိုင်ခြေ', 'Rain Chance')}</p>
              <p className="text-sm font-extrabold text-white mt-0.5">{currentWeather.rainProbabilityPercent}%</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10 text-center">
              <span className="material-symbols-outlined text-lg text-[#9becf7]">humidity_mid</span>
              <p className="text-[10px] text-gray-200 font-semibold mt-1">{t('စိုထိုင်းဆ', 'Humidity')}</p>
              <p className="text-sm font-extrabold text-white mt-0.5">{currentWeather.humidityPercent}%</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10 text-center">
              <span className="material-symbols-outlined text-lg text-[#9becf7]">air</span>
              <p className="text-[10px] text-gray-200 font-semibold mt-1">{t('လေအရှိန်', 'Wind Speed')}</p>
              <p className="text-sm font-extrabold text-white mt-0.5">{currentWeather.windSpeedKmh} km/h</p>
            </div>
          </div>
        </div>

        {currentWeather.stormWarning && (
          <div className="p-4 bg-[#ba1a1a]/90 text-white rounded-2xl border border-red-300 flex items-start gap-3 relative z-10">
            <span className="material-symbols-outlined text-2xl shrink-0 animate-bounce">warning</span>
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wider">{t('⛈️ မိုးကြိုးမုန်တိုင်းသတိပေးချက်', '⛈️ Weather Warning')}</p>
              <p className="text-xs font-semibold mt-0.5 leading-relaxed">{currentWeather.stormWarning}</p>
            </div>
          </div>
        )}

        <div className="pt-2 border-t border-white/15 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-start gap-2.5">
            <span className="material-symbols-outlined text-[#ffba27] text-xl shrink-0 mt-0.5">lightbulb</span>
            <div>
              <p className="text-xs font-extrabold text-[#9becf7]">{t('ဆိုင်အတွက် AI အကြံပြုချက်:', 'AI Business Tip:')}</p>
              <p className="text-xs font-bold text-white leading-relaxed mt-0.5">
                {t(currentWeather.businessAdviceBurmese, currentWeather.businessAdviceEnglish)}
              </p>
            </div>
          </div>

          <button
            onClick={handlePlayVoiceAnnouncement}
            className={`shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-all cursor-pointer shadow-md ${
              isPlayingAudio ? 'bg-[#ffba27] text-[#00201e] scale-105 animate-pulse' : 'bg-white text-[#00535b] hover:bg-[#9becf7]'
            }`}
          >
            <span className="material-symbols-outlined text-lg">{isPlayingAudio ? 'graphic_eq' : 'volume_up'}</span>
            <span>{isPlayingAudio ? t('ဖတ်ပြနေသည်...', 'Playing...') : t('အသံနားထောင်မည် 🔊', 'Listen 🔊')}</span>
          </button>
        </div>
      </section>

      <section className="space-y-4 pt-2">
        <div className="flex items-center justify-between px-1">
          <div>
            <h3 className="font-extrabold text-lg text-[#00535b] flex items-center gap-2">
              <span className="material-symbols-outlined text-2xl text-[#006d77]">storefront</span>
              <span>{t('အနီးရှိအကောင်းဆုံးဈေးကွက်များ', 'Recommended Nearby Markets')}</span>
            </h3>
            <p className="text-xs text-[#3e494a] font-semibold mt-0.5">
              {t('တည်နေရာအပေါ်အခြေခံ၍ AI မှအကြံပြုထားသောဈေးကွက်များ', 'AI recommended market hubs matching your local products')}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {marketRecommendations.map((market) => (
            <div key={market.id} className="bg-white p-5 rounded-3xl shadow-xs border border-[#bec8ca]/30 flex flex-col justify-between hover:shadow-md transition-all space-y-4 group">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="w-12 h-12 rounded-2xl bg-[#b7fbf3] flex items-center justify-center text-[#00535b] group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-2xl">store</span>
                  </div>
                  <span className="px-3 py-1 bg-[#ffdea9] text-[#634500] text-[11px] font-extrabold rounded-full">
                    {market.distanceKm} km {t('အကွာအဝေး', 'away')}
                  </span>
                </div>
                <div>
                  <h4 className="font-extrabold text-base text-[#00201e]">{market.nameBurmese}</h4>
                  <p className="text-xs font-bold text-[#00535b] mt-0.5">{market.name}</p>
                  <p className="text-[11px] font-semibold text-[#8c4e35] mt-1">{t(market.typeBurmese, market.typeEnglish)}</p>
                </div>
                <div className="p-3 bg-[#e4fffb] rounded-2xl border border-[#00535b]/10 space-y-1.5">
                  <p className="text-[11px] font-extrabold text-[#00535b]">{t('💼 အခွင့်အလမ်း:', '💼 Opportunity:')}</p>
                  <p className="text-xs text-[#00201e] leading-snug font-medium">{t(market.opportunityBurmese, market.opportunityEnglish)}</p>
                </div>
              </div>
              <div className="pt-2 border-t border-gray-100 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500 font-semibold">{t('အကောင်းဆုံးပစ္စည်းများ:', 'Best Products:')}</span>
                  <span className="font-bold text-[#00535b]">{t(market.bestSellingProductsBurmese, market.bestSellingProductsEnglish)}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500 font-semibold">{t('လူစည်ကားမှု:', 'Foot Traffic:')}</span>
                  <span className="font-extrabold text-[#825b00] px-2 py-0.5 bg-[#ffba27]/20 rounded-md">🔥 {language === 'my' ? ({ High: 'များ', Medium: 'အလယ်အလတ်', 'Very High': 'အလွန်များ' }[market.footTrafficLevel]) : market.footTrafficLevel}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <FloatingMicButton onOpenVoiceModal={onOpenVoiceModal} />
    </div>
  );
};
