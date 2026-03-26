'use client';

import { useEffect, useState, useCallback } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { ArticleCard } from './ArticleCard';
import type { Article, Summary } from '@/types';

type ArticleWithSummary = Article & { summary?: Summary | null };

interface PageData {
  articles: ArticleWithSummary[];
  total: number;
  page: number;
  totalPages: number;
}

interface ArticleListProps {
  topic?: string | null;
  year?: number | null;
}

export function ArticleList({ topic, year }: ArticleListProps) {
  const t = useTranslations('article');
  const locale = useLocale();
  const [data, setData] = useState<PageData | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [topic, year]);

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      limit: '12',
      lang: locale,
    });
    if (topic) params.set('topic', topic);
    if (year) params.set('year', String(year));

    try {
      const res = await fetch(`/api/articles?${params}`);
      const json = await res.json();
      setData(json.data);
    } finally {
      setLoading(false);
    }
  }, [page, locale, topic, year]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-48 animate-pulse rounded-lg border border-border bg-surface" />
        ))}
      </div>
    );
  }

  if (!data || data.articles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-lg text-muted">{t('noArticles')}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.articles.map((article, i) => (
          <ArticleCard key={article.id} article={article} index={i} />
        ))}
      </div>

      {data.totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-md border border-border px-3 py-1.5 text-sm disabled:opacity-30"
          >
            &larr;
          </button>
          <span className="px-3 text-sm text-muted">
            {page} / {data.totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
            disabled={page === data.totalPages}
            className="rounded-md border border-border px-3 py-1.5 text-sm disabled:opacity-30"
          >
            &rarr;
          </button>
        </div>
      )}
    </div>
  );
}
