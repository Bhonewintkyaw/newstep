import React from 'react';

type Period = 'daily' | 'monthly' | 'yearly';

interface MetricPeriodSelectorProps {
  active: Period;
  onChange: (p: Period) => void;
  language: 'my' | 'en';
}

const periods: Period[] = ['daily', 'monthly', 'yearly'];

const labels: Record<Period, { my: string; en: string }> = {
  daily: { my: 'နေ့စဉ်', en: 'Daily' },
  monthly: { my: 'လစဉ်', en: 'Monthly' },
  yearly: { my: 'နှစ်စဉ်', en: 'Yearly' },
};

export const MetricPeriodSelector: React.FC<MetricPeriodSelectorProps> = ({ active, onChange, language }) => {
  return (
    <div className="flex bg-gray-100 p-1 rounded-2xl">
      {periods.map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
            active === p ? 'bg-[#00535b] text-white shadow-xs' : 'text-gray-600 hover:text-[#00535b]'
          }`}
        >
          {language === 'my' ? labels[p].my : labels[p].en}
        </button>
      ))}
    </div>
  );
};
