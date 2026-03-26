'use client';

import { useTranslations } from 'next-intl';
import type { Article, Summary } from '@/types';

type ArticleWithSummary = Article & { summary?: Summary | null };

interface RelatedArticlesProps {
  articles: ArticleWithSummary[];
}

export function RelatedArticles({ articles }: RelatedArticlesProps) {
  const t = useTranslations('sidebar');

  return (
    <div>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
        {t('relatedArticles')}
      </h3>
      <div className="space-y-2">
        {articles.map((article) => (
          <a
            key={article.id}
            href={article.link}
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-md border border-border p-2.5 transition-colors hover:border-accent/30 hover:bg-surface-hover"
          >
            <h4 className="text-xs font-medium leading-snug text-foreground line-clamp-2">
              {article.summary?.title || article.title}
            </h4>
            {article.publishedAt && (
              <time className="mt-1 block text-xs text-muted" dateTime={article.publishedAt}>
                {new Date(article.publishedAt).toLocaleDateString()}
              </time>
            )}
          </a>
        ))}
      </div>
    </div>
  );
}
