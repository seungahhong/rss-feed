'use client';

import { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';

interface SummaryFeedItem {
  id: string;
  title: string;
  description: string;
  link: string;
  publishedAt: string;
  topic: string;
  sourceDomain: string;
}

function formatRelativeDate(dateStr: string, locale: string): string {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (locale === 'ko') {
    if (diffMin < 60) return `${diffMin}분 전`;
    if (diffHr < 24) return `${diffHr}시간 전`;
    if (diffDay < 30) return `${diffDay}일 전`;
    return date.toLocaleDateString('ko-KR');
  }
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 30) return `${diffDay}d ago`;
  return date.toLocaleDateString('en-US');
}

export function SummaryList() {
  const t = useTranslations('article');
  const locale = useLocale();
  const [items, setItems] = useState<SummaryFeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/summary-feed?lang=${locale}&limit=30`)
      .then((r) => r.json())
      .then((res) => {
        if (res.data?.articles) setItems(res.data.articles);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [locale]);

  if (loading) {
    return (
      <div className="space-y-0 divide-y divide-border">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex gap-3 py-3">
            <div className="h-4 w-6 shrink-0 animate-pulse rounded bg-surface-hover" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 animate-pulse rounded bg-surface-hover" />
              <div className="h-3 w-full animate-pulse rounded bg-surface-hover" />
              <div className="h-3 w-1/4 animate-pulse rounded bg-surface-hover" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-lg text-muted">{t('noArticles')}</p>
      </div>
    );
  }

  return (
    <div>
      <p className="mb-3 text-xs text-muted">{t('summaryDesc')}</p>
      <ol className="divide-y divide-border">
        {items.map((item, i) => (
          <li key={item.id} className="flex gap-3 py-3">
            <span className="w-6 shrink-0 pt-0.5 text-right text-sm font-medium text-muted">
              {i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <Link
                href={`/articles/${item.id}`}
                className="text-sm font-medium leading-snug text-foreground transition-colors hover:text-accent"
              >
                {item.title}
              </Link>
              {item.sourceDomain && (
                <span className="ml-1.5 text-xs text-muted">({item.sourceDomain})</span>
              )}
              <p className="mt-0.5 text-xs leading-relaxed text-muted line-clamp-2">
                {item.description}
              </p>
              <div className="mt-1 flex items-center gap-1.5 text-xs text-muted/70">
                <span className="rounded bg-surface-hover px-1.5 py-0.5 text-xs">
                  {item.topic}
                </span>
                <span>&middot;</span>
                <time dateTime={item.publishedAt}>
                  {formatRelativeDate(item.publishedAt, locale)}
                </time>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
