import React, { useState } from 'react';
import type { FinancialInstitution, RegisteredLoanProfile, UserProfile } from '../types';
import { FloatingMicButton } from '../components/FloatingMicButton';
import { VoicePlayButton } from '../components/VoicePlayButton';
import { Modal } from '../components/Modal';
import { MapView } from '../components/MapView';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';

interface LoansScreenProps {
  financialInstitutions: FinancialInstitution[];
  registeredLoanProfile: RegisteredLoanProfile;
  userProfile: UserProfile;
  onOpenVoiceModal: () => void;
  onUpdateRegisteredLoan: (updatedProfile: RegisteredLoanProfile) => void;
  onAddCreditPoints: (pointsToAdd: number) => void;
  language: 'my' | 'en';
}

const filterTabs: { id: string; icon: string; labelMy: string; labelEn: string }[] = [
  { id: 'all', icon: '', labelMy: 'အားလုံး', labelEn: 'All' },
  { id: 'bank', icon: '🏦', labelMy: 'ဘဏ်များ (Banks)', labelEn: 'Banks' },
  { id: 'microfinance', icon: '💵', labelMy: 'အသေးစား ငွေရေးကြေးရေး (Microfinance)', labelEn: 'Microfinance' },
  { id: 'ngo', icon: '🤝', labelMy: 'NGO အဖွဲ့အစည်းများ', labelEn: 'NGOs' },
  { id: 'financial_org', icon: '📱', labelMy: 'ဒစ်ဂျစ်တယ် ငွေရေးကြေးရေး', labelEn: 'Financial Orgs' },
];

function getStarLevelInfo(pts: number) {
  if (pts >= 1201) return { level: 5, labelBurmese: '⭐⭐⭐⭐⭐ Premium Client', labelEnglish: '⭐⭐⭐⭐⭐ Premium Client', color: '#ffba27' };
  if (pts >= 801) return { level: 4, labelBurmese: '⭐⭐⭐⭐ Excellent Client', labelEnglish: '⭐⭐⭐⭐ Excellent Client', color: '#ffba27' };
  if (pts >= 501) return { level: 3, labelBurmese: '⭐⭐⭐ Reliable Client', labelEnglish: '⭐⭐⭐ Reliable Client', color: '#00535b' };
  if (pts >= 201) return { level: 2, labelBurmese: '⭐⭐ Trusted Client', labelEnglish: '⭐⭐ Trusted Client', color: '#006d77' };
  return { level: 1, labelBurmese: '⭐ New Client', labelEnglish: '⭐ New Client', color: '#8c4e35' };
}

export const LoansScreen: React.FC<LoansScreenProps> = ({
  financialInstitutions,
  registeredLoanProfile,
  userProfile,
  onOpenVoiceModal,
  onUpdateRegisteredLoan,
  onAddCreditPoints,
  language,
}) => {
  const [activeTab, setActiveTab] = useState('all');
  const [activeListeningId, setActiveListeningId] = useState<string | null>(null);
  const [selectedMapPin, setSelectedMapPin] = useState<FinancialInstitution | null>(null);
  const [comparedIds, setComparedIds] = useState<string[]>([]);
  const [showComparison, setShowComparison] = useState(false);
  const [selectedInstForReg, setSelectedInstForReg] = useState<FinancialInstitution | null>(null);
  const [regPurpose, setRegPurpose] = useState('');
  const [regAmount, setRegAmount] = useState('');
  const [regNRC, setRegNRC] = useState('');
  const [showRepayModal, setShowRepayModal] = useState(false);
  const [repayInput, setRepayInput] = useState('');
  const { isPlaying, speak } = useSpeechSynthesis();

  const filteredInstitutions = activeTab === 'all'
    ? financialInstitutions
    : financialInstitutions.filter((inst) => inst.type === activeTab);

  const handleListenAudio = (inst: FinancialInstitution) => {
    setActiveListeningId(inst.id);
    speak(language === 'my' ? inst.audioTextBurmese : inst.descriptionEnglish);
  };

  const handlePlayVoiceReminder = () => {
    speak(`သတိပေးချက် - ${registeredLoanProfile.organizationName} သို့ လာမည့် ၅ ရက်အတွင်း ${registeredLoanProfile.weeklyRepaymentMMK.toLocaleString()} ကျပ် ပေးဆပ်ရန် လိုအပ်ပါသည်။ အချိန်မှန် ပေးဆပ်ပါက ခရီးဒစ် ရမှတ် ၅၀ တိုးမြှင့်ရရှိပါမည်။`);
  };

  const toggleCompare = (id: string) => {
    if (comparedIds.includes(id)) {
      setComparedIds(comparedIds.filter((item) => item !== id));
    } else if (comparedIds.length < 3) {
      setComparedIds([...comparedIds, id]);
    } else {
      alert(language === 'my' ? 'အများဆုံး ၃ ခုအထိသာ ယှဉ်ပြိုင်နိုင်ပါသည်။' : 'You can compare up to 3 organizations at a time.');
    }
  };

  const handleRegisterLoan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInstForReg) return;
    const amountNum = Number(regAmount) || 1000000;
    const totalRepay = amountNum + amountNum * 0.012 * 5;
    const weeklyRepay = Math.round(totalRepay / 20);

    onUpdateRegisteredLoan({
      id: `loan-${Date.now()}`,
      organizationName: selectedInstForReg.name,
      loanPurpose: regPurpose || 'ကုန်ပစ္စည်း တိုးချဲ့ဝယ်ယူရေး',
      loanAmountMMK: amountNum,
      nrcNumber: regNRC || userProfile.nrcNumber,
      monthlyInterestRatePercent: 1.2,
      totalRepaymentAmountMMK: totalRepay,
      weeklyRepaymentMMK: weeklyRepay,
      totalWeeks: 20,
      paidWeeks: 0,
      nextDeadlineBurmese: '၇ ရက်အတွင်း (7 Days remaining)',
      nextDeadlineEnglish: 'In 7 days',
      daysRemaining: 7,
      status: 'Active',
    });
    setSelectedInstForReg(null);
    alert(language === 'my' ? `စာရင်းသွင်းမှု အောင်မြင်ပါသည်။` : `Registration complete!`);
  };

  const handleConfirmRepayment = () => {
    const payAmt = Number(repayInput) || registeredLoanProfile.weeklyRepaymentMMK;
    const newPaidWeeks = Math.min(registeredLoanProfile.totalWeeks, registeredLoanProfile.paidWeeks + 1);
    onUpdateRegisteredLoan({
      ...registeredLoanProfile,
      paidWeeks: newPaidWeeks,
      nextDeadlineBurmese: 'လာမည့် အပတ် (In 7 days)',
      nextDeadlineEnglish: 'Next week',
      daysRemaining: 7,
    });
    onAddCreditPoints(50);
    setShowRepayModal(false);
    alert(language === 'my' ? `ကျေးဇူးတင်ပါသည်။ +၅၀ ခရီးဒစ် ရမှတ်! 🌟` : `Repayment confirmed! +50 Credit Points! 🌟`);
  };

  const starInfo = getStarLevelInfo(userProfile.creditPoints || 780);
  const t = (my: string, en: string) => (language === 'my' ? my : en);

  return (
    <div className="pt-20 lg:pt-24 pb-32 px-4 sm:px-6 lg:px-8 max-w-2xl md:max-w-3xl lg:max-w-6xl mx-auto space-y-6 lg:space-y-8">
      <section className="space-y-1">
        <h2 className="text-xl sm:text-2xl font-extrabold text-[#00535b]">
          {t('ဘဏ်နှင့် ငွေရေးကြေးရေး ဝန်ဆောင်မှုများ', 'Finance & Loan Services')}
        </h2>
        <p className="text-xs sm:text-sm text-[#3e494a] font-semibold">
          {t('အနီးနားရှိ ဘဏ်၊ မိုက်ခရိုဖိုင်နန်း၊ NGO များရှာဖွေပြီး အသံဖြင့် နှိုင်းယှဉ် လျှောက်ထားပါ', 'Find nearby banks, microfinance institutions & NGOs, compare plans with voice guides')}
        </p>
      </section>

      {/* Credit System Banner */}
      <section className="bg-gradient-to-r from-[#00201e] via-[#00535b] to-[#006d77] text-white rounded-3xl p-6 shadow-md relative overflow-hidden space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-[#ffba27] flex items-center justify-center text-[#00201e] shadow-lg shrink-0">
              <span className="material-symbols-outlined text-3xl fill">workspace_premium</span>
            </div>
            <div>
              <p className="text-xs font-extrabold text-[#9becf7] uppercase tracking-wider">{t('ယုံကြည်စိတ်ချရမှု ခရီးဒစ် စနစ် (Credit System)', 'Client Trust Rating')}</p>
              <h3 className="text-lg font-extrabold text-white">{t(starInfo.labelBurmese, starInfo.labelEnglish)}</h3>
              <p className="text-xs text-gray-200 mt-0.5">{t(`ခရီးဒစ် ရမှတ်: ${userProfile.creditPoints || 780} မှတ်`, `Credit Points: ${userProfile.creditPoints || 780} pts`)}</p>
            </div>
          </div>
          <div className="bg-white/15 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/20 text-center shrink-0">
            <p className="text-[10px] font-bold text-[#9becf7] uppercase">{t('နောက်တစ်ဆင့် ခရီးဒစ်', 'Next Tier')}</p>
            <p className="text-sm font-extrabold text-[#ffba27] mt-0.5">800 pts (⭐4 Level)</p>
          </div>
        </div>

        <div className="space-y-1 pt-1">
          <div className="w-full bg-white/20 h-2.5 rounded-full overflow-hidden">
            <div className="bg-[#ffba27] h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(100, ((userProfile.creditPoints || 780) / 1200) * 100)}%` }} />
          </div>
          <p className="text-[10px] font-semibold text-[#9becf7] text-right">
            {t('အချိန်မှန် ချေးငွေပြန်ဆပ်ပါက ခရီးဒစ် ရမှတ်များ တိုးတက်ရရှိပါမည်။', 'Earn Credit Points for every on-time repayment to unlock lower interest rates.')}
          </p>
        </div>
      </section>

      {/* Active Loan */}
      <section className="bg-white p-6 rounded-3xl shadow-xs border border-[#bec8ca]/30 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
          <div>
            <span className="text-xs font-bold text-[#8c4e35] bg-[#ffad8f]/30 px-3 py-1 rounded-full uppercase tracking-wider">
              {t('လက်ရှိ အတည်ပြုထားသော ချေးငွေ', 'Active Registered Loan')}
            </span>
            <h3 className="font-extrabold text-lg text-[#00535b] mt-1.5">{registeredLoanProfile.organizationName}</h3>
            <p className="text-xs text-[#3e494a] font-semibold">{t(`ရည်ရွယ်ချက်: ${registeredLoanProfile.loanPurpose}`, `Purpose: ${registeredLoanProfile.loanPurpose}`)}</p>
          </div>
          <VoicePlayButton isPlaying={isPlaying} labelPlaying={t('သတိပေးချက် ဖတ်ပြနေသည်...', 'Playing Reminder...')} labelIdle={t('အသံဖြင့် သတိပေးချက် နားထောင်မည် 🔊', 'Voice Due Reminder 🔊')} onClick={handlePlayVoiceReminder} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          <div className="p-3.5 bg-[#f8f9fa] rounded-2xl border border-gray-200">
            <p className="text-[11px] font-bold text-gray-500">{t('စုစုပေါင်း ချေးငွေ ပမာဏ', 'Total Approved Loan')}</p>
            <p className="text-base font-extrabold text-[#00535b] mt-0.5">{registeredLoanProfile.loanAmountMMK.toLocaleString()} MMK</p>
            <p className="text-[10px] text-gray-400 font-semibold mt-0.5">NRC: {registeredLoanProfile.nrcNumber}</p>
          </div>
          <div className="p-3.5 bg-[#f8f9fa] rounded-2xl border border-gray-200">
            <p className="text-[11px] font-bold text-gray-500">{t('အပတ်စဉ် ပြန်ဆပ်ရန်', 'Weekly Installment')}</p>
            <p className="text-base font-extrabold text-[#8c4e35] mt-0.5">{registeredLoanProfile.weeklyRepaymentMMK.toLocaleString()} MMK</p>
            <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">{t(`နောက်ဆုံးရက်: ${registeredLoanProfile.nextDeadlineBurmese}`, `Next Deadline: ${registeredLoanProfile.nextDeadlineEnglish}`)}</p>
          </div>
          <div className="p-3.5 bg-[#f8f9fa] rounded-2xl border border-gray-200 flex flex-col justify-between">
            <div>
              <p className="text-[11px] font-bold text-gray-500">{t('ပြန်ဆပ်ပြီး အပတ် အရေအတွက်', 'Repayment Schedule')}</p>
              <p className="text-sm font-extrabold text-[#00201e] mt-0.5">{registeredLoanProfile.paidWeeks} / {registeredLoanProfile.totalWeeks} {t('အပတ်', 'Weeks')}</p>
            </div>
            <button onClick={() => { setRepayInput(registeredLoanProfile.weeklyRepaymentMMK.toString()); setShowRepayModal(true); }} className="w-full py-2 bg-[#00535b] hover:bg-[#006d77] text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs mt-2">
              {t('အရစ်ကျ ပြန်ဆပ်မည်', 'Pay Installment')}
            </button>
          </div>
        </div>
      </section>

      {/* Map & Filters */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="font-extrabold text-base text-[#00535b]">{t('အနီးရှိ ငွေရေးကြေးရေး အဖွဲ့အစည်းများ', 'Nearby Financial Organizations')}</h3>
          {comparedIds.length > 0 && (
            <button onClick={() => setShowComparison(true)} className="flex items-center gap-2 px-4 py-2 bg-[#825b00] text-white rounded-2xl text-xs font-extrabold shadow-md active:scale-95 transition-all cursor-pointer">
              <span className="material-symbols-outlined text-base">compare_arrows</span>
              <span>{t(`ဝန်ဆောင်မှု (${comparedIds.length}) ခု ယှဉ်ပြိုင်ကြည့်မည်`, `Compare (${comparedIds.length}) Organizations`)}</span>
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {filterTabs.map(({ id, icon, labelMy, labelEn }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`px-4 py-2 rounded-2xl text-xs font-extrabold transition-all cursor-pointer ${activeTab === id ? 'bg-[#00535b] text-white shadow-xs' : 'bg-white text-[#3e494a] hover:bg-gray-100 border border-gray-200'}`}>
              {icon} {t(labelMy, labelEn)}
            </button>
          ))}
        </div>

        {/* Map */}
        <div className="relative h-64 md:h-72 rounded-3xl overflow-hidden shadow-xs border border-[#00535b]/15">
          <MapView
            markers={filteredInstitutions.map((inst) => ({
              id: inst.id,
              name: inst.name,
              lat: inst.coords.lat,
              lng: inst.coords.lng,
              iconName: inst.iconName,
              containerBgClass: inst.containerBgClass,
            }))}
            center={{ lat: 16.8661, lng: 96.1951 }}
            zoom={12}
            onMarkerClick={(id) => {
              const found = financialInstitutions.find((i) => i.id === id);
              if (found) setSelectedMapPin(found);
            }}
          />
        </div>

        {selectedMapPin && (
          <div className="p-5 bg-[#e4fffb] border border-[#00535b]/30 rounded-3xl shadow-md space-y-3 animate-in fade-in">
            <div className="flex justify-between items-center border-b border-[#00535b]/10 pb-2">
              <div>
                <h4 className="font-extrabold text-base text-[#00535b]">{selectedMapPin.name}</h4>
                <p className="text-xs font-bold text-[#8c4e35]">{t(selectedMapPin.typeLabelBurmese, selectedMapPin.typeLabelEnglish)}</p>
              </div>
              <button onClick={() => setSelectedMapPin(null)} className="text-gray-400 hover:text-gray-600"><span className="material-symbols-outlined text-base">close</span></button>
            </div>
            <p className="text-xs sm:text-sm text-[#00201e]">{t(selectedMapPin.descriptionBurmese, selectedMapPin.descriptionEnglish)}</p>
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs font-extrabold text-[#00535b]">{t(selectedMapPin.amountRangeBurmese, selectedMapPin.amountRangeEnglish)}</span>
              <div className="flex gap-2">
                <button onClick={() => handleListenAudio(selectedMapPin)} className="text-xs font-bold text-[#00535b] bg-white px-3 py-1.5 rounded-full border border-[#00535b]/20 cursor-pointer hover:bg-[#b7fbf3]">{t('အသံဖြင့် နားထောင်မည် 🔊', 'Listen 🔊')}</button>
                <button onClick={() => setSelectedInstForReg(selectedMapPin)} className="text-xs font-bold text-white bg-[#00535b] px-3.5 py-1.5 rounded-full cursor-pointer hover:bg-[#006d77]">{t('စာရင်းသွင်းမည်', 'Apply Now')}</button>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Institution Cards */}
      <section className="space-y-4">
        <h3 className="font-extrabold text-base text-[#00535b]">{t('ရွေးချယ်နိုင်သော အဖွဲ့အစည်း အသေးစိတ်', 'Available Organizations & Comparison')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredInstitutions.map((inst) => {
            const isCompared = comparedIds.includes(inst.id);
            const isListening = activeListeningId === inst.id;
            return (
              <div key={inst.id} className="bg-white p-5 rounded-3xl shadow-xs border border-[#bec8ca]/30 flex flex-col justify-between hover:shadow-md transition-all space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${inst.containerBgClass}`}>
                        <span className="material-symbols-outlined text-2xl">{inst.iconName}</span>
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm text-[#00201e]">{inst.name}</h4>
                        <p className="text-[11px] font-bold text-[#8c4e35]">{t(inst.typeLabelBurmese, inst.typeLabelEnglish)}</p>
                      </div>
                    </div>
                    <button onClick={() => toggleCompare(inst.id)}
                      className={`px-3 py-1 rounded-full text-[11px] font-extrabold border transition-all cursor-pointer shrink-0 ${isCompared ? 'bg-[#825b00] text-white border-[#825b00]' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}>
                      {isCompared ? t('✓ ယှဉ်ပြိုင်မည်', '✓ Selected') : t('+ နှိုင်းယှဉ်မည်', '+ Compare')}
                    </button>
                  </div>

                  <p className="text-xs text-[#3e494a] leading-relaxed">{t(inst.descriptionBurmese, inst.descriptionEnglish)}</p>

                  <div className="p-3 bg-[#f8f9fa] rounded-2xl space-y-1.5 border border-gray-100 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-500 font-semibold">{t('ချေးငွေ ပမာဏ:', 'Loan Amount:')}</span>
                      <span className="font-bold text-[#00535b]">{t(inst.amountRangeBurmese, inst.amountRangeEnglish)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 font-semibold">{t('အတိုးနှုန်း:', 'Interest Rate:')}</span>
                      <span className="font-bold text-[#8c4e35]">{t(inst.interestRateBurmese, inst.interestRateEnglish)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-100 gap-2">
                  <button onClick={() => handleListenAudio(inst)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${isListening ? 'bg-[#ffba27] text-[#00201e] scale-105' : 'bg-gray-100 text-[#00535b] hover:bg-gray-200'}`}>
                    <span className="material-symbols-outlined text-base">{isListening ? 'graphic_eq' : 'volume_up'}</span>
                    <span>{isListening ? 'Playing' : 'Listen'}</span>
                  </button>
                  <button onClick={() => { setRegPurpose(''); setRegAmount(''); setRegNRC(userProfile.nrcNumber); setSelectedInstForReg(inst); }}
                    className="flex-1 py-2 bg-[#00535b] hover:bg-[#006d77] text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer text-center">
                    {t('လျှောက်ထား / စာရင်းသွင်းမည်', 'Apply & Register')}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Comparison Modal */}
      <Modal isOpen={showComparison} onClose={() => setShowComparison(false)}
        title={t('ချေးငွေနှင့် စုငွေ ဝန်ဆောင်မှု ယှဉ်ပြိုင်မှု', 'Loan & Savings Comparison')} maxWidth="max-w-2xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {financialInstitutions.filter((i) => comparedIds.includes(i.id)).map((inst) => (
            <div key={inst.id} className="p-4 bg-[#f8f9fa] rounded-2xl border border-gray-200 space-y-3">
              <h4 className="font-extrabold text-sm text-[#00201e]">{inst.name}</h4>
              <span className="inline-block text-[10px] font-bold text-white bg-[#00535b] px-2 py-0.5 rounded-md">{t(inst.typeLabelBurmese, inst.typeLabelEnglish)}</span>
              <div className="space-y-2 text-xs">
                <div><p className="text-gray-500 font-semibold">{t('ချေးငွေ ပမာဏ:', 'Amount:')}</p><p className="font-bold text-[#00535b]">{t(inst.amountRangeBurmese, inst.amountRangeEnglish)}</p></div>
                <div><p className="text-gray-500 font-semibold">{t('အတိုးနှုန်း:', 'Interest Rate:')}</p><p className="font-bold text-[#8c4e35]">{t(inst.interestRateBurmese, inst.interestRateEnglish)}</p></div>
                <div><p className="text-gray-500 font-semibold">{t('ပြန်ဆပ်ရမည့် ကာလ:', 'Term:')}</p><p className="font-bold text-[#00201e]">{t(inst.repaymentTermBurmese, inst.repaymentTermEnglish)}</p></div>
              </div>
              <button onClick={() => { setShowComparison(false); setSelectedInstForReg(inst); }} className="w-full py-2 bg-[#00535b] text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer mt-2">
                {t('ဒီတစ်ခု ရွေးမည်', 'Select Plan')}
              </button>
            </div>
          ))}
        </div>
      </Modal>

      {/* Registration Modal */}
      <Modal isOpen={!!selectedInstForReg} onClose={() => setSelectedInstForReg(null)}
        title={t('ချေးငွေ စာရင်းသွင်း လျှောက်ထားခြင်း', 'Loan Application & Registration')} maxWidth="max-w-lg">
        {selectedInstForReg && (
          <form onSubmit={handleRegisterLoan} className="space-y-4">
            <p className="text-xs text-[#8c4e35] font-bold">{selectedInstForReg.name}</p>
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">{t('ချေးငွေ ရည်ရွယ်ချက် (Loan Purpose)', 'Loan Purpose')}</label>
              <input type="text" required value={regPurpose} onChange={(e) => setRegPurpose(e.target.value)} className="w-full h-11 px-3.5 border border-gray-300 rounded-xl text-sm font-semibold outline-none focus:border-[#00535b]" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">{t('လျှောက်ထားမည့် ပမာဏ (MMK)', 'Requested Amount (MMK)')}</label>
              <input type="number" required value={regAmount} onChange={(e) => setRegAmount(e.target.value)} className="w-full h-11 px-3.5 border border-gray-300 rounded-xl text-sm font-semibold outline-none focus:border-[#00535b]" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">{t('မှတ်ပုံတင် အမှတ် (NRC Number)', 'NRC Number')}</label>
              <input type="text" required value={regNRC} onChange={(e) => setRegNRC(e.target.value)} className="w-full h-11 px-3.5 border border-gray-300 rounded-xl text-sm font-semibold outline-none focus:border-[#00535b]" />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setSelectedInstForReg(null)} className="px-4 py-2.5 text-gray-600 font-bold text-sm rounded-xl">{t('မလုပ်တော့ပါ', 'Cancel')}</button>
              <button type="submit" className="px-5 py-2.5 bg-[#00535b] hover:bg-[#006d77] text-white font-bold text-sm rounded-xl shadow-md cursor-pointer">{t('စာရင်းသွင်း လျှောက်ထားမည်', 'Submit & Register')}</button>
            </div>
          </form>
        )}
      </Modal>

      {/* Repay Modal */}
      <Modal isOpen={showRepayModal} onClose={() => setShowRepayModal(false)}
        title={t('ချေးငွေ အပတ်စဉ် ပြန်ဆပ်ရန်', 'Pay Loan Installment')} maxWidth="max-w-md">
        <p className="text-xs text-[#3e494a]">
          {t(`ယခုအပတ် ပေးဆပ်ရမည့် ပမာဏမှာ ${registeredLoanProfile.weeklyRepaymentMMK.toLocaleString()} ကျပ် ဖြစ်ပါသည်။ +၅၀ ခရီးဒစ် ရမှတ်ရရှိပါမည်။`,
            `Weekly payment is ${registeredLoanProfile.weeklyRepaymentMMK.toLocaleString()} MMK. Earn +50 Credit Points on completion.`)}
        </p>
        <input type="number" value={repayInput} onChange={(e) => setRepayInput(e.target.value)} className="w-full h-11 px-3.5 border rounded-xl font-bold text-[#00535b]" />
        <button onClick={handleConfirmRepayment} className="w-full py-3 bg-[#00535b] hover:bg-[#006d77] text-white font-bold rounded-xl shadow-md cursor-pointer">
          {t('အတည်ပြု ပေးဆပ်မည် (Earn +50 pts)', 'Confirm Repayment (+50 pts)')}
        </button>
      </Modal>

      <FloatingMicButton onOpenVoiceModal={onOpenVoiceModal} />
    </div>
  );
};
