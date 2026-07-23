import React, { useState } from 'react';
import { TabType, UserProfile } from '../types';

interface HeaderProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
  onOpenVoiceModal: () => void;
  userProfile: UserProfile;
  language: 'my' | 'en';
  onToggleLanguage: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  onOpenVoiceModal,
  userProfile,
  language,
  onToggleLanguage,
}) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <>
      <header className="fixed top-0 left-0 w-full lg:left-64 lg:w-[calc(100%-16rem)] z-30 flex items-center justify-between gap-2 px-3 sm:px-5 md:px-8 h-16 bg-[#e4fffb]/95 backdrop-blur-md shadow-xs border-b border-[#00535b]/10 transition-[left,width] duration-200">
        <div className="flex min-w-0 items-center gap-1 sm:gap-3">
          <button
            onClick={() => setIsDrawerOpen(true)}
            aria-label="Open menu"
            className="lg:hidden w-10 h-10 flex items-center justify-center text-[#00535b] active:scale-95 transition-transform hover:bg-[#b1f5ed] rounded-full cursor-pointer"
          >
            <span className="material-symbols-outlined text-2xl">menu</span>
          </button>
          <button
            onClick={() => onSelectTab('home')}
            className="flex min-w-0 items-center gap-2 text-left active:opacity-80 cursor-pointer"
          >
            <h1 className="truncate font-extrabold text-base sm:text-xl text-[#00535b] tracking-tight">
              ခြေလှမ်းသစ်
            </h1>
            <span className="hidden min-[430px]:inline text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#006d77]/10 text-[#00535b] shrink-0">
              First Step
            </span>
          </button>
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:gap-3">
          <button
            onClick={onToggleLanguage}
            aria-label="Change language"
            className="px-2 sm:px-3 py-1.5 text-xs font-bold rounded-xl border border-[#00535b]/20 bg-white text-[#00535b] hover:bg-[#b7fbf3] transition-colors shadow-xs cursor-pointer"
          >
            {language === 'my' ? '🇲🇲 မြန်မာ' : '🇬🇧 EN'}
          </button>
          <button
            onClick={onOpenVoiceModal}
            aria-label="Voice Assistant"
            className="w-10 h-10 flex items-center justify-center text-[#00535b] active:scale-95 transition-transform hover:bg-[#b1f5ed] rounded-full relative cursor-pointer"
          >
            <span className="material-symbols-outlined text-2xl">graphic_eq</span>
            <span className="absolute top-2 right-2 w-2 h-2 bg-[#ffba27] rounded-full animate-ping" />
          </button>
        </div>
      </header>

      {/* Side Navigation Drawer */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsDrawerOpen(false)}
          />
          <div role="dialog" aria-modal="true" aria-label="Navigation menu" className="relative w-80 max-w-[88vw] bg-white h-full shadow-2xl flex flex-col justify-between p-5 z-10 animate-in slide-in-from-left duration-200 overflow-y-auto">
            <div>
              <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-[#006d77]">
                    <img
                      src={userProfile.avatarUrl}
                      alt={userProfile.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#00201e]">{userProfile.name}</h3>
                    <p className="text-xs text-[#3e494a]">
                      {language === 'my' ? userProfile.titleBurmese : userProfile.titleEnglish}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-1 rounded-full text-gray-500 hover:bg-gray-100"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="space-y-1">
                <button
                  onClick={() => {
                    onSelectTab('home');
                    setIsDrawerOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
                    currentTab === 'home'
                      ? 'bg-[#006d77] text-white'
                      : 'text-[#00201e] hover:bg-[#e4fffb]'
                  }`}
                >
                  <span className="material-symbols-outlined">home</span>
                  <span>{language === 'my' ? 'ပင်မစာမျက်နှာ' : 'Home'}</span>
                </button>

                <button
                  onClick={() => {
                    onSelectTab('loans');
                    setIsDrawerOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
                    currentTab === 'loans'
                      ? 'bg-[#006d77] text-white'
                      : 'text-[#00201e] hover:bg-[#e4fffb]'
                  }`}
                >
                  <span className="material-symbols-outlined">account_balance</span>
                  <span>{language === 'my' ? 'ချေးငွေဝန်ဆောင်မှု' : 'Loans'}</span>
                </button>

                <button
                  onClick={() => {
                    onSelectTab('inventory');
                    setIsDrawerOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
                    currentTab === 'inventory'
                      ? 'bg-[#006d77] text-white'
                      : 'text-[#00201e] hover:bg-[#e4fffb]'
                  }`}
                >
                  <span className="material-symbols-outlined">inventory_2</span>
                  <span>{language === 'my' ? 'ကုန်ပစ္စည်းစာရင်း' : 'Inventory'}</span>
                </button>

                <button
                  onClick={() => {
                    onSelectTab('profile');
                    setIsDrawerOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
                    currentTab === 'profile'
                      ? 'bg-[#006d77] text-white'
                      : 'text-[#00201e] hover:bg-[#e4fffb]'
                  }`}
                >
                  <span className="material-symbols-outlined">person</span>
                  <span>{language === 'my' ? 'ပရိုဖိုင် (Profile)' : 'Profile'}</span>
                </button>

                <button
                  onClick={() => {
                    onSelectTab('onboarding');
                    setIsDrawerOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
                    currentTab === 'onboarding'
                      ? 'bg-[#006d77] text-white'
                      : 'text-[#00201e] hover:bg-[#e4fffb]'
                  }`}
                >
                  <span className="material-symbols-outlined">school</span>
                  <span>{language === 'my' ? 'စတင်မိတ်ဆက် (Onboarding Screen)' : 'Onboarding Screen'}</span>
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 space-y-2">
              <button
                onClick={onOpenVoiceModal}
                className="w-full flex items-center justify-center gap-2 py-3 bg-[#00535b] text-white font-semibold rounded-xl active:scale-98 transition-transform shadow-sm"
              >
                <span className="material-symbols-outlined">mic</span>
                <span>{language === 'my' ? 'အသံဖြင့် မေးမြန်းမည်' : 'Voice Assistant'}</span>
              </button>

              <div className="text-center text-xs text-gray-400 pt-2">
                First Step v1.0 • Myanmar Micro-Business AI
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
