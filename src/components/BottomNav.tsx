import React from 'react';
import { TabType, UserProfile } from '../types';
import newStepLogo from '../assets/images/new-step-logo.png';

interface BottomNavProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
  language: 'my' | 'en';
  userProfile?: UserProfile;
  onOpenVoiceModal?: () => void;
  onToggleLanguage?: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onSelectTab,
  language,
  userProfile,
  onOpenVoiceModal,
  onToggleLanguage,
}) => {
  if (currentTab === 'onboarding') {
    return null; // Onboarding screen has its own controls
  }

  const items: {
    id: TabType;
    icon: string;
    labelEnglish: string;
    burmeseMain: string;
  }[] = [
    { id: 'home', icon: 'home', labelEnglish: 'Home', burmeseMain: 'ပင်မ' },
    { id: 'loans', icon: 'account_balance', labelEnglish: 'Finance', burmeseMain: 'ငွေရေးကြေးရေး' },
    { id: 'prediction', icon: 'auto_awesome', labelEnglish: 'AI Forecast', burmeseMain: 'AI ခန့်မှန်းချက်' },
    { id: 'inventory', icon: 'inventory_2', labelEnglish: 'Inventory', burmeseMain: 'ကုန်ပစ္စည်း' },
    { id: 'profile', icon: 'person', labelEnglish: 'Profile', burmeseMain: 'ပရိုဖိုင်' },
  ];

  return (
    <>
      {/* Mobile & Tablet Bottom Navigation Bar (hidden on Desktop lg+) */}
      <nav
        aria-label="Primary navigation"
        className="lg:hidden fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 items-stretch gap-1 px-2 pt-2 pb-[calc(.5rem+env(safe-area-inset-bottom))] bg-[#b7fbf3]/95 backdrop-blur-md shadow-[0_-8px_30px_rgba(0,83,91,.12)] border-t border-[#00535b]/10"
      >
        {items.map((item) => {
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              aria-current={isActive ? 'page' : undefined}
              aria-label={language === 'my' ? item.burmeseMain : item.labelEnglish}
              className={`min-w-0 min-h-14 flex flex-col items-center justify-center px-1 py-1.5 transition-all duration-200 rounded-xl cursor-pointer ${
                isActive
                  ? 'bg-[#006d77] text-[#9becf7] shadow-sm scale-95'
                  : 'text-[#3e494a] hover:bg-[#acefe7]/50'
              }`}
            >
              <span
                className={`material-symbols-outlined text-2xl ${
                  isActive ? 'fill' : ''
                }`}
              >
                {item.icon}
              </span>
              <span className="w-full truncate text-center text-[10px] min-[380px]:text-[11px] font-semibold mt-0.5 tracking-tight">
                {language === 'my' ? item.burmeseMain : item.labelEnglish}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Desktop Navigation Left Sidebar (visible on Desktop lg+) */}
      <aside aria-label="Primary navigation" className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 bg-[#e4fffb] border-r border-[#00535b]/15 shadow-md p-5 justify-between overflow-y-auto">
        <div className="space-y-6">
          {/* Desktop App Branding Logo */}
          <div className="flex items-center gap-3 pb-4 border-b border-[#00535b]/10">
            <img
              src={newStepLogo}
              alt="New Step logo"
              className="w-10 h-10 shrink-0 rounded-xl object-cover shadow-md"
            />
            <div>
              <h1 className="font-extrabold text-lg text-[#00535b] tracking-tight leading-none">
                ခြေလှမ်းသစ်
              </h1>
              <p className="text-[11px] font-bold text-[#006d77] mt-0.5">
                New Step
              </p>
            </div>
          </div>

          {/* User Profile Mini Badge */}
          {userProfile && (
            <div
              onClick={() => onSelectTab('profile')}
              className="flex items-center gap-3 p-3 bg-white/80 rounded-2xl border border-[#00535b]/10 shadow-xs hover:bg-white cursor-pointer transition-all group"
            >
              <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-[#006d77] shrink-0">
                <img
                  src={userProfile.avatarUrl}
                  alt={userProfile.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="overflow-hidden">
                <p className="font-bold text-sm text-[#00201e] truncate group-hover:text-[#00535b]">
                  {userProfile.name}
                </p>
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined fill text-xs text-[#ffba27]">star</span>
                  <span className="text-[10px] font-bold text-[#00535b] truncate">
                    {language === 'my' ? userProfile.trustedStatusBurmese : userProfile.trustedStatusEnglish}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Links */}
          <div className="space-y-1.5 pt-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#3e494a] px-3 mb-2">
              {language === 'my' ? 'ပင်မ အညွှန်းများ' : 'Navigation Menu'}
            </p>

            {items.map((item) => {
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`w-full flex items-center justify-start gap-3 px-3.5 py-2.5 rounded-2xl font-bold transition-[background-color,color,transform] duration-200 cursor-pointer text-left ${
                    isActive
                      ? 'bg-[#00535b] text-white shadow-md translate-x-1'
                      : 'text-[#00201e] hover:bg-[#b7fbf3]/60 hover:text-[#00535b]'
                  }`}
                >
                  <span className={`material-symbols-outlined text-2xl shrink-0 ${isActive ? 'fill' : ''}`}>
                    {item.icon}
                  </span>
                  <div className="flex flex-col text-left leading-tight min-w-0">
                    <span className="font-bold text-sm truncate">
                      {language === 'my' ? item.burmeseMain : item.labelEnglish}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Sidebar Footer Controls */}
        <div className="pt-4 border-t border-[#00535b]/10 space-y-3">
          {/* Voice Assistant Launcher */}
          {onOpenVoiceModal && (
            <button
              onClick={onOpenVoiceModal}
              className="w-full flex items-center justify-center gap-2.5 py-3 bg-[#006d77] hover:bg-[#00535b] text-white font-bold text-xs rounded-2xl shadow-md transition-all active:scale-98 cursor-pointer relative overflow-hidden group"
            >
              <span className="material-symbols-outlined text-lg fill animate-pulse text-[#ffba27]">
                graphic_eq
              </span>
              <span>{language === 'my' ? 'အသံဖြင့် မေးမြန်းမည်' : 'Ask Voice Assistant'}</span>
            </button>
          )}

          {/* Language Toggle Button */}
          {onToggleLanguage && (
            <button
              onClick={onToggleLanguage}
              className="w-full flex items-center justify-between px-3.5 py-2.5 bg-white border border-[#00535b]/20 hover:bg-[#b7fbf3]/50 text-[#00535b] rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              <span className="text-[#3e494a]">
                {language === 'my' ? 'ဘာသာစကား' : 'Language'}
              </span>
              <span className="font-extrabold">
                {language === 'my' ? '🇲🇲 မြန်မာ' : '🇬🇧 English'}
              </span>
            </button>
          )}

          {/* Version / Info */}
          <div className="text-center text-[10px] text-gray-500 font-medium">
            New Step v1.0 • Desktop Mode
          </div>
        </div>
      </aside>
    </>
  );
};
