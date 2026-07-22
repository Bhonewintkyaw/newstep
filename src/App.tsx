import React, { useCallback, useEffect, useRef, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
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
import { firebaseAuth } from './lib/firebase';

import {
  emptyUserProfile,
  emptyWeatherData,
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

  const [userProfile, setUserProfile] = useState(emptyUserProfile);
  const [registeredLoanProfile, setRegisteredLoanProfile] = useState<RegisteredLoanProfile | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [lowStockAlerts, setLowStockAlerts] = useState<LowStockAlert[]>([]);
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerToast = useCallback((msg: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMessage(msg);
    toastTimerRef.current = setTimeout(() => setToastMessage(null), 3000);
  }, []);

  useEffect(() => () => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
  }, []);

  useEffect(() => {
    if (!firebaseAuth) return;
    return onAuthStateChanged(firebaseAuth, (firebaseUser) => {
      if (!firebaseUser) {
        setCurrentTab('onboarding');
        return;
      }
      setUserProfile((profile) => ({
        ...profile,
        name: firebaseUser.displayName || profile.name || 'User',
        phone: firebaseUser.phoneNumber || profile.phone,
      }));
      setCurrentTab('home');
    });
  }, []);

  const handleApplyVoiceResult = (result: VoiceProcessResult) => {
    if (result.action === 'RECORD_SALE' || result.action === 'RECORD_PURCHASE') {
      const isSale = result.action === 'RECORD_SALE';
      const amount = result.amount ?? 0;
      const itemName = result.itemName?.trim() || (language === 'my' ? 'အရောင်းအဝယ်' : 'Transaction');

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
    setUserProfile((prev) => ({ ...prev, creditPoints: prev.creditPoints + pointsToAdd }));
  };

  const handleUpdateUserProfile = (updated: UserProfile) => {
    setUserProfile(updated);
    triggerToast(language === 'my' ? 'ပရိုဖိုင် အချက်အလက်များ သိမ်းဆည်းပြီးပါပြီ' : 'Profile updated successfully');
  };

  const handleResetData = () => {
    if (firebaseAuth) void signOut(firebaseAuth);
    setTransactions([]);
    setLowStockAlerts([]);
    setInventory([]);
    setRegisteredLoanProfile(null);
    setUserProfile(emptyUserProfile);
    setCurrentTab('onboarding');
    triggerToast(language === 'my' ? 'အကောင့်ဒေတာအားလုံး ရှင်းလင်းပြီးပါပြီ' : 'Account data cleared');
  };

  const handleLogout = async () => {
    if (firebaseAuth) await signOut(firebaseAuth);
    setCurrentTab('onboarding');
  };

  const toggleLanguage = () => setLanguage((l) => (l === 'my' ? 'en' : 'my'));

  return (
    <div className="min-h-dvh bg-[#f8f9fa] text-[#00201e] font-sans antialiased selection:bg-[#006d77] selection:text-[#9becf7]">
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

      <main className={`w-full min-h-dvh transition-[padding-left] duration-200 ${currentTab !== 'onboarding' ? 'lg:pl-64' : ''}`}>
        {currentTab === 'home' && (
          <HomeScreen
            userProfile={userProfile}
            onSelectTab={setCurrentTab}
            onOpenVoiceModal={() => setIsVoiceModalOpen(true)}
            language={language}
          />
        )}

        {currentTab === 'onboarding' && (
          <OnboardingScreen
            onComplete={(username, phone) => {
              setUserProfile({ ...emptyUserProfile, name: username, phone });
              setRegisteredLoanProfile(null);
              setInventory([]);
              setLowStockAlerts([]);
              setTransactions([]);
              setCurrentTab('home');
            }}
            language={language}
          />
        )}

        {currentTab === 'loans' && (
          <LoansScreen
            financialInstitutions={[]}
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
            weatherData={emptyWeatherData}
            marketRecommendations={[]}
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
            language={language}
            onToggleLanguage={toggleLanguage}
            onResetData={handleResetData}
            onGoToLogin={() => void handleLogout()}
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
