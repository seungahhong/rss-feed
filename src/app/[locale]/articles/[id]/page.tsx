import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { articleStore, summaryStore } from '@/lib/store';
import { translateSummary, isGroqAvailable } from '@/lib/ai/groq-client';
import type { SupportedLocale } from '@/types';
import { Link } from '@/i18n/navigation';

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return '';
  }
}

export default async function ArticleDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const t = await getTranslations('article');
  const lang = locale as SupportedLocale;

  const article = await articleStore.getById(id);
  if (!article) notFound();

  // Get summary in target language
  let title = article.title;
  let description = article.contentSnippet || '';

  const summary = await summaryStore.getByArticleAndLang(id, lang);

  if (summary) {
    title = summary.title;
    description = summary.description;
  } else {
    // Try other language summary and translate
    const allSummaries = await summaryStore.getByArticleId(id);
    const otherSummary = allSummaries[0];

    if (otherSummary && isGroqAvailable()) {
      try {
        const translated = await translateSummary(
          otherSummary.title,
          otherSummary.description,
          lang,
        );
        // Cache the translation
        await summaryStore.add({
          articleId: id,
          lang,
          title: translated.title,
          description: translated.description,
          model: 'groq-translate',
        });
        title = translated.title;
        description = translated.description;
      } catch {
        title = otherSummary.title;
        description = otherSummary.description;
      }
    } else if (otherSummary) {
      title = otherSummary.title;
      description = otherSummary.description;
    } else if (isGroqAvailable()) {
      // No summary at all — translate raw title + snippet
      try {
        const translated = await translateSummary(
          article.title,
          article.contentSnippet?.slice(0, 500) || article.title,
          lang,
        );
        await summaryStore.add({
          articleId: id,
          lang,
          title: translated.title,
          description: translated.description,
          model: 'groq-translate',
        });
        title = translated.title;
        description = translated.description;
      } catch {
        // Keep original as fallback
      }
    }
  }

  const sourceDomain = extractDomain(article.link);
  const publishedDate = article.publishedAt
    ? new Date(article.publishedAt).toLocaleDateString(locale === 'ko' ? 'ko-KR' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';

  return (
    <article className="mx-auto max-w-2xl">
      <header>
        <h1 className="text-2xl font-bold leading-tight tracking-tight text-foreground">
          {title}
        </h1>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted">
          {article.topic && article.topic !== 'Uncategorized' && (
            <span className="rounded bg-surface-hover px-2 py-0.5 text-xs font-medium">
              {article.topic}
            </span>
          )}
          {sourceDomain && (
            <span>{sourceDomain}</span>
          )}
          {publishedDate && (
            <>
              <span>&middot;</span>
              <time dateTime={article.publishedAt}>{publishedDate}</time>
            </>
          )}
        </div>
      </header>

      <div className="mt-6 whitespace-pre-line text-sm leading-relaxed text-foreground/90">
        {description}
      </div>

      <div className="mt-8 flex items-center gap-4 border-t border-border pt-6">
        <a
          href={article.link}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-accent transition-colors hover:text-accent-hover"
        >
          {t('readOriginal')} &rarr;
        </a>
      </div>

      <div className="mt-4">
        <Link
          href="/"
          className="text-sm text-muted transition-colors hover:text-foreground"
        >
          &larr; {t('backToHome')}
        </Link>
      </div>
    </article>
  );
}
