'use client';

import { useTranslations } from 'next-intl';
import { useCallback } from 'react';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  loading: boolean;
}

export function SearchInput({ value, onChange, onSubmit, loading }: SearchInputProps) {
  const t = useTranslations('sidebar');

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        onSubmit();
      }
    },
    [onSubmit],
  );

  return (
    <div className="flex gap-2">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={t('inputPlaceholder')}
        disabled={loading}
        className="flex-1 rounded-md border border-border bg-surface px-3 py-1.5 text-sm placeholder:text-muted/60 focus:border-accent focus:outline-none disabled:opacity-50"
      />
      <button
        onClick={onSubmit}
        disabled={loading || !value.trim()}
        className="shrink-0 rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-30"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </button>
    </div>
  );
}
