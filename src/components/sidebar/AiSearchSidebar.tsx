'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { SearchInput } from './SearchInput';
import { AiAnswer } from './AiAnswer';
import { RelatedArticles } from './RelatedArticles';
import type { Article, Summary } from '@/types';

type ArticleWithSummary = Article & { summary?: Summary | null };

interface AiSearchSidebarProps {
  topic?: string | null;
  year?: number | null;
  isOpen: boolean;
  onClose: () => void;
}

interface SearchResult {
  answer: string;
  relatedArticles: ArticleWithSummary[];
}

export function AiSearchSidebar({ topic, year, isOpen, onClose }: AiSearchSidebarProps) {
  const t = useTranslations('sidebar');
  const locale = useLocale();
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/ai/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: query.trim(),
          topic: topic || undefined,
          year: year || undefined,
          lang: locale,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Error ${res.status}`);
      }

      const data = await res.json();
      setResult(data.data);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setError(err instanceof Error ? err.message : t('searchError'));
    } finally {
      setLoading(false);
    }
  }, [query, topic, year, locale, t]);

  // Clean up on unmount
  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  return (
    <>
      {/* Mobile overlay backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed right-0 top-14 z-50 flex h-[calc(100vh-3.5rem)] w-80 flex-col border-l border-border bg-background transition-transform duration-200 lg:static lg:z-0 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold">{t('title')}</h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-muted hover:text-foreground lg:hidden"
            aria-label="Close"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search input */}
        <div className="border-b border-border px-4 py-3">
          <SearchInput
            value={query}
            onChange={setQuery}
            onSubmit={handleSearch}
            loading={loading}
          />
        </div>

        {/* Results area */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-400">
              {error}
            </div>
          )}

          {loading && (
            <div className="flex items-center gap-2 py-8 text-sm text-muted">
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              {t('searching')}
            </div>
          )}

          {result && !loading && (
            <div className="space-y-4">
              <AiAnswer answer={result.answer} />
              {result.relatedArticles.length > 0 && (
                <RelatedArticles articles={result.relatedArticles} />
              )}
            </div>
          )}

          {!result && !loading && !error && (
            <p className="py-8 text-center text-sm text-muted">
              {t('placeholder')}
            </p>
          )}
        </div>
      </aside>
    </>
  );
}
