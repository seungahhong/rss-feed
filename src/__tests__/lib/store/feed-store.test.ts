import { sql } from '@vercel/postgres';
import { FeedStore } from '@/lib/store/feed-store';

jest.mock('@vercel/postgres', () => ({
  sql: Object.assign(jest.fn(), { query: jest.fn() }),
}));

const mockedSql = sql as unknown as jest.Mock;

describe('FeedStore', () => {
  let store: FeedStore;

  beforeEach(() => {
    store = new FeedStore();
    jest.clearAllMocks();
  });

  it('should return all feeds', async () => {
    const mockRow = {
      id: 'f1',
      url: 'https://example.com/rss',
      name: 'Test',
      category: 'tech',
      active: true,
      last_fetched_at: null,
      last_fetch_status: null,
      last_etag: null,
      last_modified: null,
      snapshot_at: null,
      created_at: new Date('2026-01-01'),
    };
    mockedSql.mockResolvedValueOnce({ rows: [mockRow] });

    const feeds = await store.getAll();
    expect(feeds).toHaveLength(1);
    expect(feeds[0].id).toBe('f1');
    expect(feeds[0].url).toBe('https://example.com/rss');
  });

  it('should return null for non-existent feed', async () => {
    mockedSql.mockResolvedValueOnce({ rows: [] });
    const found = await store.getById('non-existent');
    expect(found).toBeNull();
  });

  it('should add a feed', async () => {
    const mockRow = {
      id: 'f-new',
      url: 'https://example.com/rss',
      name: 'New Feed',
      category: 'tech',
      active: true,
      last_fetched_at: null,
      last_fetch_status: null,
      last_etag: null,
      last_modified: null,
      snapshot_at: null,
      created_at: new Date(),
    };
    mockedSql.mockResolvedValueOnce({ rows: [mockRow] });

    const feed = await store.add({ url: 'https://example.com/rss', name: 'New Feed', category: 'tech' });
    expect(feed.name).toBe('New Feed');
    expect(feed.active).toBe(true);
  });

  it('should delete a feed', async () => {
    mockedSql.mockResolvedValueOnce({ rowCount: 1 });
    const deleted = await store.delete('f1');
    expect(deleted).toBe(true);
  });

  it('should return false when deleting non-existent feed', async () => {
    mockedSql.mockResolvedValueOnce({ rowCount: 0 });
    const deleted = await store.delete('non-existent');
    expect(deleted).toBe(false);
  });
});
