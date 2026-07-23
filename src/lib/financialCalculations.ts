import type { TransactionItem } from '../types';

export type FinancialPeriod = 'daily' | 'monthly' | 'yearly';

export interface PeriodFinancialMetrics {
  salesMMK: number;
  profitMMK: number;
  profitMarginPercent: number;
}

const isInPeriod = (date: string | undefined, period: FinancialPeriod, now: Date) => {
  // Keep legacy records without a date visible until they are re-saved with one.
  if (!date) return true;

  const [year, month, day] = date.split('-').map(Number);
  if (!year || !month || !day) return false;
  if (year !== now.getFullYear()) return false;
  if (period === 'yearly') return true;
  if (month !== now.getMonth() + 1) return false;
  return period === 'monthly' || day === now.getDate();
};

export const calculatePeriodMetrics = (
  transactions: TransactionItem[],
  period: FinancialPeriod,
  now = new Date(),
): PeriodFinancialMetrics => {
  const sales = transactions.filter(
    (transaction) =>
      transaction.type === 'sale' &&
      Number.isFinite(transaction.amountMMK) &&
      transaction.amountMMK > 0 &&
      isInPeriod(transaction.date, period, now),
  );

  const salesMMK = sales.reduce((total, transaction) => total + transaction.amountMMK, 0);
  const profitMMK = sales.reduce((total, transaction) => {
    const profit = transaction.profitMMK;
    return total + (profit !== undefined && Number.isFinite(profit) ? profit : 0);
  }, 0);

  return {
    salesMMK,
    profitMMK,
    profitMarginPercent: salesMMK > 0 ? (profitMMK / salesMMK) * 100 : 0,
  };
};

export const calculateMonthlyRepayment = (weeklyRepaymentMMK: number) =>
  Number.isFinite(weeklyRepaymentMMK) && weeklyRepaymentMMK > 0
    ? (weeklyRepaymentMMK * 52) / 12
    : 0;

export const calculateCoveragePercent = (monthlyProfitMMK: number, monthlyRepaymentMMK: number) =>
  monthlyRepaymentMMK > 0
    ? Math.max(0, (monthlyProfitMMK / monthlyRepaymentMMK) * 100)
    : null;
