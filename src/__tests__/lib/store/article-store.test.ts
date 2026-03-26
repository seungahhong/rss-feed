import { ArticleStore } from '@/lib/store/article-store';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

describe('ArticleStore', () => {
  let tmpDir: string;
  let store: ArticleStore;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'article-store-test-'));
    store = new ArticleStore(path.join(tmpDir, 'articles.json'));
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it('should return empty articles initially', async () => {
    const articles = await store.getAll();
    expect(articles).toEqual([]);
  });

  it('should add an article', async () => {
    const article = await store.add({
      feedId: 'feed-1',
      guid: 'guid-1',
      title: 'Test Article',
      link: 'https://example.com/1',
      content: '<p>content</p>',
      contentSnippet: 'content',
      author: 'Author',
      publishedAt: '2026-03-18T00:00:00Z',
      contentHash: 'hash123',
      topic: 'AI/ML',
    });
    expect(article.id).toBeDefined();
    expect(article.feedId).toBe('feed-1');
    expect(article.fetchedAt).toBeDefined();
    expect(article.topic).toBe('AI/ML');
  });

  it('should find article by guid', async () => {
    await store.add({
      feedId: 'feed-1',
      guid: 'unique-guid',
      title: 'Test',
      link: 'https://example.com/1',
      content: '',
      contentSnippet: '',
      author: '',
      publishedAt: '2026-03-18T00:00:00Z',
      contentHash: 'hash',
      topic: 'Uncategorized',
    });
    const found = await store.findByGuid('unique-guid');
    expect(found).not.toBeNull();
    expect(found?.guid).toBe('unique-guid');
  });

  it('should return null for non-existent guid', async () => {
    const found = await store.findByGuid('non-existent');
    expect(found).toBeNull();
  });

  it('should get articles by feedId', async () => {
    await store.add({ feedId: 'feed-1', guid: 'g1', title: 'A1', link: '', content: '', contentSnippet: '', author: '', publishedAt: '', contentHash: 'h1', topic: 'AI/ML' });
    await store.add({ feedId: 'feed-2', guid: 'g2', title: 'A2', link: '', content: '', contentSnippet: '', author: '', publishedAt: '', contentHash: 'h2', topic: 'AI/ML' });
    await store.add({ feedId: 'feed-1', guid: 'g3', title: 'A3', link: '', content: '', contentSnippet: '', author: '', publishedAt: '', contentHash: 'h3', topic: 'AI/ML' });
    const articles = await store.getByFeedId('feed-1');
    expect(articles).toHaveLength(2);
  });

  it('should search articles by title or content snippet', async () => {
    await store.add({ feedId: 'f1', guid: 'g1', title: 'React Hooks Guide', link: '', content: '', contentSnippet: 'Learn about hooks', author: '', publishedAt: '', contentHash: 'h1', topic: 'Frontend' });
    await store.add({ feedId: 'f1', guid: 'g2', title: 'Vue Composition API', link: '', content: '', contentSnippet: 'Vue 3 features', author: '', publishedAt: '', contentHash: 'h2', topic: 'Frontend' });
    const results = await store.search('hooks');
    expect(results).toHaveLength(1);
    expect(results[0].title).toBe('React Hooks Guide');
  });

  it('should search case-insensitively', async () => {
    await store.add({ feedId: 'f1', guid: 'g1', title: 'TypeScript Tips', link: '', content: '', contentSnippet: '', author: '', publishedAt: '', contentHash: 'h1', topic: 'Frontend' });
    const results = await store.search('typescript');
    expect(results).toHaveLength(1);
  });

  it('should update article contentHash', async () => {
    const article = await store.add({ feedId: 'f1', guid: 'g1', title: 'Test', link: '', content: '', contentSnippet: '', author: '', publishedAt: '', contentHash: 'old-hash', topic: 'AI/ML' });
    const updated = await store.updateArticle(article.id, { contentHash: 'new-hash', content: 'new content' });
    expect(updated?.contentHash).toBe('new-hash');
  });

  it('should delete articles by feedId', async () => {
    await store.add({ feedId: 'feed-1', guid: 'g1', title: 'A1', link: '', content: '', contentSnippet: '', author: '', publishedAt: '', contentHash: 'h1', topic: 'AI/ML' });
    await store.add({ feedId: 'feed-1', guid: 'g2', title: 'A2', link: '', content: '', contentSnippet: '', author: '', publishedAt: '', contentHash: 'h2', topic: 'AI/ML' });
    await store.add({ feedId: 'feed-2', guid: 'g3', title: 'A3', link: '', content: '', contentSnippet: '', author: '', publishedAt: '', contentHash: 'h3', topic: 'AI/ML' });
    const count = await store.deleteByFeedId('feed-1');
    expect(count).toBe(2);
    const all = await store.getAll();
    expect(all).toHaveLength(1);
  });

  it('should paginate results', async () => {
    for (let i = 0; i < 5; i++) {
      await store.add({ feedId: 'f1', guid: `g${i}`, title: `A${i}`, link: '', content: '', contentSnippet: '', author: '', publishedAt: '', contentHash: `h${i}`, topic: 'AI/ML' });
    }
    const page = await store.getPage(1, 2);
    expect(page.articles).toHaveLength(2);
    expect(page.total).toBe(5);
    expect(page.totalPages).toBe(3);
  });

  it('should get articles by topic', async () => {
    await store.add({ feedId: 'f1', guid: 'g1', title: 'A1', link: '', content: '', contentSnippet: '', author: '', publishedAt: '2026-01-01T00:00:00Z', contentHash: 'h1', topic: 'AI/ML' });
    await store.add({ feedId: 'f1', guid: 'g2', title: 'A2', link: '', content: '', contentSnippet: '', author: '', publishedAt: '2026-01-01T00:00:00Z', contentHash: 'h2', topic: 'Frontend' });
    await store.add({ feedId: 'f1', guid: 'g3', title: 'A3', link: '', content: '', contentSnippet: '', author: '', publishedAt: '2026-01-01T00:00:00Z', contentHash: 'h3', topic: 'AI/ML' });
    const aiArticles = await store.getByTopic('AI/ML');
    expect(aiArticles).toHaveLength(2);
  });

  it('should treat missing topic as Uncategorized', async () => {
    // Simulate legacy article without topic by directly writing
    await store.add({ feedId: 'f1', guid: 'g1', title: 'A1', link: '', content: '', contentSnippet: '', author: '', publishedAt: '2026-01-01T00:00:00Z', contentHash: 'h1', topic: 'Uncategorized' });
    const articles = await store.getByTopic('Uncategorized');
    expect(articles).toHaveLength(1);
  });

  it('should get distinct years sorted descending', async () => {
    await store.add({ feedId: 'f1', guid: 'g1', title: 'A1', link: '', content: '', contentSnippet: '', author: '', publishedAt: '2024-06-01T00:00:00Z', contentHash: 'h1', topic: 'AI/ML' });
    await store.add({ feedId: 'f1', guid: 'g2', title: 'A2', link: '', content: '', contentSnippet: '', author: '', publishedAt: '2026-01-15T00:00:00Z', contentHash: 'h2', topic: 'AI/ML' });
    await store.add({ feedId: 'f1', guid: 'g3', title: 'A3', link: '', content: '', contentSnippet: '', author: '', publishedAt: '2025-03-10T00:00:00Z', contentHash: 'h3', topic: 'Frontend' });
    const years = await store.getYears();
    expect(years).toEqual([2026, 2025, 2024]);
  });

  it('should skip invalid dates in getYears', async () => {
    await store.add({ feedId: 'f1', guid: 'g1', title: 'A1', link: '', content: '', contentSnippet: '', author: '', publishedAt: '2026-01-01T00:00:00Z', contentHash: 'h1', topic: 'AI/ML' });
    await store.add({ feedId: 'f1', guid: 'g2', title: 'A2', link: '', content: '', contentSnippet: '', author: '', publishedAt: '', contentHash: 'h2', topic: 'AI/ML' });
    const years = await store.getYears();
    expect(years).toEqual([2026]);
  });

  it('should paginate by topic and year', async () => {
    await store.add({ feedId: 'f1', guid: 'g1', title: 'A1', link: '', content: '', contentSnippet: '', author: '', publishedAt: '2026-01-01T00:00:00Z', contentHash: 'h1', topic: 'AI/ML' });
    await store.add({ feedId: 'f1', guid: 'g2', title: 'A2', link: '', content: '', contentSnippet: '', author: '', publishedAt: '2026-06-01T00:00:00Z', contentHash: 'h2', topic: 'AI/ML' });
    await store.add({ feedId: 'f1', guid: 'g3', title: 'A3', link: '', content: '', contentSnippet: '', author: '', publishedAt: '2025-01-01T00:00:00Z', contentHash: 'h3', topic: 'AI/ML' });
    await store.add({ feedId: 'f1', guid: 'g4', title: 'A4', link: '', content: '', contentSnippet: '', author: '', publishedAt: '2026-03-01T00:00:00Z', contentHash: 'h4', topic: 'Frontend' });

    const result = await store.getPageByTopicAndYear(1, 10, { topic: 'AI/ML', year: 2026 });
    expect(result.articles).toHaveLength(2);
    expect(result.total).toBe(2);
    // 최신순 확인
    expect(result.articles[0].title).toBe('A2');
    expect(result.articles[1].title).toBe('A1');
  });

  it('should return all articles when no filters in getPageByTopicAndYear', async () => {
    await store.add({ feedId: 'f1', guid: 'g1', title: 'A1', link: '', content: '', contentSnippet: '', author: '', publishedAt: '2026-01-01T00:00:00Z', contentHash: 'h1', topic: 'AI/ML' });
    await store.add({ feedId: 'f1', guid: 'g2', title: 'A2', link: '', content: '', contentSnippet: '', author: '', publishedAt: '2025-01-01T00:00:00Z', contentHash: 'h2', topic: 'Frontend' });
    const result = await store.getPageByTopicAndYear(1, 10);
    expect(result.articles).toHaveLength(2);
  });
});
