import { useTranslations } from 'next-intl';
import type { Article, Summary } from '@/types';

interface ArticleCardProps {
  article: Article & { summary?: Summary | null };
  index?: number;
}

export function ArticleCard({ article, index = 0 }: ArticleCardProps) {
  const t = useTranslations('article');
  const summary = article.summary;
  const staggerClass = index <= 5 ? `stagger-${index}` : '';

  return (
    <article
      className={`animate-fade-in opacity-0 ${staggerClass} group rounded-lg border border-border bg-surface p-5 transition-all hover:border-accent/30 hover:shadow-sm`}
    >
      {summary ? (
        <>
          <h2 className="text-base font-semibold leading-snug tracking-tight text-foreground">
            {summary.title}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted line-clamp-4">
            {summary.description}
          </p>
        </>
      ) : (
        <>
          <h2 className="text-base font-semibold leading-snug tracking-tight text-foreground">
            {article.title}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted line-clamp-3">
            {article.contentSnippet?.slice(0, 200)}
          </p>
        </>
      )}

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-muted">
          {article.publishedAt && (
            <time dateTime={article.publishedAt}>
              {new Date(article.publishedAt).toLocaleDateString()}
            </time>
          )}
          {summary && (
            <span className="rounded-full bg-accent/10 px-2 py-0.5 text-accent">
              {t('summarizedBy')}
            </span>
          )}
        </div>
        <a
          href={article.link}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-medium text-accent transition-colors hover:text-accent-hover"
        >
          {t('readOriginal')} →
        </a>
      </div>
    </article>
  );
}
