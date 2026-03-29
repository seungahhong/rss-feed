import { sql } from '@vercel/postgres';
import { ArticleStore } from '@/lib/store/article-store';

jest.mock('@vercel/postgres', () => ({
  sql: Object.assign(jest.fn(), { query: jest.fn() }),
}));

const mockedSql = sql as unknown as jest.Mock & { query: jest.Mock };

const makeRow = (overrides: Record<string, unknown> = {}) => ({
  id: 'a1',
  feed_id: 'f1',
  guid: 'guid-1',
  title: 'Test Article',
  link: 'https://example.com/1',
  content: '<p>content</p>',
  content_snippet: 'content',
  author: 'Author',
  published_at: new Date('2026-03-18'),
  content_hash: 'hash123',
  fetched_at: new Date('2026-03-18'),
  topic: 'AI/ML',
  ...overrides,
});

describe('ArticleStore', () => {
  let store: ArticleStore;

  beforeEach(() => {
    store = new ArticleStore();
    jest.clearAllMocks();
  });

  it('should return all articles', async () => {
    mockedSql.mockResolvedValueOnce({ rows: [makeRow()] });
    const articles = await store.getAll();
    expect(articles).toHaveLength(1);
    expect(articles[0].feedId).toBe('f1');
    expect(articles[0].topic).toBe('AI/ML');
  });

  it('should find article by guid', async () => {
    mockedSql.mockResolvedValueOnce({ rows: [makeRow({ guid: 'unique-guid' })] });
    const found = await store.findByGuid('unique-guid');
    expect(found).not.toBeNull();
    expect(found?.guid).toBe('unique-guid');
  });

  it('should return null for non-existent guid', async () => {
    mockedSql.mockResolvedValueOnce({ rows: [] });
    const found = await store.findByGuid('non-existent');
    expect(found).toBeNull();
  });

  it('should add an article', async () => {
    mockedSql.mockResolvedValueOnce({ rows: [makeRow()] });
    const article = await store.add({
      feedId: 'f1', guid: 'guid-1', title: 'Test Article',
      link: 'https://example.com/1', content: '<p>content</p>',
      contentSnippet: 'content', author: 'Author',
      publishedAt: '2026-03-18T00:00:00Z', contentHash: 'hash123', topic: 'AI/ML',
    });
    expect(article.id).toBe('a1');
    expect(article.topic).toBe('AI/ML');
  });

  it('should delete articles by feedId', async () => {
    mockedSql.mockResolvedValueOnce({ rowCount: 3 });
    const count = await store.deleteByFeedId('f1');
    expect(count).toBe(3);
  });

  it('should search articles', async () => {
    mockedSql.mockResolvedValueOnce({ rows: [makeRow({ title: 'React Hooks Guide' })] });
    const results = await store.search('hooks');
    expect(results).toHaveLength(1);
  });

  it('should get years', async () => {
    mockedSql.mockResolvedValueOnce({ rows: [{ year: 2026 }, { year: 2025 }] });
    const years = await store.getYears();
    expect(years).toEqual([2026, 2025]);
  });

  it('should paginate by topic and year', async () => {
    mockedSql.query
      .mockResolvedValueOnce({ rows: [{ count: '2' }] })
      .mockResolvedValueOnce({ rows: [makeRow(), makeRow({ id: 'a2' })] });

    const result = await store.getPageByTopicAndYear(1, 10, { topic: 'AI/ML', year: 2026 });
    expect(result.articles).toHaveLength(2);
    expect(result.total).toBe(2);
  });
});
