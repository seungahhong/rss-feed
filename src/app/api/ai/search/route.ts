import { NextRequest, NextResponse } from 'next/server';
import { articleStore, summaryStore } from '@/lib/store';
import { groqChatCompletion, isGroqAvailable } from '@/lib/ai/groq-client';
import type { SupportedLocale, Article, Summary } from '@/types';

const MAX_CONTEXT_CHARS = 16000;
const MAX_CONTEXT_ARTICLES = 20;
const MAX_RELATED_ARTICLES = 5;

export async function POST(request: NextRequest) {
  if (!isGroqAvailable()) {
    return NextResponse.json(
      { error: 'GROQ_API_KEY is not configured' },
      { status: 503 },
    );
  }

  let body: { query?: string; topic?: string; year?: number; lang?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { query, topic, year, lang = 'ko' } = body;
  if (!query?.trim()) {
    return NextResponse.json({ error: 'query is required' }, { status: 400 });
  }

  try {
    // Get filtered articles for context
    const result = await articleStore.getPageByTopicAndYear(1, MAX_CONTEXT_ARTICLES, {
      topic: topic || undefined,
      year: year || undefined,
    });

    // Build context from articles + summaries
    let contextChars = 0;
    const contextParts: string[] = [];
    const articleIds: string[] = [];

    for (const article of result.articles) {
      const summaries = await summaryStore.getByArticleId(article.id);
      const summary = summaries.find((s) => s.lang === (lang as SupportedLocale)) || summaries[0];

      const part = `[${article.title}]\n${summary?.description || article.contentSnippet.slice(0, 300)}`;
      if (contextChars + part.length > MAX_CONTEXT_CHARS) break;

      contextParts.push(part);
      articleIds.push(article.id);
      contextChars += part.length;
    }

    const systemPrompt = lang === 'ko'
      ? `당신은 기술 뉴스 피드 분석 도우미입니다. 주어진 아티클 컨텍스트를 바탕으로 사용자 질문에 답변하세요. 마크다운 형식으로 간결하게 답변하세요. 컨텍스트에 없는 정보는 추측하지 마세요.`
      : `You are a tech news feed analyst. Answer user questions based on the given article context. Respond concisely in markdown format. Do not speculate beyond the context.`;

    const userMessage = `## Context Articles:\n${contextParts.join('\n\n')}\n\n## Question:\n${query}`;

    const answer = await groqChatCompletion(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      { temperature: 0.5, maxTokens: 1024 },
    );

    // Find related articles using simple keyword matching from the query
    const queryWords = query.toLowerCase().split(/\s+/).filter((w) => w.length > 1);
    const scoredArticles = result.articles.map((article) => {
      const text = `${article.title} ${article.contentSnippet}`.toLowerCase();
      const score = queryWords.reduce((s, w) => s + (text.includes(w) ? 1 : 0), 0);
      return { article, score };
    });

    scoredArticles.sort((a, b) => b.score - a.score);
    const topArticles = scoredArticles.slice(0, MAX_RELATED_ARTICLES);

    const relatedArticles = await Promise.all(
      topArticles.map(async ({ article }) => {
        const summaries = await summaryStore.getByArticleId(article.id);
        const summary = summaries.find((s) => s.lang === (lang as SupportedLocale)) || summaries[0] || null;
        return { ...article, summary } as Article & { summary?: Summary | null };
      }),
    );

    return NextResponse.json({
      data: { answer, relatedArticles },
    });
  } catch (error) {
    console.error('AI search failed:', error);
    return NextResponse.json(
      { error: 'AI search failed' },
      { status: 500 },
    );
  }
}
