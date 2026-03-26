import { NextRequest, NextResponse } from 'next/server';
import { articleStore, summaryStore } from '@/lib/store';
import type { SupportedLocale } from '@/types';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '20', 10);
  const feedId = searchParams.get('feedId') || undefined;
  const query = searchParams.get('q') || '';
  const lang = (searchParams.get('lang') || 'ko') as SupportedLocale;

  const topic = searchParams.get('topic') || undefined;
  const year = searchParams.get('year') ? parseInt(searchParams.get('year')!, 10) : undefined;

  if (query) {
    const summaryResults = await summaryStore.search(query);
    const articleResults = await articleStore.search(query);

    const articleIds = new Set([
      ...summaryResults.map((s) => s.articleId),
      ...articleResults.map((a) => a.id),
    ]);

    const articles = [];
    for (const id of articleIds) {
      const article = await articleStore.getById(id);
      if (article) {
        const summaries = await summaryStore.getByArticleId(id);
        const summary = summaries.find((s) => s.lang === lang) || summaries[0] || null;
        articles.push({ ...article, summary });
      }
    }

    return NextResponse.json({
      data: { articles, total: articles.length, page: 1, totalPages: 1 },
    });
  }

  const result = await articleStore.getPageByTopicAndYear(page, limit, { topic, year, feedId });

  const articlesWithSummaries = await Promise.all(
    result.articles.map(async (article) => {
      const summaries = await summaryStore.getByArticleId(article.id);
      const summary = summaries.find((s) => s.lang === lang) || summaries[0] || null;
      return { ...article, summary };
    }),
  );

  return NextResponse.json({
    data: {
      articles: articlesWithSummaries,
      total: result.total,
      page: result.page,
      totalPages: result.totalPages,
    },
  });
}
