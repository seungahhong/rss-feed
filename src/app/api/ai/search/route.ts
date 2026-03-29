import { NextRequest, NextResponse } from 'next/server';
import { articleStore, summaryStore } from '@/lib/store';
import { groqChatCompletion, isGroqAvailable } from '@/lib/ai/groq-client';
import type { SupportedLocale, Article, Summary } from '@/types';

const MAX_CONTEXT_CHARS = 16000;
const MAX_CONTEXT_ARTICLES = 20;
const MAX_DB_RESULTS = 10;

export async function POST(request: NextRequest) {
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
    // Step 1: DB keyword search — direct text match in articles
    const dbSearchResults = await articleStore.search(query.trim());
    const filteredDbResults = dbSearchResults
      .filter((a) => {
        if (topic && a.topic !== topic) return false;
        if (year && a.publishedAt) {
          const articleYear = new Date(a.publishedAt).getFullYear();
          if (articleYear !== year) return false;
        }
        return true;
      })
      .slice(0, MAX_DB_RESULTS);

    const dbArticles = await Promise.all(
      filteredDbResults.map(async (article) => {
        const summaries = await summaryStore.getByArticleId(article.id);
        const summary = summaries.find((s) => s.lang === (lang as SupportedLocale)) || summaries[0] || null;
        return { ...article, summary } as Article & { summary?: Summary | null };
      }),
    );

    // Step 2: Web search — GROQ general knowledge answer (only if GROQ is available)
    let webAnswer = '';
    if (!isGroqAvailable()) {
      webAnswer = lang === 'ko'
        ? 'AI 웹 검색이 설정되어 있지 않습니다. DB 검색 결과만 표시합니다.'
        : 'AI web search is not configured. Showing database results only.';
    } else try {
      const webSystemPrompt = lang === 'ko'
        ? `당신은 기술 전문가입니다. 사용자의 질문에 대해 당신의 지식을 바탕으로 답변하세요. 마크다운 형식으로 간결하게 답변하세요. 관련 기술, 트렌드, 개념을 설명해주세요.`
        : `You are a tech expert. Answer the user's question based on your knowledge. Respond concisely in markdown format. Explain relevant technologies, trends, and concepts.`;

      // Build DB context for enriched web answer
      const result = await articleStore.getPageByTopicAndYear(1, MAX_CONTEXT_ARTICLES, {
        topic: topic || undefined,
        year: year || undefined,
      });

      let contextChars = 0;
      const contextParts: string[] = [];

      for (const article of result.articles) {
        const summaries = await summaryStore.getByArticleId(article.id);
        const summary = summaries.find((s) => s.lang === (lang as SupportedLocale)) || summaries[0];

        const part = `[${article.title}]\n${summary?.description || article.contentSnippet.slice(0, 300)}`;
        if (contextChars + part.length > MAX_CONTEXT_CHARS) break;

        contextParts.push(part);
        contextChars += part.length;
      }

      const webUserMessage = contextParts.length > 0
        ? `다음은 참고할 수 있는 관련 아티클입니다:\n${contextParts.join('\n\n')}\n\n위 아티클과 당신의 일반 지식을 모두 활용하여 질문에 답변하세요.\n\n## Question:\n${query}`
        : query;

      webAnswer = await groqChatCompletion(
        [
          { role: 'system', content: webSystemPrompt },
          { role: 'user', content: webUserMessage },
        ],
        { temperature: 0.5, maxTokens: 1024 },
      );
    } catch (error) {
      console.warn('GROQ web search failed, returning DB results only:', error);
      webAnswer = lang === 'ko'
        ? 'AI 웹 검색을 일시적으로 사용할 수 없습니다. DB 검색 결과만 표시합니다.'
        : 'AI web search is temporarily unavailable. Showing database results only.';
    }

    return NextResponse.json({
      data: { dbArticles, webAnswer },
    });
  } catch (error) {
    console.error('AI search failed:', error);
    return NextResponse.json(
      { error: 'AI search failed' },
      { status: 500 },
    );
  }
}
