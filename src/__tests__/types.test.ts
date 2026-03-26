import { DEFAULT_SETTINGS } from '@/types';
import type { Feed, Article, Summary, Settings } from '@/types';

describe('Types', () => {
  it('DEFAULT_SETTINGS should have correct default values', () => {
    expect(DEFAULT_SETTINGS.polling.enabled).toBe(true);
    expect(DEFAULT_SETTINGS.polling.type).toBe('daily');
    expect(DEFAULT_SETTINGS.polling.time).toBe('07:00');
    expect(DEFAULT_SETTINGS.ai.model).toBe('llama3');
    expect(DEFAULT_SETTINGS.locale).toBe('ko');
    expect(DEFAULT_SETTINGS.theme).toBe('system');
  });

  it('Feed type should be constructable', () => {
    const feed: Feed = {
      id: 'test-id',
      url: 'https://example.com/rss',
      name: 'Test Feed',
      category: 'tech',
      active: true,
      lastFetchedAt: null,
      lastFetchStatus: null,
      lastEtag: null,
      lastModified: null,
      createdAt: '2026-03-18T00:00:00Z',
    };
    expect(feed.id).toBe('test-id');
    expect(feed.active).toBe(true);
  });

  it('Article type should be constructable', () => {
    const article: Article = {
      id: 'article-1',
      feedId: 'feed-1',
      guid: 'guid-1',
      title: 'Test Article',
      link: 'https://example.com/article-1',
      content: '<p>Test content</p>',
      contentSnippet: 'Test content',
      author: 'Author',
      publishedAt: '2026-03-18T00:00:00Z',
      contentHash: 'abc123',
      fetchedAt: '2026-03-18T00:01:00Z',
    };
    expect(article.feedId).toBe('feed-1');
  });

  it('Summary type should be constructable', () => {
    const summary: Summary = {
      id: 'summary-1',
      articleId: 'article-1',
      lang: 'ko',
      title: 'AI 요약 제목',
      description: 'AI가 생성한 요약 설명',
      generatedAt: '2026-03-18T00:05:00Z',
      model: 'llama3',
      status: 'summarized',
    };
    expect(summary.lang).toBe('ko');
    expect(summary.status).toBe('summarized');
  });

  it('Settings type should match DEFAULT_SETTINGS shape', () => {
    const settings: Settings = { ...DEFAULT_SETTINGS };
    expect(settings.polling).toBeDefined();
    expect(settings.ai).toBeDefined();
    expect(settings.locale).toBeDefined();
    expect(settings.theme).toBeDefined();
  });
});
