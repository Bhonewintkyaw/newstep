import React, { useState } from 'react';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { VoiceAssistantModal } from './components/VoiceAssistantModal';
import { Toast } from './components/Toast';

import { HomeScreen } from './views/HomeScreen';
import { OnboardingScreen } from './views/OnboardingScreen';
import { InventoryScreen } from './views/InventoryScreen';
import { LoansScreen } from './views/LoansScreen';
import { PredictionScreen } from './views/PredictionScreen';
import { ProfileScreen } from './views/ProfileScreen';

import {
  initialUserProfile,
  initialCurrentLoan,
  initialRegisteredLoanProfile,
  initialLowStockAlerts,
  initialInventory,
  initialTransactions,
  financialInstitutionsList,
  initialWeatherData as weatherDataYangon,
  marketRecommendationsList,
} from './data/mockData';

import type {
  TabType,
  VoiceProcessResult,
  TransactionItem,
  LowStockAlert,
  InventoryItem,
  RegisteredLoanProfile,
  UserProfile,
} from './types';

export default function App() {
  const [currentTab, setCurrentTab] = useState<TabType>('onboarding');
  const [language, setLanguage] = useState<'my' | 'en'>('my');
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);

  const [userProfile, setUserProfile] = useState(initialUserProfile);
  const [currentLoan] = useState(initialCurrentLoan);
  const [registeredLoanProfile, setRegisteredLoanProfile] = useState(initialRegisteredLoanProfile);
  const [inventory, setInventory] = useState(initialInventory);
  const [lowStockAlerts, setLowStockAlerts] = useState(initialLowStockAlerts);
  const [transactions, setTransactions] = useState(initialTransactions);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleApplyVoiceResult = (result: VoiceProcessResult) => {
    if (result.action === 'RECORD_SALE' || result.action === 'RECORD_PURCHASE') {
      const isSale = result.action === 'RECORD_SALE';
      const amount = result.amount || (isSale ? 150000 : 18000);
      const itemName = result.itemName || (isSale ? 'ဆန် ၅ အိတ် (Rice)' : 'စားအုန်းဆီ (Cooking Oil)');

      const newTx: TransactionItem = {
        id: `tx-${Date.now()}`,
        type: isSale ? 'sale' : 'purchase',
        titleBurmese: isSale ? `ရောင်းရသည်: ${itemName}` : `ဝယ်ယူသည်: ${itemName}`,
        titleEnglish: isSale ? `Sold: ${itemName}` : `Bought: ${itemName}`,
        timestampBurmese: 'ယခုလေးတင်',
        timestampEnglish: 'Just now',
        amountMMK: amount,
        profitMMK: isSale ? Math.round(amount * 0.2) : 0,
        date: new Date().toISOString().split('T')[0],
      };

      setTransactions((prev) => [newTx, ...prev]);

      triggerToast(
        language === 'my'
          ? `စာရင်းသစ် ထည့်သွင်းပြီးပါပြီ: ${newTx.titleBurmese}`
          : `Record added: ${newTx.titleEnglish}`
      );
    } else if (result.action === 'CHECK_LOAN') {
      setCurrentTab('loans');
    } else if (result.action === 'INVENTORY_INQUIRY') {
      setCurrentTab('inventory');
    }
  };

  const handleAddManualTransaction = (tx: Omit<TransactionItem, 'id'>) => {
    const newTx: TransactionItem = { ...tx, id: `tx-${Date.now()}` };
    setTransactions((prev) => [newTx, ...prev]);
    triggerToast(language === 'my' ? 'စာရင်း အသစ် သိမ်းဆည်းပြီးပါပြီ' : 'Transaction saved successfully');
  };

  const handleRestockItem = (alertId: string) => {
    setLowStockAlerts((prev) => prev.filter((a) => a.id !== alertId));
    triggerToast(
      language === 'my'
        ? 'မှာယူမှု အောင်မြင်ပါသည်။ လက်ကျန် ပမာဏ တိုးမြှင့်ပြီးပါပြီ။'
        : 'Restock order placed successfully!'
    );
  };

  const handleAddCreditPoints = (pointsToAdd: number) => {
    setUserProfile((prev) => ({ ...prev, creditPoints: (prev.creditPoints || 780) + pointsToAdd }));
  };

  const handleUpdateUserProfile = (updated: UserProfile) => {
    setUserProfile(updated);
    triggerToast(language === 'my' ? 'ပရိုဖိုင် အချက်အလက်များ သိမ်းဆည်းပြီးပါပြီ' : 'Profile updated successfully');
  };

  const handleResetData = () => {
    setTransactions(initialTransactions);
    setLowStockAlerts(initialLowStockAlerts);
    setInventory(initialInventory);
    setRegisteredLoanProfile(initialRegisteredLoanProfile);
    setUserProfile(initialUserProfile);
    setCurrentTab('onboarding');
    triggerToast(language === 'my' ? 'မူလ စာရင်းများသို့ ပြန်လည်ပြင်ဆင်ပြီးပါပြီ' : 'Demo data reset to default');
  };

  const toggleLanguage = () => setLanguage((l) => (l === 'my' ? 'en' : 'my'));

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-[#00201e] font-sans antialiased selection:bg-[#006d77] selection:text-[#9becf7]">
      {currentTab !== 'onboarding' && (
        <Header
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          onOpenVoiceModal={() => setIsVoiceModalOpen(true)}
          userProfile={userProfile}
          language={language}
          onToggleLanguage={toggleLanguage}
        />
      )}

      <main className={`w-full transition-[padding-left] duration-200 min-h-screen ${currentTab !== 'onboarding' ? 'lg:pl-64' : ''}`}>
        {currentTab === 'home' && (
          <HomeScreen
            userProfile={userProfile}
            onSelectTab={setCurrentTab}
            onOpenVoiceModal={() => setIsVoiceModalOpen(true)}
            language={language}
          />
        )}

        {currentTab === 'onboarding' && (
          <OnboardingScreen onComplete={() => setCurrentTab('home')} language={language} />
        )}

        {currentTab === 'loans' && (
          <LoansScreen
            financialInstitutions={financialInstitutionsList}
            registeredLoanProfile={registeredLoanProfile}
            userProfile={userProfile}
            onOpenVoiceModal={() => setIsVoiceModalOpen(true)}
            onUpdateRegisteredLoan={setRegisteredLoanProfile}
            onAddCreditPoints={handleAddCreditPoints}
            language={language}
          />
        )}

        {currentTab === 'prediction' && (
          <PredictionScreen
            weatherData={weatherDataYangon}
            marketRecommendations={marketRecommendationsList}
            onOpenVoiceModal={() => setIsVoiceModalOpen(true)}
            language={language}
          />
        )}

        {currentTab === 'inventory' && (
          <InventoryScreen
            inventory={inventory}
            lowStockAlerts={lowStockAlerts}
            transactions={transactions}
            registeredLoanProfile={registeredLoanProfile}
            onOpenVoiceModal={() => setIsVoiceModalOpen(true)}
            onAddTransaction={handleAddManualTransaction}
            onRestockItem={handleRestockItem}
            language={language}
          />
        )}

        {currentTab === 'profile' && (
          <ProfileScreen
            userProfile={userProfile}
            currentLoan={currentLoan}
            language={language}
            onToggleLanguage={toggleLanguage}
            onResetData={handleResetData}
            onGoToLogin={() => setCurrentTab('onboarding')}
            onUpdateUserProfile={handleUpdateUserProfile}
          />
        )}
      </main>

      <BottomNav
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        language={language}
        userProfile={userProfile}
        onOpenVoiceModal={() => setIsVoiceModalOpen(true)}
        onToggleLanguage={toggleLanguage}
      />

      <VoiceAssistantModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onApplyVoiceActionResult={handleApplyVoiceResult}
        language={language}
      />

      <Toast message={toastMessage} />
    </div>
  );
}
