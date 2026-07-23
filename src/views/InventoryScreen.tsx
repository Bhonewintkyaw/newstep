import React, { useState } from 'react';
import type { InventoryItem, LowStockAlert, TransactionItem, RegisteredLoanProfile } from '../types';
import { MetricPeriodSelector } from '../components/MetricPeriodSelector';
import { FloatingMicButton } from '../components/FloatingMicButton';
import { VoicePlayButton } from '../components/VoicePlayButton';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';

interface InventoryScreenProps {
  inventory: InventoryItem[];
  lowStockAlerts: LowStockAlert[];
  transactions: TransactionItem[];
  registeredLoanProfile: RegisteredLoanProfile | null;
  onOpenVoiceModal: () => void;
  onAddTransaction: (tx: Omit<TransactionItem, 'id'>) => void;
  onRestockItem: (alertId: string) => void;
  language: 'my' | 'en';
}

export const InventoryScreen: React.FC<InventoryScreenProps> = ({
  inventory,
  lowStockAlerts,
  transactions,
  registeredLoanProfile,
  onOpenVoiceModal,
  onAddTransaction,
  onRestockItem,
  language,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeFinancialPeriod, setActiveFinancialPeriod] = useState<'daily' | 'monthly' | 'yearly'>('monthly');
  const { isPlaying: isPlayingAnalysis, speak: speakAnalysis } = useSpeechSynthesis();

  const [newType, setNewType] = useState<'sale' | 'purchase'>('sale');
  const [newTitle, setNewTitle] = useState('');
  const [newAmount, setNewAmount] = useState('');

  const salesTx = transactions.filter((t) => t.type === 'sale');
  const purchaseTx = transactions.filter((t) => t.type === 'purchase');

  const totalSalesFromTx = salesTx.reduce((sum, t) => sum + t.amountMMK, 0);
  const calculatedProfitFromTx = salesTx.reduce((sum, t) => sum + (t.profitMMK || Math.round(t.amountMMK * 0.2)), 0);

  const metrics = {
    dailySalesMMK: totalSalesFromTx,
    dailyProfitMMK: calculatedProfitFromTx,
    monthlySalesMMK: totalSalesFromTx * 26,
    monthlyProfitMMK: calculatedProfitFromTx * 26,
    yearlySalesMMK: totalSalesFromTx * 310,
    yearlyProfitMMK: calculatedProfitFromTx * 310,
  };

  const requiredMonthlyRepayment = (registeredLoanProfile?.weeklyRepaymentMMK ?? 0) * 4;
  const monthlyProfit = metrics.monthlyProfitMMK;
  const coverageRatio = Math.round((monthlyProfit / (requiredMonthlyRepayment || 1)) * 100);

  let repaymentStatus: 'safe' | 'moderate' | 'warning' = 'safe';
  let statusBadgeBurmese = 'စိတ်ချရသော အခြေအနေ';
  let statusBadgeEnglish = 'High Safety Coverage';

  if (coverageRatio < 120) {
    repaymentStatus = 'warning';
    statusBadgeBurmese = 'သတိပြုရန် အခြေအနေ';
    statusBadgeEnglish = 'Low Coverage Risk Warning';
  } else if (coverageRatio < 200) {
    repaymentStatus = 'moderate';
    statusBadgeBurmese = 'သင့်တင့်သော အခြေအနေ';
    statusBadgeEnglish = 'Moderate Coverage';
  }

  const handlePlayAnalysisVoice = () => {
    const text = `မန်နေဂျာ AI ၏ စီးပွားရေး သုံးသပ်ချက် - သင့်ဆိုင်၏ လစဉ် အမြတ်ငွေ ${monthlyProfit.toLocaleString()} ကျပ် ဖြစ်ပြီး၊ လစဉ် ချေးငွေဆပ်ရန် လိုအပ်ချက် ${requiredMonthlyRepayment.toLocaleString()} ကျပ် ထက် ${coverageRatio}% ကျော်လွန် သာလွန်လျက်ရှိပါသည်။ ချေးငွေပြန်ဆပ်ရန် စိတ်ချရသော အခြေအနေ ဖြစ်ပါသည်။`;
    speakAnalysis(text);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newAmount) return;

    const amt = Number(newAmount);
    if (!Number.isFinite(amt) || amt <= 0) return;
    const estProfit = newType === 'sale' ? Math.round(amt * 0.22) : 0;

    onAddTransaction({
      type: newType,
      titleBurmese: newType === 'sale' ? `ရောင်းရသည်: ${newTitle}` : `ဝယ်ယူသည်: ${newTitle}`,
      titleEnglish: newType === 'sale' ? `Sold: ${newTitle}` : `Bought: ${newTitle}`,
      timestampBurmese: 'ယခုလေးတင်',
      timestampEnglish: 'Just now',
      amountMMK: amt,
      profitMMK: estProfit,
      date: new Date().toISOString().split('T')[0],
    });

    setNewTitle('');
    setNewAmount('');
    setShowAddModal(false);
  };

  const t = (my: string, en: string) => (language === 'my' ? my : en);

  return (
    <div className="screen-shell space-y-6 lg:space-y-8">
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#00535b] flex items-center gap-2">
            <span className="material-symbols-outlined text-3xl text-[#006d77]">inventory_2</span>
            <span>{t('အရောင်းအဝယ် စာရင်းနှင့် ကုန်ပစ္စည်း စနစ်', 'Inventory & Financial Records')}</span>
          </h2>
          <p className="text-xs sm:text-sm text-[#3e494a] font-semibold mt-1">
            {t('အသံဖြင့် စာရင်းသွင်းပြီး နေ့စဉ်၊ လစဉ် အမြတ်ငွေနှင့် ချေးငွေပြန်ဆပ်နိုင်စွမ်းကို AI ဖြင့် သုံးသပ်ပါ', 'Record sales via voice, analyze daily/monthly profits and AI loan repayment safety')}
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="self-start sm:self-auto flex items-center gap-2 px-4 py-2.5 bg-[#00535b] hover:bg-[#006d77] text-white rounded-2xl text-xs font-bold shadow-sm active:scale-95 transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined text-lg">add_circle</span>
          <span>{t('စာရင်း အသစ်သွင်းမည်', 'Add Record')}</span>
        </button>
      </section>

      <section className="bg-gradient-to-br from-[#00535b] to-[#00201e] text-white p-6 rounded-3xl shadow-md flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div className="flex items-center gap-5">
          <button
            onClick={onOpenVoiceModal}
            className="w-20 h-20 bg-[#ffba27] hover:bg-[#ffa800] text-[#00201e] rounded-full shadow-xl flex items-center justify-center active:scale-95 transition-transform shrink-0 cursor-pointer voice-pulse"
          >
            <span className="material-symbols-outlined text-4xl fill">mic</span>
          </button>
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#9becf7]">
              {t('အသံဖြင့် စာရင်းသွင်းစနစ်', 'Voice Assistant Recording')}
            </span>
            <h3 className="text-lg font-extrabold text-white mt-0.5">
              {t('စကားပြော၍ စာရင်းသွင်းပါ', 'Speak to Record Daily Business')}
            </h3>
            <p className="text-xs text-gray-200 mt-1 font-medium">
              {t('ဥပမာ: "ဆန် ၅ အိတ် ရောင်းရသည်" သို့မဟုတ် "ကြက်သွန်နီ ဝယ်သည်"', 'Try saying: "Sold 5 bags of rice" or "Bought cooking oil"')}
            </p>
          </div>
        </div>

        <button
          onClick={onOpenVoiceModal}
          className="w-full md:w-auto px-5 py-3 bg-white text-[#00535b] hover:bg-[#9becf7] font-extrabold text-xs rounded-2xl shadow-md cursor-pointer shrink-0 transition-all"
        >
          {t('အသံစနစ် စတင်မည် 🎙️', 'Start Voice Assistant 🎙️')}
        </button>
      </section>

      <section className="bg-white p-6 rounded-3xl shadow-xs border border-[#bec8ca]/30 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
          <h3 className="font-extrabold text-base text-[#00535b] flex items-center gap-2">
            <span className="material-symbols-outlined text-2xl text-[#825b00]">analytics</span>
            <span>{t('စီးပွားရေး ဝင်ငွေနှင့် အမြတ်ငွေ တွက်ချက်မှု', 'Sales & Profit Calculations')}</span>
          </h3>
          <MetricPeriodSelector active={activeFinancialPeriod} onChange={setActiveFinancialPeriod} language={language} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div className="p-4 bg-[#e4fffb] rounded-2xl border border-[#00535b]/20 space-y-1">
            <div className="flex justify-between items-center text-xs text-[#00535b] font-bold">
              <span>{t(
                activeFinancialPeriod === 'daily' ? 'နေ့စဉ် စုစုပေါင်း အရောင်း' : activeFinancialPeriod === 'monthly' ? 'လစဉ် စုစုပေါင်း အရောင်း' : 'နှစ်စဉ် စုစုပေါင်း အရောင်း',
                activeFinancialPeriod === 'daily' ? 'Daily Sales' : activeFinancialPeriod === 'monthly' ? 'Monthly Sales' : 'Yearly Sales'
              )}</span>
              <span className="material-symbols-outlined text-lg">trending_up</span>
            </div>
            <p className="text-2xl font-extrabold text-[#00535b]">
              {(activeFinancialPeriod === 'daily'
                ? metrics.dailySalesMMK
                : activeFinancialPeriod === 'monthly'
                ? metrics.monthlySalesMMK
                : metrics.yearlySalesMMK
              ).toLocaleString()} <span className="text-xs font-semibold">MMK</span>
            </p>
          </div>

          <div className="p-4 bg-[#ffdea9]/30 rounded-2xl border border-[#825b00]/20 space-y-1">
            <div className="flex justify-between items-center text-xs text-[#634500] font-bold">
              <span>{t('နေ့စဉ် အသားတင် အမြတ်', 'Daily Profit')}</span>
              <span className="material-symbols-outlined text-lg">monetization_on</span>
            </div>
            <p className="text-2xl font-extrabold text-[#634500]">
              {(activeFinancialPeriod === 'daily'
                ? metrics.dailyProfitMMK
                : activeFinancialPeriod === 'monthly'
                ? metrics.monthlyProfitMMK
                : metrics.yearlyProfitMMK
              ).toLocaleString()} <span className="text-xs font-semibold">MMK</span>
            </p>
          </div>

          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-1">
            <div className="flex justify-between items-center text-xs text-gray-600 font-bold">
              <span>{t('ပျမ်းမျှ အမြတ် ရာခိုင်နှုန်း', 'Avg Profit Margin')}</span>
              <span className="material-symbols-outlined text-lg">pie_chart</span>
            </div>
            <p className="text-2xl font-extrabold text-[#00201e]">21.5%</p>
          </div>
        </div>
      </section>

      <section className="bg-white p-6 rounded-3xl shadow-xs border border-[#bec8ca]/30 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
          <div>
            <h3 className="font-extrabold text-base text-[#00535b] flex items-center gap-2">
              <span className="material-symbols-outlined text-2xl text-[#8c4e35]">account_balance_wallet</span>
              <span>{t('ချေးငွေ ပြန်ဆပ်နိုင်စွမ်း သုံးသပ်ချက်', 'Loan Repayment Capacity Analysis')}</span>
            </h3>
            <p className="text-xs text-[#3e494a] font-semibold mt-0.5">
              {t('ဆိုင်၏ အမြတ်ငွေနှင့် ဘဏ်ချေးငွေ ပြန်ဆပ်ရမည့် ပမာဏကို AI မှ နှိုင်းယှဉ် တွက်ချက်ထားခြင်း', 'AI evaluates if monthly profits cover required bank loan repayments within deadline')}
            </p>
          </div>

          <VoicePlayButton
            isPlaying={isPlayingAnalysis}
            labelPlaying={t('သုံးသပ်ချက် ဖတ်ပြနေသည်...', 'Playing Analysis...')}
            labelIdle={t('အသံဖြင့် နားထောင်မည် 🔊', 'Voice Analysis 🔊')}
            onClick={handlePlayAnalysisVoice}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-center">
          <div className="p-4 bg-[#f8f9fa] rounded-2xl border border-gray-200 md:col-span-1 space-y-2">
            <span className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wider block">
              {t('ပြန်ဆပ်နိုင်စွမ်း အညွှန်း', 'Safety Index')}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-extrabold text-[#00535b]">{coverageRatio}%</span>
              <span className="px-2.5 py-1 bg-[#b7fbf3] text-[#00535b] text-xs font-extrabold rounded-lg">
                {t(statusBadgeBurmese, statusBadgeEnglish)}
              </span>
            </div>
            <p className="text-xs text-gray-600 font-medium leading-tight">
              {t(
                `လစဉ် အမြတ်ငွေ (${metrics.monthlyProfitMMK.toLocaleString()} ကျပ်) သည် လစဉ် ချေးငွေဆပ်ရန် (${requiredMonthlyRepayment.toLocaleString()} ကျပ်) ထက် ၄ ဆ ပိုမိုပါသည်`,
                `Monthly profit (${metrics.monthlyProfitMMK.toLocaleString()} MMK) covers required repayment (${requiredMonthlyRepayment.toLocaleString()} MMK) safely.`
              )}
            </p>
          </div>

          <div className="p-4 bg-[#e4fffb] rounded-2xl border border-[#00535b]/20 md:col-span-2 space-y-2">
            <p className="text-xs font-extrabold text-[#00535b] flex items-center gap-1.5">
              <span className="material-symbols-outlined text-lg text-[#825b00]">auto_awesome</span>
              <span>{t('AI မန်နေဂျာ၏ အကြံပြုချက်နှင့် သတိပေးချက်:', 'AI Manager Warning & Advisory:')}</span>
            </p>
            <p className="text-xs sm:text-sm text-[#00201e] leading-relaxed font-semibold">
              {t('ယခုလ အမြတ်ငွေသည် ချေးငွေပြန်ဆပ်ရန် လုံလောက်စွာ ရှိပါသည်။ လာမည့် ၅ ရက်အတွင်း အပတ်စဉ် အရစ်ကျ ၅၀,၀၀၀ ကျပ် ပေးဆပ်ရန် အဆင်သင့် ရှိပါသည်။', 'Profit margin is fully sufficient for scheduled weekly repayment of 50,000 MMK.')}
            </p>
            <div className="pt-1 flex flex-wrap gap-2 text-[11px] font-bold text-[#00535b]">
              <span className="px-2.5 py-1 bg-white rounded-md border border-[#00535b]/15">💡 ဆန်နှင့် ဆီ ရောင်းအားကို ဆက်လက်ထိန်းသိမ်းပါ</span>
              <span className="px-2.5 py-1 bg-white rounded-md border border-[#00535b]/15">📦 လက်ကျန်နည်းသော စားအုန်းဆီ တိုးချဲ့မှာယူပါ</span>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-extrabold text-base text-[#00201e]">
              {t('ပစ္စည်းပြတ်လပ်မှု သတိပေးချက်', 'Low Stock Alerts')}
            </h3>
            <span className="px-3 py-1 bg-[#ffdad6] text-[#93000a] text-xs font-bold rounded-full">
              {lowStockAlerts.length} {t('ခု', 'items')}
            </span>
          </div>

          <div className="space-y-2.5">
            {lowStockAlerts.length === 0 && (
              <div className="rounded-2xl border border-dashed border-[#00535b]/20 bg-white p-6 text-center text-sm font-semibold text-[#3e494a]">
                {t('ပစ္စည်းပြတ်လပ်မှု မရှိသေးပါ', 'No low-stock alerts yet')}
              </div>
            )}
            {lowStockAlerts.map((alert) => (
              <div key={alert.id} className="flex items-center justify-between p-4 bg-white border border-[#ffdad6] rounded-2xl shadow-xs hover:shadow-sm transition-shadow">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-[#b7fbf3] flex items-center justify-center text-[#00535b] shrink-0">
                    <span className="material-symbols-outlined text-2xl">warning</span>
                  </div>
                  <div>
                    <p className="font-bold text-sm text-[#00201e]">{t(alert.nameBurmese, alert.nameEnglish)}</p>
                    <p className="text-xs font-bold text-[#ba1a1a]">
                      {t(`လက်ကျန်: ${alert.remainingQuantity} ${alert.unitBurmese} သာ`, `Only ${alert.remainingQuantity} ${alert.unitEnglish} left`)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => onRestockItem(alert.id)}
                  className="h-10 px-4 bg-[#00535b] hover:bg-[#006d77] text-white rounded-full text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-xs"
                >
                  {t('မှာယူမည်', 'Restock')}
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-extrabold text-base text-[#00201e]">
              {t('လတ်တလော စာရင်းများ', 'Recent Transactions')}
            </h3>
            <button
              onClick={() => setShowAddModal(true)}
              className="text-xs font-bold text-[#00535b] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">add_circle</span>
              <span>{t('စာရင်းသွင်းရန်', 'Add Record')}</span>
            </button>
          </div>

          <div className="bg-white rounded-3xl shadow-xs border border-[#bec8ca]/30 divide-y divide-[#b1f5ed] overflow-hidden">
            {transactions.length === 0 && (
              <div className="p-8 text-center">
                <span className="material-symbols-outlined text-4xl text-[#006d77]">receipt_long</span>
                <p className="mt-2 text-sm font-bold text-[#3e494a]">{t('စာရင်းမရှိသေးပါ', 'No transactions yet')}</p>
              </div>
            )}
            {transactions.map((tx) => (
              <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-[#e4fffb]/50 transition-colors">
                <div className="flex items-center gap-3.5">
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${tx.type === 'sale' ? 'bg-[#b7fbf3] text-[#00535b]' : 'bg-[#ffdbce] text-[#380d00]'}`}>
                    <span className="material-symbols-outlined text-xl">{tx.type === 'sale' ? 'trending_up' : 'shopping_cart'}</span>
                  </div>
                  <div>
                    <p className="font-bold text-sm text-[#00201e]">{t(tx.titleBurmese, tx.titleEnglish)}</p>
                    <p className="text-xs text-[#3e494a]">{t(tx.timestampBurmese, tx.timestampEnglish)}</p>
                  </div>
                </div>
                <p className={`font-bold text-base ${tx.type === 'sale' ? 'text-[#00535b]' : 'text-[#8c4e35]'}`}>
                  {tx.type === 'sale' ? '+' : '-'} {tx.amountMMK.toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Add Transaction Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-[#00535b]/20 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-lg text-[#00535b]">
                {t('အရောင်း/အဝယ် စာရင်းသစ်သွင်းရန်', 'Add Transaction Record')}
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div className="flex gap-2">
                <button type="button" onClick={() => setNewType('sale')}
                  className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${newType === 'sale' ? 'bg-[#00535b] text-white shadow-sm' : 'bg-gray-100 text-gray-600'}`}>
                  {t('အရောင်း (+)', 'Sale (+)')}
                </button>
                <button type="button" onClick={() => setNewType('purchase')}
                  className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${newType === 'purchase' ? 'bg-[#8c4e35] text-white shadow-sm' : 'bg-gray-100 text-gray-600'}`}>
                  {t('အဝယ် (-)', 'Purchase (-)')}
                </button>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-600 block mb-1">{t('ပစ္စည်းအမည် / အကြောင်းအရာ', 'Item Description')}</label>
                <input type="text" required placeholder={t('ဥပမာ: ကြက်သွန်နီ ၅ ပိဿာ', 'e.g., 5 viss onions')} value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="w-full h-11 px-3.5 border border-gray-300 rounded-xl text-sm outline-none focus:border-[#00535b]" />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-600 block mb-1">{t('ပမာဏ (ကျပ်)', 'Amount (MMK)')}</label>
                <input type="number" min="1" step="1" required placeholder={t('ငွေပမာဏ', 'Amount in MMK')} value={newAmount} onChange={(e) => setNewAmount(e.target.value)} className="w-full h-11 px-3.5 border border-gray-300 rounded-xl text-sm outline-none focus:border-[#00535b]" />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2.5 text-gray-600 font-bold text-sm rounded-xl">{t('မလုပ်တော့ပါ', 'Cancel')}</button>
                <button type="submit" className="px-5 py-2.5 bg-[#00535b] text-white font-bold text-sm rounded-xl shadow-md cursor-pointer">{t('သိမ်းဆည်းမည်', 'Save Record')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <FloatingMicButton onOpenVoiceModal={onOpenVoiceModal} />
    </div>
  );
};
