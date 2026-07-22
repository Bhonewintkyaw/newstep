import React, { useState } from 'react';
import { UserProfile, TabType } from '../types';
import { FloatingMicButton } from '../components/FloatingMicButton';

interface HomeScreenProps {
  userProfile: UserProfile;
  onSelectTab: (tab: TabType) => void;
  onOpenVoiceModal: () => void;
  language: 'my' | 'en';
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  userProfile,
  onSelectTab,
  onOpenVoiceModal,
  language,
}) => {
  const [showWeatherDetails, setShowWeatherDetails] = useState(false);

  return (
    <div className="screen-shell space-y-6 lg:space-y-8">
      {/* Top Hero Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {/* User Profile Summary Card */}
        <section className="glass-card rounded-3xl p-6 shadow-xs flex items-center justify-between border border-[#bec8ca]/30 lg:col-span-2">
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border-2 border-[#006d77] shadow-sm shrink-0">
              <img
                src={userProfile.avatarUrl}
                alt={userProfile.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h2 className="font-extrabold text-lg sm:text-2xl text-[#00201e] leading-snug">
                {userProfile.name}
              </h2>
              <p className="text-xs sm:text-sm font-semibold text-[#3e494a] mt-0.5">
                {language === 'my' ? userProfile.titleBurmese : userProfile.titleEnglish}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs font-bold text-[#00535b] bg-[#b7fbf3] px-3 py-1 rounded-full border border-[#00535b]/10">
                  {userProfile.shopName}
                </span>
                <span className="text-xs text-[#3e494a] hidden sm:inline">
                  • {userProfile.city}
                </span>
              </div>
            </div>
          </div>

          <div className="text-right shrink-0">
            <div className="flex gap-1 justify-end">
              {Array.from({ length: userProfile.ratingStars }).map((_, star) => (
                <span
                  key={star}
                  className="material-symbols-outlined fill text-2xl text-[#ffba27]"
                >
                  star
                </span>
              ))}
            </div>
            <p className="text-xs font-extrabold text-[#00535b] mt-1 bg-[#006d77]/10 px-2.5 py-1 rounded-full">
              {language === 'my' ? userProfile.trustedStatusBurmese : userProfile.trustedStatusEnglish}
            </p>
          </div>
        </section>

        {/* Quick Weather Forecast Summary Card */}
        <section
          onClick={() => onSelectTab('prediction')}
          className="bg-gradient-to-br from-[#b7fbf3] to-[#c4fff8] p-6 rounded-3xl shadow-xs border border-[#00535b]/15 flex items-center justify-between cursor-pointer hover:shadow-md transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/80 flex items-center justify-center shadow-xs">
              <span className="material-symbols-outlined text-4xl text-[#634500] fill animate-pulse">
                wb_sunny
              </span>
            </div>
            <div>
              <p className="font-extrabold text-base text-[#00201e]">
                {language === 'my' ? 'မိုးလေဝသ တည်နေရာသတ်မှတ်ရန်' : 'Set location for weather'}
              </p>
              <div className="flex items-center gap-1 text-[#3e494a] text-xs font-semibold mt-0.5">
                <span className="material-symbols-outlined text-sm">location_on</span>
                <span>{language === 'my' ? 'ဒေတာမရှိသေးပါ' : 'No weather data yet'}</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs font-extrabold text-[#00535b] underline group-hover:text-[#00201e]">
              {language === 'my' ? 'ခန့်မှန်းချက် ကြည့်မည် →' : 'View Prediction →'}
            </span>
          </div>
        </section>
      </div>

      {/* Voice Assistant Main Pulse Call-To-Action */}
      <section className="bg-gradient-to-r from-[#e4fffb] via-white to-[#c4fff8] rounded-3xl p-6 md:p-8 border border-[#00535b]/15 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-2">
          <div className="inline-flex items-center gap-2 bg-[#006d77]/10 px-3.5 py-1 rounded-full text-xs font-extrabold text-[#00535b]">
            <span className="material-symbols-outlined text-sm text-[#ffba27] fill">graphic_eq</span>
            <span>{language === 'my' ? 'မြန်မာ အသံလမ်းညွှန် စနစ်' : 'Myanmar Voice Assistant'}</span>
          </div>
          <h3 className="text-2xl md:text-3xl font-black text-[#00201e] tracking-tight">
            {language === 'my' ? 'အသံဖြင့် မေးမြန်းစုံစမ်းပါ' : 'Ask Anything in Burmese'}
          </h3>
          <p className="text-xs md:text-sm font-semibold text-[#3e494a] max-w-md">
            {language === 'my'
              ? '"ဆန် ၅ အိတ် ရောင်းရသည်" သို့မဟုတ် "အနီးနားရှိ ဘဏ်များနှင့် ချေးငွေအကြောင်း ပြောပြပါ"'
              : 'Say "Sold 5 bags of rice" or "Show nearby banks and loan rates"'}
          </p>
        </div>

        <div className="relative shrink-0 my-2 md:my-0 p-4 overflow-hidden flex items-center justify-center">
          <div className="absolute inset-2 bg-[#00535b]/20 rounded-full animate-ping pointer-events-none" />
          <button
            onClick={onOpenVoiceModal}
            className="voice-pulse w-28 h-28 md:w-32 md:h-32 bg-[#00535b] hover:bg-[#006d77] rounded-full flex items-center justify-center text-white shadow-2xl relative z-10 active:scale-95 transition-transform cursor-pointer"
          >
            <span className="material-symbols-outlined text-5xl md:text-6xl fill">mic</span>
          </button>
        </div>
      </section>

      {/* Main 3 Functional Modules Grid */}
      <section className="space-y-4">
        <h3 className="text-base font-extrabold text-[#00535b] px-1">
          {language === 'my' ? 'အဓိက လုပ်ဆောင်ချက် (Main Functions)' : 'Main System Modules'}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Module 1: Finance */}
          <div
            onClick={() => onSelectTab('loans')}
            className="glass-card rounded-3xl p-6 flex flex-col justify-between h-52 shadow-xs hover:bg-[#b1f5ed] hover:shadow-md transition-all cursor-pointer border border-[#bec8ca]/30 group space-y-3"
          >
            <div className="flex justify-between items-start">
              <div className="w-14 h-14 bg-[#ffad8f]/30 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-[#8c4e35] text-3xl">
                  account_balance
                </span>
              </div>
              <span className="text-[11px] font-extrabold text-[#8c4e35] bg-[#ffad8f]/20 px-2.5 py-1 rounded-full">
                💰 Finance
              </span>
            </div>

            <div>
              <h4 className="font-extrabold text-lg text-[#00201e]">
                {language === 'my' ? '၁။ ငွေရေးကြေးရေး (Finance)' : '1. Finance'}
              </h4>
              <p className="text-xs font-semibold text-[#3e494a] mt-1 leading-snug">
                {language === 'my'
                  ? 'အနီးရှိ ဘဏ်၊ မိုက်ခရိုဖိုင်နန်းများ ရှာဖွေခြင်း၊ ချေးငွေ နှိုင်းယှဉ်ခြင်းနှင့် ခရီးဒစ် ရမှတ် စနစ်'
                  : 'Nearby banks, NGOs, voice guides, loan comparison & Star Level credit system'}
              </p>
            </div>

            <div className="flex items-center gap-1 text-xs font-extrabold text-[#00535b] pt-1">
              <span>{language === 'my' ? 'ဝင်ရောက်ကြည့်ရှုမည်' : 'Explore Finance'}</span>
              <span className="material-symbols-outlined text-base">arrow_forward</span>
            </div>
          </div>

          {/* Module 2: AI Prediction */}
          <div
            onClick={() => onSelectTab('prediction')}
            className="glass-card rounded-3xl p-6 flex flex-col justify-between h-52 shadow-xs hover:bg-[#b1f5ed] hover:shadow-md transition-all cursor-pointer border border-[#bec8ca]/30 group space-y-3"
          >
            <div className="flex justify-between items-start">
              <div className="w-14 h-14 bg-[#ffba27]/30 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-[#825b00] text-3xl">
                  auto_awesome
                </span>
              </div>
              <span className="text-[11px] font-extrabold text-[#825b00] bg-[#ffba27]/20 px-2.5 py-1 rounded-full">
                🤖 AI Prediction
              </span>
            </div>

            <div>
              <h4 className="font-extrabold text-lg text-[#00201e]">
                {language === 'my' ? '၂။ AI ခန့်မှန်းချက် (AI Prediction)' : '2. AI Prediction'}
              </h4>
              <p className="text-xs font-semibold text-[#3e494a] mt-1 leading-snug">
                {language === 'my'
                  ? 'မိုးလေဝသ၊ မုန်တိုင်း သတိပေးချက်နှင့် ရောင်းဝယ်ရန် အကောင်းဆုံး ဈေးကွက် အကြံပြုချက်'
                  : 'Weather forecasts, storm alerts & best market location recommendations'}
              </p>
            </div>

            <div className="flex items-center gap-1 text-xs font-extrabold text-[#00535b] pt-1">
              <span>{language === 'my' ? 'ဝင်ရောက်ကြည့်ရှုမည်' : 'View Predictions'}</span>
              <span className="material-symbols-outlined text-base">arrow_forward</span>
            </div>
          </div>

          {/* Module 3: Inventory System */}
          <div
            onClick={() => onSelectTab('inventory')}
            className="glass-card rounded-3xl p-6 flex flex-col justify-between h-52 shadow-xs hover:bg-[#b1f5ed] hover:shadow-md transition-all cursor-pointer border border-[#bec8ca]/30 group space-y-3"
          >
            <div className="flex justify-between items-start">
              <div className="w-14 h-14 bg-[#006d77]/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-[#00535b] text-3xl">
                  inventory_2
                </span>
              </div>
              <span className="text-[11px] font-extrabold text-[#00535b] bg-[#00535b]/10 px-2.5 py-1 rounded-full">
                📦 Inventory
              </span>
            </div>

            <div>
              <h4 className="font-extrabold text-lg text-[#00201e]">
                {language === 'my' ? '၃။ ကုန်ပစ္စည်းစနစ် (Inventory System)' : '3. Inventory System'}
              </h4>
              <p className="text-xs font-semibold text-[#3e494a] mt-1 leading-snug">
                {language === 'my'
                  ? 'အသံဖြင့် အရောင်းအဝယ်မှတ်ခြင်း၊ နေ့စဉ်/လစဉ် အမြတ်ငွေနှင့် ချေးငွေပြန်ဆပ်နိုင်စွမ်း သုံးသပ်ချက်'
                  : 'Voice trade recording, daily/monthly profit & loan repayment safety analysis'}
              </p>
            </div>

            <div className="flex items-center gap-1 text-xs font-extrabold text-[#00535b] pt-1">
              <span>{language === 'my' ? 'ဝင်ရောက်ကြည့်ရှုမည်' : 'Open Inventory'}</span>
              <span className="material-symbols-outlined text-base">arrow_forward</span>
            </div>
          </div>
        </div>
      </section>

      <FloatingMicButton onOpenVoiceModal={onOpenVoiceModal} />
    </div>
  );
};
