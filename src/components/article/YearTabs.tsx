'use client';

import { useTranslations } from 'next-intl';

interface YearTabsProps {
  years: number[];
  selectedYear: number | null;
  onYearChange: (year: number | null) => void;
}

export function YearTabs({ years, selectedYear, onYearChange }: YearTabsProps) {
  const t = useTranslations('article');

  if (years.length === 0) return null;

  return (
    <div className="flex items-center gap-1 overflow-x-auto border-b border-border pb-px">
      <button
        onClick={() => onYearChange(null)}
        className={`shrink-0 rounded-t-md px-3 py-1.5 text-sm font-medium transition-colors ${
          selectedYear === null
            ? 'border-b-2 border-accent text-accent'
            : 'text-muted hover:text-foreground'
        }`}
      >
        {t('allYears')}
      </button>
      {years.map((year) => (
        <button
          key={year}
          onClick={() => onYearChange(year)}
          className={`shrink-0 rounded-t-md px-3 py-1.5 text-sm font-medium transition-colors ${
            selectedYear === year
              ? 'border-b-2 border-accent text-accent'
              : 'text-muted hover:text-foreground'
          }`}
        >
          {year}
        </button>
      ))}
    </div>
  );
}
