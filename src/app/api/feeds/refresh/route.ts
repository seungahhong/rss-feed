import { NextResponse } from 'next/server';
import { feedStore, articleStore, summaryStore, settingsStore, topicStore } from '@/lib/store';
import { fetchRssFeed } from '@/lib/rss/fetcher';
import { diffArticles, filterBySnapshot } from '@/lib/rss/differ';
import { summarizeArticle } from '@/lib/ai/summarizer';
import { SummaryQueue } from '@/lib/ai/queue';
import { classifyArticleTopics } from '@/lib/ai/topic-classifier';
import { isGroqAvailable, groqSummarize } from '@/lib/ai/groq-client';
import { fetchArticleContent } from '@/lib/rss/content-fetcher';
import type { SupportedLocale } from '@/types';

const summaryQueue = new SummaryQueue();

export async function POST() {
  const feeds = await feedStore.getAll();
  const activeFeeds = feeds.filter((f) => f.active);
  const settings = await settingsStore.get();

  const results: Array<{ feedId: string; newCount: number; updatedCount: number; error?: string }> =
    [];

  for (const feed of activeFeeds) {
    try {
      const fetchResult = await fetchRssFeed(feed.url, {
        etag: feed.lastEtag,
        lastModified: feed.lastModified,
      });

      if (fetchResult.notModified || !fetchResult.feed) {
        await feedStore.updateFeed(feed.id, {
          lastFetchedAt: new Date().toISOString(),
          lastFetchStatus: 'success',
        });
        results.push({ feedId: feed.id, newCount: 0, updatedCount: 0 });
        continue;
      }

      const existingArticles = await articleStore.getByFeedId(feed.id);

      // Snapshot filtering: skip items published before snapshotAt
      const filteredItems = filterBySnapshot(fetchResult.feed.items, feed.snapshotAt ?? null);
      const diff = diffArticles(existingArticles, filteredItems);

      // Record snapshot on first sync
      if (!feed.snapshotAt) {
        await feedStore.updateFeed(feed.id, {
          snapshotAt: new Date().toISOString(),
        });
      }

      // Batch topic classification for new items
      const topicMap = new Map<string, string>();
      if (diff.newItems.length > 0 && isGroqAvailable()) {
        try {
          await topicStore.ensureSeedTopics();
          const existingTopics = await topicStore.getNames();
          // Classify in batches of 10
          for (let i = 0; i < diff.newItems.length; i += 10) {
            const batch = diff.newItems.slice(i, i + 10);
            const batchResult = await classifyArticleTopics(
              batch.map((item) => ({ title: item.title, contentSnippet: item.contentSnippet })),
              existingTopics,
            );
            for (const [title, topic] of batchResult) {
              topicMap.set(title, topic);
            }
          }
          // Register new topics
          for (const topic of new Set(topicMap.values())) {
            if (topic !== 'Uncategorized') {
              await topicStore.add({
                name: topic,
                label: { ko: topic, en: topic },
              });
            }
          }
        } catch (error) {
          console.error('Topic classification failed:', error);
        }
      }

      for (const newItem of diff.newItems) {
        const topic = topicMap.get(newItem.title) || 'Uncategorized';
        const article = await articleStore.add({
          feedId: feed.id,
          guid: newItem.guid,
          title: newItem.title,
          link: newItem.link,
          content: newItem.content,
          contentSnippet: newItem.contentSnippet,
          author: newItem.author,
          publishedAt: newItem.publishedAt,
          contentHash: newItem.contentHash,
          topic,
        });

        summaryQueue.enqueue(() =>
          fetchAndSummarize(article.id, newItem.title, newItem.link, newItem.contentSnippet, settings.locale, settings.ai.ollamaUrl, settings.ai.model),
        );
      }

      for (const updated of diff.updatedItems) {
        await articleStore.updateArticle(updated.existingId, {
          content: updated.item.content,
          contentSnippet: updated.item.contentSnippet,
          contentHash: updated.item.contentHash,
          title: updated.item.title,
        });

        await summaryStore.deleteByArticleId(updated.existingId);
        summaryQueue.enqueue(() =>
          fetchAndSummarize(updated.existingId, updated.item.title, updated.item.link, updated.item.contentSnippet, settings.locale, settings.ai.ollamaUrl, settings.ai.model),
        );
      }

      await feedStore.updateFeed(feed.id, {
        lastFetchedAt: new Date().toISOString(),
        lastFetchStatus: 'success',
        lastEtag: fetchResult.etag,
        lastModified: fetchResult.lastModified,
      });

      results.push({
        feedId: feed.id,
        newCount: diff.newItems.length,
        updatedCount: diff.updatedItems.length,
      });
    } catch (error) {
      await feedStore.updateFeed(feed.id, {
        lastFetchedAt: new Date().toISOString(),
        lastFetchStatus: 'error',
      });
      results.push({
        feedId: feed.id,
        newCount: 0,
        updatedCount: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return NextResponse.json({ data: results });
}

async function fetchAndSummarize(
  articleId: string,
  title: string,
  link: string,
  fallbackContent: string,
  locale: SupportedLocale,
  ollamaUrl: string,
  model: string,
): Promise<void> {
  try {
    // 1. Fetch actual page content
    const pageContent = await fetchArticleContent(link);
    const content = pageContent || fallbackContent;

    // 2. Try GROQ summarization first (uses fetched full content)
    if (isGroqAvailable() && content.length > 100) {
      try {
        const result = await groqSummarize(title, content, locale);
        await summaryStore.add({
          articleId,
          lang: locale,
          title: result.title,
          description: result.description,
          model: 'groq',
        });
        return;
      } catch (error) {
        console.warn(`GROQ summarize failed for ${articleId}, falling back to Ollama:`, error);
      }
    }

    // 3. Fallback to Ollama
    const result = await summarizeArticle(title, content, locale, ollamaUrl, model);
    await summaryStore.add({
      articleId,
      lang: locale,
      title: result.title,
      description: result.description,
      model,
    });
  } catch (error) {
    console.error(`Failed to summarize article ${articleId}:`, error);
  }
}
