'use client';

import { useTranslations } from 'next-intl';

interface YearTabsProps {
  years: number[];
  selectedYear: number | null;
  showSummary: boolean;
  onYearChange: (year: number) => void;
  onSummarySelect: () => void;
}

export function YearTabs({ years, selectedYear, showSummary, onYearChange, onSummarySelect }: YearTabsProps) {
  const t = useTranslations('article');

  return (
    <div className="flex items-center gap-1 overflow-x-auto border-b border-border pb-px">
      <button
        onClick={onSummarySelect}
        className={`shrink-0 rounded-t-md px-3 py-1.5 text-sm font-medium transition-colors ${
          showSummary
            ? 'border-b-2 border-accent text-accent'
            : 'text-muted hover:text-foreground'
        }`}
      >
        {t('summaryTab')}
      </button>
      {years.map((year) => (
        <button
          key={year}
          onClick={() => onYearChange(year)}
          className={`shrink-0 rounded-t-md px-3 py-1.5 text-sm font-medium transition-colors ${
            !showSummary && selectedYear === year
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
