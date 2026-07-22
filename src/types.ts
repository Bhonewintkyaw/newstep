export type TabType = 'home' | 'loans' | 'inventory' | 'prediction' | 'profile' | 'onboarding';

export interface UserProfile {
  name: string;
  titleBurmese: string;
  titleEnglish: string;
  ratingStars: number; // 1 to 5
  creditPoints: number; // e.g., 780
  starLevelTitleBurmese: string;
  starLevelTitleEnglish: string;
  trustedStatusBurmese: string;
  trustedStatusEnglish: string;
  nrcNumber: string;
  phone: string;
  avatarUrl: string;
  shopName: string;
  city: string;
  lat?: number;
  lng?: number;
}

export interface FinancialInstitution {
  id: string;
  name: string;
  type: 'bank' | 'microfinance' | 'ngo' | 'financial_org';
  typeLabelBurmese: string;
  typeLabelEnglish: string;
  amountRangeBurmese: string;
  amountRangeEnglish: string;
  interestRateBurmese: string;
  interestRateEnglish: string;
  repaymentTermBurmese: string;
  repaymentTermEnglish: string;
  descriptionBurmese: string;
  descriptionEnglish: string;
  requirementsBurmese: string[];
  requirementsEnglish: string[];
  iconName: string;
  containerBgClass: string;
  audioTextBurmese: string;
  coords: { lat: number; lng: number; xPercent: number; yPercent: number };
}

export interface RegisteredLoanProfile {
  id: string;
  organizationName: string;
  loanPurpose: string;
  loanAmountMMK: number;
  nrcNumber: string;
  monthlyInterestRatePercent: number;
  totalRepaymentAmountMMK: number;
  weeklyRepaymentMMK: number;
  totalWeeks: number;
  paidWeeks: number;
  nextDeadlineBurmese: string;
  nextDeadlineEnglish: string;
  daysRemaining: number;
  status: 'Approved' | 'Pending' | 'Active';
}

export interface InventoryItem {
  id: string;
  nameBurmese: string;
  nameEnglish: string;
  category: string;
  quantity: number;
  unitBurmese: string;
  unitEnglish: string;
  pricePerUnitMMK: number;
  costPerUnitMMK: number;
  lowStockThreshold: number;
  isLowStock?: boolean;
}

export interface LowStockAlert {
  id: string;
  nameBurmese: string;
  nameEnglish: string;
  remainingQuantity: number;
  unitBurmese: string;
  unitEnglish: string;
}

export interface TransactionItem {
  id: string;
  type: 'sale' | 'purchase';
  titleBurmese: string;
  titleEnglish: string;
  timestampBurmese: string;
  timestampEnglish: string;
  amountMMK: number;
  profitMMK?: number;
  date?: string; // YYYY-MM-DD format for aggregation
}

export interface BusinessFinancialMetrics {
  dailySalesMMK: number;
  dailyProfitMMK: number;
  monthlySalesMMK: number;
  monthlyProfitMMK: number;
  yearlySalesMMK: number;
  yearlyProfitMMK: number;
}

export interface LoanRepaymentAnalysis {
  monthlyProfitMMK: number;
  requiredMonthlyRepaymentMMK: number;
  coverageRatioPercent: number; // (Monthly Profit / Required Repayment) * 100
  repaymentAbilityStatus: 'safe' | 'moderate' | 'warning';
  statusMessageBurmese: string;
  statusMessageEnglish: string;
  aiWarningBurmese?: string;
  aiWarningEnglish?: string;
  recommendationsBurmese: string[];
  recommendationsEnglish: string[];
}

export interface WeatherData {
  city: string;
  cityBurmese: string;
  tempCelsius: number;
  conditionBurmese: string;
  conditionEnglish: string;
  iconName: string;
  rainProbabilityPercent: number;
  humidityPercent: number;
  windSpeedKmh: number;
  stormWarning?: string;
  voiceAnnouncementBurmese: string;
  businessAdviceBurmese: string;
  businessAdviceEnglish: string;
}

export interface MarketRecommendation {
  id: string;
  name: string;
  nameBurmese: string;
  distanceKm: number;
  typeBurmese: string;
  typeEnglish: string;
  opportunityBurmese: string;
  opportunityEnglish: string;
  bestSellingProductsBurmese: string;
  bestSellingProductsEnglish: string;
  footTrafficLevel: 'High' | 'Medium' | 'Very High';
  coords: { lat: number; lng: number };
}

export interface VoiceProcessResult {
  action: 'RECORD_SALE' | 'RECORD_PURCHASE' | 'CHECK_LOAN' | 'CHECK_WEATHER' | 'INVENTORY_INQUIRY' | 'GENERAL_QUERY';
  itemName?: string;
  quantity?: string | number;
  amount?: number;
  replyBurmese: string;
  replyEnglish: string;
}

