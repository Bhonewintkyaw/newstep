import React, { useEffect, useRef, useState } from 'react';
import { type ConfirmationResult, RecaptchaVerifier, signInWithPhoneNumber, updateProfile } from 'firebase/auth';
import { ArrowRight } from 'lucide-react';
import { firebaseAuth, isFirebaseConfigured } from '../lib/firebase';

interface OnboardingScreenProps {
  onComplete: (username: string, phone: string) => void;
  language: 'my' | 'en';
}

const firebaseErrorMessage = (code: string, language: 'my' | 'en') => {
  const messages: Record<string, [string, string]> = {
    'auth/invalid-phone-number': ['ဖုန်းနံပါတ် မမှန်ပါ။', 'Enter a valid phone number.'],
    'auth/too-many-requests': ['တောင်းဆိုမှုများလွန်းနေပါသည်။ ခဏစောင့်ပြီး ထပ်ကြိုးစားပါ။', 'Too many attempts. Please wait and try again.'],
    'auth/quota-exceeded': ['Firebase SMS ပို့နိုင်သည့်ပမာဏ ပြည့်သွားပါပြီ။', 'The Firebase SMS quota has been exceeded.'],
    'auth/invalid-verification-code': ['OTP ကုဒ် မမှန်ပါ။', 'The OTP code is incorrect.'],
    'auth/code-expired': ['OTP ကုဒ် သက်တမ်းကုန်သွားပါပြီ။ အသစ်ပြန်တောင်းပါ။', 'The OTP code has expired. Request a new one.'],
    'auth/captcha-check-failed': ['reCAPTCHA အတည်ပြုမှု မအောင်မြင်ပါ။', 'reCAPTCHA verification failed. Please try again.'],
    'auth/unauthorized-domain': ['ဤဝဘ်ဆိုက်ဒိုမိန်းကို Firebase Authorized domains တွင် ထည့်ရန်လိုပါသည်။', 'Add this site domain to Firebase Authentication → Authorized domains.'],
    'auth/operation-not-allowed': ['Firebase Console တွင် Phone sign-in ကို ဖွင့်ရန်လိုပါသည်။', 'Enable the Phone provider in Firebase Authentication → Sign-in method.'],
    'auth/billing-not-enabled': ['ဤ Firebase project တွင် SMS အတွက် billing ဖွင့်ရန်လိုပါသည်။', 'Billing must be enabled for SMS authentication on this Firebase project.'],
    'auth/invalid-app-credential': ['Firebase reCAPTCHA အတည်ပြုချက် မမှန်ပါ။ စာမျက်နှာကို refresh လုပ်ပြီး ထပ်ကြိုးစားပါ။', 'Firebase rejected the reCAPTCHA credential. Refresh the page and try again.'],
    'auth/network-request-failed': ['ကွန်ရက်ချိတ်ဆက်မှု မအောင်မြင်ပါ။', 'The Firebase network request failed. Check your connection.'],
    'auth/missing-phone-number': ['ဖုန်းနံပါတ် ထည့်ရန်လိုပါသည်။', 'Enter a phone number.'],
  };
  const message = messages[code] ?? ['အတည်ပြုမှု မအောင်မြင်ပါ။ ထပ်မံကြိုးစားပါ။', 'Authentication failed. Please try again.'];
  return language === 'my' ? message[0] : message[1];
};

const normalizeMyanmarPhone = (value: string) => {
  let digits = value.replace(/\D/g, '');
  if (digits.startsWith('95')) return `+${digits}`;
  digits = digits.replace(/^0+/, '');
  return `+95${digits}`;
};

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete, language: initialLanguage }) => {
  const [language, setLanguage] = useState<'my' | 'en'>(initialLanguage);
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [username, setUsername] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState('');
  const [secondsRemaining, setSecondsRemaining] = useState(60);
  const confirmationRef = useRef<ConfirmationResult | null>(null);
  const recaptchaRef = useRef<RecaptchaVerifier | null>(null);
  const verifiedPhoneRef = useRef('');
  const t = (my: string, en: string) => language === 'my' ? my : en;

  useEffect(() => {
    if (step !== 'otp' || secondsRemaining <= 0) return;
    const timer = window.setInterval(() => setSecondsRemaining((seconds) => seconds - 1), 1000);
    return () => window.clearInterval(timer);
  }, [step, secondsRemaining]);

  useEffect(() => () => recaptchaRef.current?.clear(), []);

  const getRecaptchaVerifier = (buttonId: string) => {
    if (!firebaseAuth) return null;
    if (!recaptchaRef.current) {
      recaptchaRef.current = new RecaptchaVerifier(firebaseAuth, buttonId, {
        size: 'invisible',
        callback: () => setError(''),
        'expired-callback': () => {
          recaptchaRef.current?.clear();
          recaptchaRef.current = null;
          setError(t('reCAPTCHA သက်တမ်းကုန်သွားပါပြီ။ ထပ်မံကြိုးစားပါ။', 'reCAPTCHA expired. Please try again.'));
        },
      });
    }
    return recaptchaRef.current;
  };

  const sendOtp = async (event?: React.FormEvent, buttonId = 'firebase-sign-in-button') => {
    event?.preventDefault();
    setError('');
    if (!username.trim() || !phoneNumber.trim()) return;
    if (!isFirebaseConfigured || !firebaseAuth) {
      setError(t('Firebase အချက်အလက် မသတ်မှတ်ရသေးပါ။ .env ဖိုင်တွင် VITE_FIREBASE_* တန်ဖိုးများ ထည့်ပါ။', 'Firebase is not configured. Add the VITE_FIREBASE_* values to your .env file.'));
      return;
    }

    const normalizedPhone = normalizeMyanmarPhone(phoneNumber);
    if (!/^\+\d{8,15}$/.test(normalizedPhone)) {
      setError(t('မှန်ကန်သော ဖုန်းနံပါတ် ထည့်ပါ။', 'Enter a valid phone number.'));
      return;
    }

    setIsBusy(true);
    try {
      const verifier = getRecaptchaVerifier(buttonId);
      if (!verifier) throw new Error('auth/not-configured');
      await verifier.render();
      confirmationRef.current = await signInWithPhoneNumber(firebaseAuth, normalizedPhone, verifier);
      verifier.clear();
      recaptchaRef.current = null;
      verifiedPhoneRef.current = normalizedPhone;
      setOtp('');
      setSecondsRemaining(60);
      setStep('otp');
    } catch (authError) {
      const code = (authError as { code?: string }).code ?? 'auth/unknown';
      setError(firebaseErrorMessage(code, language));
      recaptchaRef.current?.clear();
      recaptchaRef.current = null;
    } finally {
      setIsBusy(false);
    }
  };

  const verifyOtp = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!confirmationRef.current || otp.length !== 6) return;
    setError('');
    setIsBusy(true);
    try {
      const credential = await confirmationRef.current.confirm(otp);
      if (credential.user.displayName !== username.trim()) {
        await updateProfile(credential.user, { displayName: username.trim() });
      }
      onComplete(username.trim(), verifiedPhoneRef.current);
    } catch (authError) {
      const code = (authError as { code?: string }).code ?? 'auth/unknown';
      setError(firebaseErrorMessage(code, language));
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <main className="relative flex min-h-dvh items-center justify-center bg-[#f5fbfa] px-4 py-12 text-[#00201e] sm:px-6">
      <button onClick={() => setLanguage((value) => value === 'my' ? 'en' : 'my')} className="absolute right-4 top-4 rounded-xl border border-[#d6e8e5] bg-white px-3 py-2 text-xs font-bold text-[#00535b] shadow-sm transition hover:bg-[#e4fffb] sm:right-6 sm:top-6">
        {language === 'my' ? '🇬🇧 English' : '🇲🇲 မြန်မာ'}
      </button>
      <section className="w-full max-w-md">
        <div className="rounded-[2rem] border border-[#d6e8e5] bg-white px-6 py-8 shadow-[0_18px_50px_rgba(0,83,91,.08)] sm:px-8 sm:py-9">
          <div className="mb-7 text-center">
            <h1 className="text-3xl font-black tracking-tight text-[#00535b]">{t('အကောင့်ဝင်ရန်', 'Welcome back')}</h1>
            <p className="mt-1 text-sm font-medium text-[#7a8585]">{t('ခြေလှမ်းသစ်မှ ကြိုဆိုပါသည်', 'Take your next step with us')}</p>
          </div>
          <div className="mb-6">
            <p className="text-xs font-extrabold uppercase tracking-[.16em] text-[#006d77]">{step === 'phone' ? t('လုံခြုံစွာ ဝင်ရောက်ရန်', 'Secure sign in') : t('ဖုန်းနံပါတ် အတည်ပြုရန်', 'Verify phone')}</p>
            <p className="mt-1 text-sm text-[#3e494a]">{step === 'phone' ? t('သင့်ဖုန်းသို့ SMS ကုဒ်တစ်ခု ပို့ပေးပါမည်။', 'We will send a verification code by SMS.') : t(`${verifiedPhoneRef.current} သို့ ပို့ထားသော ကုဒ် ၆ လုံးကို ထည့်ပါ။`, `Enter the 6-digit code sent to ${verifiedPhoneRef.current}.`)}</p>
          </div>
          {step === 'phone' ? (
            <form onSubmit={sendOtp} className="space-y-4">
              <label className="block"><span className="mb-2 block text-xs font-bold text-[#3e494a]">{t('အသုံးပြုသူအမည်', 'Username')}</span><input value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="name" required placeholder={t('သင့်အမည်', 'Your name')} className="h-13 w-full rounded-2xl border-2 border-[#bec8ca] px-4 font-bold outline-none focus:border-[#006d77]" /></label>
              <label className="block"><span className="mb-2 block text-xs font-bold text-[#3e494a]">{t('ဖုန်းနံပါတ်', 'Phone number')}</span><div className="flex h-13 overflow-hidden rounded-2xl border-2 border-[#bec8ca] focus-within:border-[#006d77]"><span className="flex items-center bg-[#f0f5f4] px-4 text-sm font-extrabold">+95</span><input value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} inputMode="tel" autoComplete="tel" required placeholder="09xxxxxxxxx" className="min-w-0 flex-1 px-4 font-bold outline-none" /></div></label>
              <button id="firebase-sign-in-button" disabled={isBusy || !username.trim() || !phoneNumber.trim()} className="flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-[#00535b] font-extrabold text-white shadow-lg transition hover:bg-[#006d77] disabled:cursor-not-allowed disabled:opacity-50">{isBusy ? t('SMS ပို့နေသည်…', 'Sending SMS…') : t('OTP ကုဒ်တောင်းမည်', 'Send OTP')}<ArrowRight size={20} aria-hidden="true" /></button>
            </form>
          ) : (
            <form onSubmit={verifyOtp} className="space-y-5">
              <label className="block"><span className="mb-2 block text-xs font-bold text-[#3e494a]">{t('OTP ကုဒ် ၆ လုံး', '6-digit OTP')}</span><input value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" required placeholder="••••••" className="h-16 w-full rounded-2xl border-2 border-[#006d77] px-4 text-center text-3xl font-black tracking-[.45em] outline-none" /></label>
              <button disabled={isBusy || otp.length !== 6} className="h-13 w-full rounded-2xl bg-[#00535b] font-extrabold text-white shadow-lg disabled:opacity-50">{isBusy ? t('အတည်ပြုနေသည်…', 'Verifying…') : t('အတည်ပြုပြီး ဝင်မည်', 'Verify and continue')}</button>
              <div className="flex items-center justify-between text-xs font-bold"><button type="button" onClick={() => { setStep('phone'); setOtp(''); setError(''); }} className="text-[#3e494a] hover:text-[#00535b]">{t('ဖုန်းနံပါတ် ပြင်မည်', 'Change number')}</button>{secondsRemaining > 0 ? <span className="text-[#6f797a]">{secondsRemaining}s</span> : <button id="firebase-resend-button" type="button" onClick={() => void sendOtp(undefined, 'firebase-resend-button')} disabled={isBusy} className="text-[#00535b]">{t('OTP ပြန်ပို့မည်', 'Resend OTP')}</button>}</div>
            </form>
          )}

          {error && <div role="alert" className="mt-4 rounded-2xl bg-[#ffdad6] px-4 py-3 text-sm font-bold text-[#93000a]">{error}</div>}
          <p className="mt-6 border-t border-gray-100 pt-4 text-center text-[11px] font-medium text-[#6f797a]">{t('SMS နှင့် ဒေတာနှုန်းထားများ ကောက်ခံနိုင်ပါသည်။', 'Standard SMS and data rates may apply.')}</p>
        </div>
      </section>
    </main>
  );
};
