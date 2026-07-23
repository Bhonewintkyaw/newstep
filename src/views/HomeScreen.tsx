import React from 'react';
import { UserProfile } from '../types';
import { FloatingMicButton } from '../components/FloatingMicButton';
import communityWorkersImg from '../assets/images/image.png';

interface HomeScreenProps {
  userProfile: UserProfile;
  onOpenVoiceModal: () => void;
  language: 'my' | 'en';
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  userProfile,
  onOpenVoiceModal,
  language,
}) => {
  return (
    <div className="screen-shell space-y-6 lg:space-y-8">
      {/* Single Warm Community Welcome */}
      <section className="relative min-h-[34rem] overflow-hidden rounded-[2rem] border border-[#00535b]/10 bg-gradient-to-br from-[#fffaf2] via-[#f8fffe] to-[#c4fff8] px-6 py-8 shadow-sm sm:px-10 sm:py-10">
        <div className="pointer-events-none absolute -bottom-24 -right-16 h-64 w-64 rounded-full bg-[#ffba27]/20 blur-2xl" />
        <div className="pointer-events-none absolute -left-20 top-10 h-40 w-40 rounded-full bg-[#9becf7]/35 blur-2xl" />
        <div className="relative grid h-full items-center gap-8 md:grid-cols-[1fr_18rem]">
          <div className="max-w-2xl">
            <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/75 px-3.5 py-2 text-xs font-extrabold text-[#00535b] shadow-sm">
              <span className="material-symbols-outlined text-base text-[#ffba27]">light_mode</span>
              {language === 'my' ? 'ခြေလှမ်းသစ်မှ ကြိုဆိုပါသည်' : 'Welcome to First Step'}
            </span>
            <p className="mb-2 text-sm font-extrabold text-[#006d77]">
              {language === 'my' ? `မင်္ဂလာပါ ${userProfile.name}` : `Good to see you, ${userProfile.name}`}
            </p>
            <h3 className="max-w-xl text-3xl font-black leading-tight text-[#00201e] sm:text-4xl">
              {language === 'my' ? 'အတူတူလက်တွဲပြီး ပိုမိုကောင်းမွန်တဲ့ မနက်ဖြန်ဆီ။' : 'Together, toward a kinder and brighter tomorrow.'}
            </h3>
            <p className="mt-4 max-w-xl text-sm font-semibold leading-relaxed text-[#3e494a] sm:text-base">
              {language === 'my' ? 'ရိုးရိုးသားသား အလုပ်လုပ်သူတိုင်းအတွက် နွေးထွေးတဲ့ အားပေးမှုနဲ့ အကူအညီ။' : 'A warm place of support for everyday people who work hard and keep moving forward.'}
            </p>
            <div className="mt-6 flex items-center gap-3 text-xs font-extrabold text-[#00535b]">
              <span className="material-symbols-outlined text-xl text-[#ffba27]">favorite</span>
              <span>{language === 'my' ? 'သင်တစ်ယောက်တည်း မဟုတ်ပါဘူး။' : 'You are not walking this road alone.'}</span>
            </div>
          </div>
          <div className="relative mx-auto h-48 w-48 overflow-hidden rounded-full border-8 border-[#d8f3ef] bg-[#d8f3ef] shadow-lg sm:h-56 sm:w-56">
            <img
              src={communityWorkersImg}
              alt={language === 'my' ? 'အလုပ်လုပ်သူများအဖွဲ့' : 'Community workers'}
              className="h-full w-full object-cover object-center"
            />
          </div>
        </div>
      </section>

      <FloatingMicButton onOpenVoiceModal={onOpenVoiceModal} />
    </div>
  );
};
