import React, { useState, useEffect } from 'react';
import bowingFarmerImg from '../assets/images/bowing_farmer_1784709620860.jpg';

interface OnboardingScreenProps {
  onComplete: () => void;
  language: 'my' | 'en';
}

const featureListEn = [
  'Voice-first AI assistant in Myanmar language',
  'Discover loans & financial services near you',
  'Track daily sales & profit with simple voice',
  'Weather alerts & market recommendations',
];
const featureListMy = [
  'မြန်မာလို အသံဖြင့် AI မန်နေဂျာ',
  'အနီးနားရှိ ချေးငွေဝန်ဆောင်မှုများကို ရှာဖွေပါ',
  'အသံဖြင့် နေ့စဉ်အရောင်းအဝယ်များကို မှတ်တမ်းတင်ပါ',
  'မိုးလေဝသ & ဈေးကွက် အကြံပြုချက်များ',
];

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({
  onComplete,
  language: initialLanguage,
}) => {
  const [lang, setLang] = useState<'my' | 'en'>(initialLanguage);
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('9450123456');
  const [otpDigits, setOtpDigits] = useState(['1', '2', '3', '4']);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastText, setToastText] = useState('');

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (step === 'otp' && timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    } else if (timer === 0) {
      setCanResend(true);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [step, timer]);

  const t = (my: string, en: string) => (lang === 'my' ? my : en);

  const handleSendOtp = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!phoneNumber.trim()) return;

    setIsSendingOtp(true);
    setTimeout(() => {
      setIsSendingOtp(false);
      setStep('otp');
      setTimer(30);
      setCanResend(false);

      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const msg = t(
          'မင်္ဂလာပါခင်ဗျာ။ သင့်ဖုန်းသို့ OTP ကုဒ် ၁ ၂ ၃ ၄ ပေးပို့ထားပါသည်။',
          'Mingalaba! Your OTP code is 1 2 3 4.'
        );
        const utterance = new SpeechSynthesisUtterance(msg);
        utterance.rate = 0.95;
        window.speechSynthesis.speak(utterance);
      }
    }, 800);
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newDigits = [...otpDigits];
    newDigits[index] = value.slice(-1);
    setOtpDigits(newDigits);
    if (value && index < 3) {
      const next = document.getElementById(`otp-input-${index + 1}`);
      if (next) next.focus();
    }
  };

  const handleListenOtp = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const msg = t(
        `သင့် OTP ကုဒ်မှာ ${otpDigits.join(' ')} ဖြစ်ပါသည်။`,
        `Your OTP verification code is ${otpDigits.join(' ')}.`
      );
      const utterance = new SpeechSynthesisUtterance(msg);
      utterance.rate = 0.85;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleVerifyOtp = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      setToastText(t(
        'မင်္ဂလာပါ! အောင်မြင်စွာ ဝင်ရောက်ပြီးပါပြီ',
        'Welcome! Login verified successfully'
      ));
      setShowToast(true);
      setTimeout(() => { setShowToast(false); onComplete(); }, 1200);
    }, 1000);
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#f8f9fa] text-[#00201e]">
      {/* ===== LEFT PANEL: Branding & Illustration ===== */}
      <div className="relative flex flex-col justify-center items-center lg:w-[45%] bg-gradient-to-br from-[#00535b] via-[#006d77] to-[#00383f] text-white p-8 lg:p-12 overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#ffba27]/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        {/* Language toggle on mobile */}
        <div className="absolute top-4 right-4 lg:hidden z-10">
          <button
            onClick={() => setLang((l) => (l === 'my' ? 'en' : 'my'))}
            className="px-3 py-1.5 bg-white/20 backdrop-blur-sm text-white rounded-lg text-xs font-bold hover:bg-white/30 transition-colors cursor-pointer"
          >
            {lang === 'my' ? '🇬🇧 EN' : '🇲🇲 မြန်မာ'}
          </button>
        </div>

        <div className="relative z-10 flex flex-col items-center text-center lg:items-start lg:text-left max-w-md">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
              <span className="material-symbols-outlined text-3xl">storefront</span>
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight">ခြေလှမ်းသစ်</h1>
              <p className="text-sm font-semibold text-[#9becf7]">First Step</p>
            </div>
          </div>

          {/* Farmer Illustration */}
          <div className="relative w-48 h-48 lg:w-56 lg:h-56 rounded-full p-1 bg-gradient-to-tr from-[#ffba27] via-white/30 to-[#9becf7] shadow-2xl mb-6 group">
            <div className="w-full h-full rounded-full overflow-hidden border-4 border-white/80 bg-[#e4fffb]">
              <img
                src={bowingFarmerImg}
                alt="Welcoming Myanmar farmer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-white/20 backdrop-blur-md text-white px-4 py-1 rounded-full text-xs font-extrabold shadow-md border border-white/30 whitespace-nowrap flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm text-[#ffba27]">volunteer_activism</span>
              <span>{t('မင်္ဂလာပါ ခင်ဗျာ', 'Mingalaba!')}</span>
            </div>
          </div>

          {/* Welcome Text */}
          <h2 className="text-2xl lg:text-3xl font-black mb-2">
            {t('ကြိုဆိုပါတယ်', 'Welcome to First Step')}
          </h2>
          <p className="text-sm lg:text-base text-[#9becf7] font-semibold mb-8 leading-relaxed">
            {t(
              'အသေးစားလုပ်ငန်းရှင်များနှင့် တောင်သူဦးကြီးများအတွက် AI အသံမန်နေဂျာ',
              'AI Voice Manager for Myanmar micro-entrepreneurs & farmers'
            )}
          </p>

          {/* Feature List */}
          <div className="space-y-3 w-full">
            {(lang === 'my' ? featureListMy : featureListEn).map((feat, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#ffba27]/20 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[#ffba27] text-sm">check</span>
                </div>
                <span className="text-sm font-medium">{feat}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ===== RIGHT PANEL: Login Form ===== */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-[#f8f9fa]">
        <div className="w-full max-w-md">
          {/* Language toggle on desktop */}
          <div className="hidden lg:flex justify-end mb-6">
            <button
              onClick={() => setLang((l) => (l === 'my' ? 'en' : 'my'))}
              className="px-3 py-1.5 bg-white border border-[#00535b]/20 text-[#00535b] rounded-lg text-xs font-bold shadow-xs hover:bg-[#b7fbf3] transition-colors cursor-pointer"
            >
              {lang === 'my' ? '🇬🇧 English' : '🇲🇲 မြန်မာ'}
            </button>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-3xl p-8 shadow-xl border border-[#bec8ca]/20">
            {/* Title */}
            <div className="text-center mb-6">
              <h3 className="text-2xl font-extrabold text-[#00535b]">
                {step === 'phone'
                  ? t('အကောင့်ဝင်ရန်', 'Sign In')
                  : t('OTP အတည်ပြုရန်', 'Verify OTP')}
              </h3>
              <p className="text-sm text-[#3e494a] font-medium mt-1">
                {step === 'phone'
                  ? t('သင့်ဖုန်းနံပါတ်ဖြည့်ပါ', 'Enter your phone number to continue')
                  : t('သင့်ဖုန်းသို့ပို့ထားသော ကုဒ်ကိုရိုက်ထည့်ပါ', 'Enter the code sent to your phone')}
              </p>
            </div>

            {/* Speech Bubble / Assistant Message */}
            <div className="flex items-start gap-3 bg-[#e4fffb] p-4 rounded-2xl border border-[#00535b]/10 mb-6">
              <span className="material-symbols-outlined text-[#00535b] text-xl fill shrink-0 mt-0.5">record_voice_over</span>
              <div>
                <p className="text-[10px] font-bold text-[#00535b] uppercase tracking-wider mb-0.5">
                  {t('AI မန်နေဂျာ', 'AI Assistant')}
                </p>
                <p className="text-xs sm:text-sm font-semibold text-[#00201e] leading-snug">
                  {step === 'phone'
                    ? t('မင်္ဂလာပါ! သင့်လုပ်ငန်းစတင်ရန် ဖုန်းနံပါတ်ဖြည့်ပါခင်ဗျာ။', 'Mingalaba! Please enter your phone to get started.')
                    : t(`+95 ${phoneNumber} သို့ OTP ကုဒ် ၄ လုံးပို့ထားပါသည်။`, `A 4-digit OTP has been sent to +95 ${phoneNumber}.`)}
                </p>
              </div>
            </div>

            {/* STEP 1: Phone Number */}
            {step === 'phone' && (
              <form onSubmit={handleSendOtp} className="space-y-5 animate-in fade-in duration-200">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#3e494a] block ml-1 uppercase tracking-wider">
                    {t('ဖုန်းနံပါတ်', 'Phone Number')}
                  </label>
                  <div className="relative flex items-center">
                    <div className="absolute left-4 flex items-center gap-2 pointer-events-none z-10">
                      <div className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-lg">
                        <span className="text-sm font-extrabold text-[#00201e]">+95</span>
                      </div>
                    </div>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full h-14 pl-20 pr-4 bg-white border-2 border-[#bec8ca] focus:border-[#00535b] rounded-2xl font-bold text-lg outline-none transition-all placeholder:text-[#6f797a] shadow-xs"
                      placeholder="9 xxxxxxxx"
                      required
                    />
                  </div>
                  <p className="text-[11px] text-[#3e494a] ml-1 font-medium">
                    {t('စမ်းသပ်ရန်: 09450123456', 'Demo: 09-450123456')}
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isSendingOtp || !phoneNumber.trim()}
                  className="w-full h-14 bg-[#00535b] hover:bg-[#006d77] disabled:opacity-50 text-white rounded-2xl font-bold text-base flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition-all cursor-pointer"
                >
                  {isSendingOtp ? (
                    <span className="flex items-center gap-2">
                      <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>{t('OTP ပို့နေသည်...', 'Sending OTP...')}</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <span>{t('OTP ကုဒ်တောင်းမည်', 'Request OTP Code')}</span>
                      <span className="material-symbols-outlined text-xl">send</span>
                    </span>
                  )}
                </button>
              </form>
            )}

            {/* STEP 2: OTP */}
            {step === 'otp' && (
              <form onSubmit={handleVerifyOtp} className="space-y-6 animate-in fade-in duration-200">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-[#3e494a] uppercase tracking-wider">
                      {t('OTP ကုဒ်', 'One-Time Password')}
                    </label>
                    <button type="button" onClick={handleListenOtp}
                      className="text-xs font-bold text-[#00535b] bg-[#e4fffb] hover:bg-[#b1f5ed] px-2.5 py-1 rounded-full border border-[#00535b]/20 flex items-center gap-1 cursor-pointer">
                      <span className="material-symbols-outlined text-sm">volume_up</span>
                      <span>{t('နားထောင်မည်', 'Listen')}</span>
                    </button>
                  </div>

                  <div className="flex justify-center gap-3">
                    {otpDigits.map((digit, idx) => (
                      <input
                        key={idx}
                        id={`otp-input-${idx}`}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(idx, e.target.value)}
                        className="w-14 h-14 sm:w-16 sm:h-16 text-center text-2xl font-black bg-white border-2 border-[#00535b] rounded-2xl focus:bg-[#e4fffb] focus:outline-none shadow-sm transition-all"
                      />
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <button type="button" onClick={() => setOtpDigits(['1', '2', '3', '4'])}
                      className="text-xs font-bold text-[#006d77] underline cursor-pointer">
                      {t('ဒီမိုဖြည့်ရန် 1234', 'Fill Demo 1234')}
                    </button>

                    <div className="text-xs font-bold text-[#3e494a]">
                      {canResend ? (
                        <button type="button" onClick={() => handleSendOtp()}
                          className="text-[#8c4e35] font-extrabold hover:underline cursor-pointer">
                          {t('ပြန်ပို့မည်', 'Resend')}
                        </button>
                      ) : (
                        <span>{t(`ပြန်ပို့ရန် ${timer}စက္ကန့်`, `Resend in ${timer}s`)}</span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isVerifying || otpDigits.some((d) => !d)}
                  className="w-full h-14 bg-[#00535b] hover:bg-[#006d77] disabled:opacity-50 text-white rounded-2xl font-bold text-base flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition-all cursor-pointer"
                >
                  {isVerifying ? (
                    <span className="flex items-center gap-2">
                      <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>{t('အတည်ပြုနေသည်...', 'Verifying...')}</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <span>{t('အတည်ပြုပြီးဝင်မည်', 'Verify & Sign In')}</span>
                      <span className="material-symbols-outlined text-xl">check_circle</span>
                    </span>
                  )}
                </button>

                <button type="button" onClick={() => setStep('phone')}
                  className="w-full py-2 text-xs font-bold text-[#3e494a] hover:text-[#00535b] transition-colors text-center block cursor-pointer">
                  {t('← ဖုန်းနံပါတ်ပြန်ပြင်မည်', '← Change Phone Number')}
                </button>
              </form>
            )}

            {/* Footer */}
            <p className="text-center text-[10px] text-[#6f797a] font-medium mt-6 pt-4 border-t border-gray-100">
              {t('အသံဖြင့်သာ အလွယ်တကူသုံးနိုင်ရန် ဒီဇိုင်းထားသည်', 'Designed for simple voice-first interaction')}
            </p>
          </div>
        </div>
      </div>

      {/* Toast */}
      {showToast && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-[#00201e] text-[#e4fffb] px-6 py-3.5 rounded-full shadow-2xl z-50 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-5 duration-200">
          <span className="material-symbols-outlined text-[#e4fffb]">check_circle</span>
          <span className="text-xs font-bold">{toastText}</span>
        </div>
      )}
    </div>
  );
};
