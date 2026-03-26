import { FeedStore } from '@/lib/store/feed-store';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

describe('FeedStore', () => {
  let tmpDir: string;
  let store: FeedStore;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'feed-store-test-'));
    store = new FeedStore(path.join(tmpDir, 'feeds.json'));
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it('should return empty feeds initially', async () => {
    const feeds = await store.getAll();
    expect(feeds).toEqual([]);
  });

  it('should add a feed and return it with generated id and timestamps', async () => {
    const feed = await store.add({ url: 'https://example.com/rss', name: 'Test', category: 'tech' });
    expect(feed.id).toBeDefined();
    expect(feed.url).toBe('https://example.com/rss');
    expect(feed.name).toBe('Test');
    expect(feed.active).toBe(true);
    expect(feed.createdAt).toBeDefined();
  });

  it('should get a feed by id', async () => {
    const created = await store.add({ url: 'https://example.com/rss', name: 'Test', category: 'tech' });
    const found = await store.getById(created.id);
    expect(found).toEqual(created);
  });

  it('should return null for non-existent feed id', async () => {
    const found = await store.getById('non-existent');
    expect(found).toBeNull();
  });

  it('should delete a feed by id', async () => {
    const feed = await store.add({ url: 'https://example.com/rss', name: 'Test', category: 'tech' });
    const deleted = await store.delete(feed.id);
    expect(deleted).toBe(true);
    const feeds = await store.getAll();
    expect(feeds).toHaveLength(0);
  });

  it('should return false when deleting non-existent feed', async () => {
    const deleted = await store.delete('non-existent');
    expect(deleted).toBe(false);
  });

  it('should update a feed', async () => {
    const feed = await store.add({ url: 'https://example.com/rss', name: 'Test', category: 'tech' });
    const updated = await store.updateFeed(feed.id, { name: 'Updated', active: false });
    expect(updated?.name).toBe('Updated');
    expect(updated?.active).toBe(false);
    expect(updated?.url).toBe('https://example.com/rss');
  });

  it('should return null when updating non-existent feed', async () => {
    const updated = await store.updateFeed('non-existent', { name: 'Updated' });
    expect(updated).toBeNull();
  });
});
