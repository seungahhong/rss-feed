import { NextRequest, NextResponse } from 'next/server';
import { articleStore, summaryStore } from '@/lib/store';
import { translateSummary, isGroqAvailable } from '@/lib/ai/groq-client';
import type { SupportedLocale } from '@/types';

interface SummaryFeedItem {
  id: string;
  title: string;
  description: string;
  link: string;
  publishedAt: string;
  topic: string;
  sourceDomain: string;
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return '';
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lang = (searchParams.get('lang') || 'ko') as SupportedLocale;
  const limit = parseInt(searchParams.get('limit') || '30', 10);

  try {
    const articles = await articleStore.getRecentArticles(30, limit);

    const items: SummaryFeedItem[] = [];

    for (const article of articles) {
      let title = article.title;
      let description = article.contentSnippet?.slice(0, 300) || '';

      // Try to get summary in target language
      const summary = await summaryStore.getByArticleAndLang(article.id, lang);

      if (summary) {
        title = summary.title;
        description = summary.description;
      } else {
        // Check for summary in other language
        const allSummaries = await summaryStore.getByArticleId(article.id);
        const otherSummary = allSummaries[0];

        if (otherSummary && isGroqAvailable()) {
          // Translate existing summary from other language
          try {
            const translated = await translateSummary(
              otherSummary.title,
              otherSummary.description,
              lang,
            );
            await summaryStore.add({
              articleId: article.id,
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
          // No summary at all — translate raw title + snippet to target language
          try {
            const translated = await translateSummary(
              article.title,
              article.contentSnippet?.slice(0, 500) || article.title,
              lang,
            );
            await summaryStore.add({
              articleId: article.id,
              lang,
              title: translated.title,
              description: translated.description,
              model: 'groq-translate',
            });
            title = translated.title;
            description = translated.description;
          } catch {
            // Keep original English as fallback
          }
        }
      }

      items.push({
        id: article.id,
        title,
        description,
        link: article.link,
        publishedAt: article.publishedAt,
        topic: article.topic,
        sourceDomain: extractDomain(article.link),
      });
    }

    return NextResponse.json({ data: { articles: items } });
  } catch (error) {
    console.error('Summary feed failed:', error);
    return NextResponse.json({ error: 'Failed to load summary feed' }, { status: 500 });
  }
}
